import { IKeyringPair } from "@polkadot/types/types"
import { mnemonicGenerate } from "@polkadot/util-crypto"
import { File } from "formdata-node"

import { TernoaIPFS } from "./ipfs"
import { decryptFile, encryptFile, generateSSSKey } from "./encryption"
import {
  combineKeyShares,
  formatStorePayload,
  formatRetrievePayload,
  generateKeyShares,
  getEnclaveHealthStatus,
  teeKeySharesRetrieve,
  teeKeySharesStore,
  SIGNER_BLOCK_VALIDITY,
} from "./tee"
import { CapsuleMedia, MediaMetadataType, NftMetadataType, RequesterType } from "./types"
import { getLastBlock, getSignatureFromExtension, getSignatureFromKeyring } from "./crypto"

import { getKeyringFromSeed } from "../account"
import { Errors, WaitUntil } from "../constants"
import { createCapsule, createSecretNft, getSecretNftOffchainData } from "../nft"
import { isValidAddress } from "../blockchain"

/**
 * @name secretNftEncryptAndUploadFile
 * @summary                 Encrypts and uploads a file on an IFPS gateway.
 * @param file              File to encrypt and then upload on IPFS.
 * @param privatePGPKey     Private Key to encrypt the file.
 * @param ipfsClient        A TernoaIPFS instance.
 * @param nftMetadata       Optional secret NFT metadata (Title, Description, (...)) {@link https://github.com/capsule-corp-ternoa/ternoa-proposals/blob/main/TIPs/tip-510-Secret-nft.md here}.
 * @param mediaMetadata     Optional asset NFT metadata (Name, Description, (...)) {@link https://github.com/capsule-corp-ternoa/ternoa-proposals/blob/main/TIPs/tip-510-Secret-nft.md here}.
 * @returns                 The data object with the secret NFT IPFS hash (ex: to add as offchain secret metadatas in the extrinsic).
 */
export const secretNftEncryptAndUploadFile = async (
  file: File,
  privatePGPKey: string,
  publicPGPKey: string,
  ipfsClient: TernoaIPFS,
  nftMetadata?: Partial<NftMetadataType>,
  mediaMetadata?: MediaMetadataType,
) => {
  if (!file) throw new Error(`${Errors.IPFS_FILE_UPLOAD_ERROR} - File undefined`)
  const encryptedFile = await encryptFile(file, privatePGPKey)
  const ipfsRes = await ipfsClient.storeSecretNFT(encryptedFile, file.type, publicPGPKey, nftMetadata, mediaMetadata)

  return ipfsRes
}

/**
 * @name getTemporarySignerKeys
 * @summary                 Generates a temporary signer account with soft-derivation
 * @param address           The owner address
 * @param lastBlockId       The last chain block number: Use our asyncronous getLastBlock() helper.
 * @returns                 A temporary signing key pair.
 */
export const getTemporarySignerKeys = async (address: string, lastBlockId: number) => {
  const tmpSignerMnemonic = mnemonicGenerate()
  const tmpSignerPair = await getKeyringFromSeed(tmpSignerMnemonic, undefined, `${lastBlockId}_${address}`)
  return tmpSignerPair
}

/**
 * @name prepareAndStoreKeyShares
 * @summary                  Splits the private key into shards, format and send them for upload on to a Tee Cluster.
 * @param privateKey         The private key to be splited with Shamir algorithm.
 * @param signer             Account owner of the private key to split (keyring) or address (string) .
 * @param nftId              The Capsule NFT id or Secret NFT id to link to the private key.
 * @param kind               The kind of nft linked to the key to upload: "secret" or "capsule".
 * @param extensionInjector  (Optional)The signer method retrived from your extension to sign the transaction. We recommand Polkadot extention: object must have a signer key.
 * @param clusterId          (Optional)The TEE Cluster id. Default is set to cluster id 0.
 * @returns                  The TEE enclave response (shards datas and description).
 */
export const prepareAndStoreKeyShares = async (
  privateKey: string,
  signer: IKeyringPair | string,
  nftId: number,
  kind: "secret" | "capsule",
  extensionInjector?: Record<string, any>,
  clusterId = 0,
) => {
  if (kind !== "secret" && kind !== "capsule") {
    throw new Error(`${Errors.TEE_UPLOAD_ERROR} : Kind must be either "secret" or "capsule"`)
  }
  if (typeof signer === "string" && !extensionInjector)
    throw new Error(
      `${Errors.TEE_UPLOAD_ERROR} - INJECTOR_SIGNER_MISSING : injectorSigner must be provided when signer is of type string`,
    )
  if (typeof signer === "string" && !isValidAddress(signer)) throw new Error("INVALID_ADDRESS_FORMAT")

  // 0. retrieve last chain block number and generate a temporary signer account with soft-derivation
  const lastBlockId = await getLastBlock()
  const tmpSignerPair = await getTemporarySignerKeys(typeof signer === "string" ? signer : signer.address, lastBlockId)
  // 1. generate secret shares from the private key

  const shares = generateKeyShares(privateKey)

  // 2. format payloads with temporary signer account
  const signerAddress = typeof signer === "string" ? signer : signer.address
  const authMessage = `<Bytes>${tmpSignerPair.address}_${lastBlockId}_${SIGNER_BLOCK_VALIDITY}</Bytes>`
  const authSignature =
    typeof signer === "string"
      ? extensionInjector && (await getSignatureFromExtension(signer, extensionInjector, authMessage))
      : getSignatureFromKeyring(signer, authMessage)
  if (!authSignature)
    throw new Error(
      `${Errors.TEE_UPLOAD_ERROR} : signing of the temporary authentication message failed when uploading payload`,
    )
  const payloads = await Promise.all(
    shares.map((share: string) =>
      formatStorePayload(signerAddress, authMessage, authSignature, tmpSignerPair, nftId, share, lastBlockId),
    ),
  )
  // 3. request to store a batch of secret shares to the enclave
  return await teeKeySharesStore(clusterId, kind, payloads)
}

/**
 * @name mintSecretNFT
 * @summary                  Encrypts your data to create a secret NFT on-chain and uploads your key's shards on a TEE.
 * @param nftFile            File to upload as the preview of the encrypted NFT.
 * @param nftMetadata        NFT metadata (Title, Description).
 * @param secretNftFile      File to encrypt and then upload on IPFS.
 * @param secretNftMetadata  Secret NFT metadata (Title, Description).
 * @param ipfsClient         A TernoaIPFS instance.
 * @param ownerPair          Account of the secret NFT's owner.
 * @param clusterId          The TEE Cluster id. Default is set to cluster id 0.
 * @param royalty            Percentage of all second sales that the secret NFT creator will receive. Default is 0%. It's a decimal number in range [0, 100].
 * @param collectionId       The collection to which the secret NFT belongs. Optional Parameter: Default is undefined.
 * @param isSoulbound        If true, makes the secret NFT intransferable. Default is false.
 * @param waitUntil          Execution trigger that can be set either to BlockInclusion or BlockFinalization. Default is BlockInclusion.
 * @returns                  A JSON including both secretNftEvent & TEE enclave response (shards datas and description).
 */
export const mintSecretNFT = async (
  nftFile: File,
  nftMetadata: NftMetadataType,
  secretNftFile: File,
  secretNftMetadata: NftMetadataType,
  ipfsClient: TernoaIPFS,
  ownerPair: IKeyringPair,
  clusterId = 0,
  royalty = 0,
  collectionId: number | undefined = undefined,
  isSoulbound = false,
  waitUntil = WaitUntil.BlockInclusion,
) => {
  // 0. query Enclave with /Health API
  await getEnclaveHealthStatus(clusterId)

  // 1. media encryption and upload
  const [privateKey,publicKey] = await generateSSSKey()
  const { Hash: offchainDataHash } = await ipfsClient.storeNFT(nftFile, nftMetadata)
  const { Hash: secretOffchainDataHash } = await secretNftEncryptAndUploadFile(
    secretNftFile,
    privateKey,
    publicKey,
    ipfsClient,
    secretNftMetadata,
  )

  // 2. secret NFT minting
  const secretNftEvent = await createSecretNft(
    offchainDataHash,
    secretOffchainDataHash,
    royalty,
    collectionId,
    isSoulbound,
    ownerPair,
    waitUntil,
  )

  // 3. request to format and store a batch of secret shares to the enclave
  const teeRes = await prepareAndStoreKeyShares(privateKey, ownerPair, secretNftEvent.nftId, "secret", undefined, clusterId)

  return {
    event: secretNftEvent,
    clusterResponse: teeRes,
  }
}

/**
 * @name viewSecretNFT
 * @summary                  Retrieves and decrypts the secret NFT hash.
 * @param nftId              The secret NFT id.
 * @param ipfsClient         A TernoaIPFS instance.
 * @param requester          Account of the secret NFT's owner(keyring) or address (string) or the decrypter account if NFT is delegated or rented.
 * @param requesterRole      Kind of the secret NFT's decrypter: it can be either "OWNER", "DELEGATEE" or "RENTEE"
 * @param extensionInjector  (Optional) The signer method retrived from your extension: object must have a signer key.
 * @param clusterId          (Optional)The TEE Cluster id. Default is set to cluster id 0.
 * @returns                  A string containing the secretNFT decrypted content.
 */
export const viewSecretNFT = async (
  nftId: number,
  ipfsClient: TernoaIPFS,
  requester: IKeyringPair | string,
  requesterRole: RequesterType,
  extensionInjector?: Record<string, any>,
  clusterId = 0,
) => {
  // 0. query Enclave with /Health API
  await getEnclaveHealthStatus(clusterId)

  // 1. Get Secret NFT metadata hash
  const secretNftOffchainData = await getSecretNftOffchainData(nftId)
  const secretNftData = (await ipfsClient.getFile(secretNftOffchainData)) as any
  const encryptedSecretOffchainData = (await ipfsClient.getFile(
    secretNftData.properties.encrypted_media.hash,
  )) as string

  // 2. Format and retrieve payload
  const lastBlockId = await getLastBlock()
  const payload = await formatRetrievePayload(
    requester,
    requesterRole,
    nftId,
    lastBlockId,
    SIGNER_BLOCK_VALIDITY,
    extensionInjector,
  )
  const shares = await teeKeySharesRetrieve(clusterId, "secret", payload)

  // 3. Combine shares
  const privateKey = combineKeyShares(shares)

  // 4. Decrypt file to base 64
  const decryptedBase64 = await decryptFile(encryptedSecretOffchainData, privateKey)
  return decryptedBase64
}

/**
 * @name mintCapsuleNFT
 * @summary                   Create a Capsule NFT and uploads your key's shards on a TEE.
 * @param owner               Account of the Capsule NFT's owner.
 * @param ipfsClient          A TernoaIPFS instance.
 * @param keys                Public and Private keys used to encrypt the file.
 * @param nftFile             File to upload as the preview of the Capsule NFT.
 * @param nftMetadata         The NFT preview metadata (Title, Description).
 * @param encryptedMedia      The array containing all the Capsule NFT encrypted media.
 * @param capsuleMetadata     (Optional) The Capusle NFT public metadata (Title, Description...).
 * @param clusterId           The TEE Cluster id. Default is 0
 * @param capsuleRoyalty      Percentage of all second sales that the capsule creator will receive. Default is 0%. It's a decimal number in range [0, 100].
 * @param capsuleCollectionId The collection to which the capsule NFT belongs. Optional Parameter: Default is undefined.
 * @param isSoulbound         If true, makes the Capsule intransferable. Default is false.
 * @param waitUntil           Execution trigger that can be set either to BlockInclusion or BlockFinalization. Default is BlockInclusion.
 * @returns                   A JSON including both capsuleEvent & TEE enclave response (shards datas and description).
 */
export const mintCapsuleNFT = async (
  ownerPair: IKeyringPair,
  ipfsClient: TernoaIPFS,
  keys: string[],
  nftFile: File,
  nftMetadata: NftMetadataType,
  encryptedMedia: CapsuleMedia[],
  capsuleMetadata?: Partial<NftMetadataType>,
  clusterId = 0,
  capsuleRoyalty = 0,
  capsuleCollectionId: number | undefined = undefined,
  isSoulbound = false,
  waitUntil = WaitUntil.BlockInclusion,
) => {
  // 0. query Enclave with /Health API
  await getEnclaveHealthStatus(clusterId)

  // 1. media encryption and upload
  const { Hash: offchainDataHash } = await ipfsClient.storeNFT(nftFile, nftMetadata)
  const { Hash: capsuleOffchainDataHash } = await ipfsClient.storeCapsuleNFT(
    keys[1],
    encryptedMedia,
    capsuleMetadata,
  )

  // 2. capsule NFT minting
  const capsuleEvent = await createCapsule(
    offchainDataHash,
    capsuleOffchainDataHash,
    capsuleRoyalty,
    capsuleCollectionId,
    isSoulbound,
    ownerPair,
    waitUntil,
  )

  // 3. request to format and store a batch of secret shares to the enclave
  const teeRes = await prepareAndStoreKeyShares(keys[0], ownerPair, capsuleEvent.nftId, "capsule", undefined, clusterId)
  
  return {
    event: capsuleEvent,
    clusterResponse: teeRes,
  }
}

/**
 * @name getCapsuleNFTPrivateKey
 * @summary                  Retrieves the capsule NFT private key to decrypt the secret hashes from properties.
 * @param nftId              The capsule NFT id.
 * @param requester          Account of the capsule NFT's owner (keyring) or address (string) or the decrypter account or address if NFT is delegated or rented.
 * @param requesterRole      Kind of the capsule NFT's decrypter: it can be either "OWNER", "DELEGATEE" or "RENTEE"
 * @param extensionInjector  (Optional) The signer method retrived from your extension: object must have a signer key.
 * @param clusterId          (Optional) The TEE Cluster id. Default is set to 0.
 * @returns                  A string containing the capsule NFT private key.
 */
export const getCapsuleNFTPrivateKey = async (
  nftId: number,
  requester: IKeyringPair | string,
  requesterRole: RequesterType,
  extensionInjector?: Record<string, any>,
  clusterId = 0,
): Promise<string> => {
  // 0. query Enclave with /Health API
  await getEnclaveHealthStatus(clusterId)
  // 1. Format and retrieve payload
  const lastBlockId = await getLastBlock()
  const payload = await formatRetrievePayload(
    requester,
    requesterRole,
    nftId,
    lastBlockId,
    SIGNER_BLOCK_VALIDITY,
    extensionInjector,
  )
  const shares = await teeKeySharesRetrieve(clusterId, "capsule", payload)
  // 3. Combine Key
  return combineKeyShares(shares)
}
