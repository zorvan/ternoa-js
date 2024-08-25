import * as openpgp from "openpgp"
import { File } from "formdata-node"

//import { generatesecret } from "vsss-wasm"

import { PGPKeysType } from "./types"
import { convertFileToBuffer } from "./utils"
import { generatesecret } from "vsss-wasm";
//import CryptoJS from "crypto-js"

/**
 * @name generateSSSKey
 * @summary                 Generates a new scalar for verifiable secret sharing.
 * @returns                 A compatible secret for verifiable prime-field secret sharing.
 */
export const generateSSSKey = async (): Promise<string[]> => {
  
  const vsss = await import.meta.resolve('vsss-wasm');
  const secretScalar = await import(vsss).then(generatesecret);
  //const secretStr = arrayToBase64(secretScalar)
  //const secretHash = CryptoJS.SHA256(secretStr).toString()

  const privateKey = await openpgp.readKey({ binaryKey: secretScalar })
  const privateKeyArmor = privateKey.armor()

  const publicKeyStr = privateKey.toPublic().armor()

  return [privateKeyArmor, publicKeyStr]
}

/**
 * @name generateSSSKeypairFromScalar
 * @summary                 Generates a new keypair from a scalar which is compatible to secret sharing
 * @returns                 A compatible secret for verifiable prime-field secret sharing and a publickey
 */
export const generateKeypairFromScalar = async (secretScalar: Uint8Array): Promise<PGPKeysType> => {
  const privateKey = await openpgp.readKey({ binaryKey: secretScalar })
  const privateKeyArmor = privateKey.armor()

  const publicKeyStr = privateKey.toPublic().armor()
  
  return { privateKey: privateKeyArmor, publicKey: publicKeyStr }
}


/**
 * @name generatePGPKeys
 * @summary                 Generates a new PGP key pair.
 * @returns                 An object with both private and public PGP keys.
 */
// export const generatePGPKeys = async (): Promise<PGPKeysType> => {
//   const { privateKey, publicKey } = await openpgp.generateKey({
//     type: "ecc",
//     curve: "curve25519",
//     userIDs: [{ name: "Capsule Corp", email: "dev@ternoa.com" }],
//   })

//   return { privateKey, publicKey }
// }

/**
 * @name encryptContent
 * @summary                 Encrypts a content (string).
 * @param content           Content to encrypt.
 * @param privatePGPKey     Private Key to encrypt the content.
 * @see                     Learn more about encryption {@link https://docs.openpgpjs.org/global.html#encrypt here}.
 * @returns                 A string containing the encrypted content.
 */
export const encryptSecretContent = async (content: string, privateKey: string) => {
  const message = await openpgp.createMessage({
    text: content,
  })
  
  const encryptedContent = await openpgp.encrypt({
    message,
    passwords: [privateKey],
  })

  return encryptedContent as string
}


/**
 * @name encryptSecretFile
 * @summary                 Encrypts file with the public key (Symmetric).
 * @param file              File to encrypt.
 * @param privateKey        Private Key to encrypt the message.
 * @see                     Learn more about encryption {@link https://docs.openpgpjs.org/global.html#encrypt here}.
 * @returns                 A string containing the encrypted file.
 */
export const encryptSecretFile = async (file: File, privateKey: string) => {
  const buffer = await convertFileToBuffer(file)
  const content = buffer.toString("base64")
  const encryptedFile = await encryptSecretContent(content, privateKey)

  return encryptedFile
}

/**
 * @name decryptSecretFile
 * @summary                 Decrypts message with the private key (Symmetric).
 * @param encryptedMessage  Message to decrypt.
 * @param privateKey        Private Key to decrypt the message.
 * @see                     Learn more about encryption {@link https://docs.openpgpjs.org/global.html#decrypt here}.
 * @returns                 A base64 string containing the decrypted message.
 */
export const decryptSecretFile = async (encryptedMessage: string, privateKey: string) => {
  const message = await openpgp.readMessage({
    armoredMessage: encryptedMessage,
  })

    const { data: decryptedMessage } = await openpgp.decrypt({
    message,
    passwords: [privateKey],
  })

  return decryptedMessage as string
}


/**
 * @name encryptCapsuleContent
 * @summary                 Encrypts a content (string).
 * @param content           Content to encrypt.
 * @param privatePGPKey     Private Key to encrypt the content.
 * @see                     Learn more about encryption {@link https://docs.openpgpjs.org/global.html#encrypt here}.
 * @returns                 A string containing the encrypted content.
 */
export const encryptCapsuleContent = async (content: string, privateKey: string, publicKey: string) => {
  const message = await openpgp.createMessage({
    text: content,
  })
  
  const encryptedContent = await openpgp.encrypt({
    message,
    encryptionKeys: await openpgp.readKey({armoredKey: publicKey}),
    signingKeys: await openpgp.readPrivateKey({armoredKey: privateKey})
  })

  return encryptedContent as string
}

/**
 * @name encryptCapsuleFile
 * @summary                 Encrypts file with the public key.
 * @param file              File to encrypt.
 * @param privateKey        Private Key to encrypt the message.
 * @see                     Learn more about encryption {@link https://docs.openpgpjs.org/global.html#encrypt here}.
 * @returns                 A string containing the encrypted file.
 */
export const encryptCapsuleFile = async (file: File, privateKey: string, publiceKey: string) => {
  const buffer = await convertFileToBuffer(file)
  const content = buffer.toString("base64")
  const encryptedFile = await encryptCapsuleContent(content, privateKey, publiceKey)

  return encryptedFile
}

/**
 * @name decryptCapsuleFile
 * @summary                 Decrypts message with the private key.
 * @param encryptedMessage  Message to decrypt.
 * @param privateKey        Private Key to decrypt the message.
 * @see                     Learn more about encryption {@link https://docs.openpgpjs.org/global.html#decrypt here}.
 * @returns                 A base64 string containing the decrypted message.
 */
export const decryptCapsuleFile = async (encryptedMessage: string, privateKey: string, publicKey: string) => {
  const message = await openpgp.readMessage({
    armoredMessage: encryptedMessage,
  })

  //const privateKeyHash = CryptoJS.SHA256(privateKey.write().toString()).toString();

  const { data: decryptedMessage } = await openpgp.decrypt({
    message,
    verificationKeys: await openpgp.readKey({armoredKey: publicKey}),
    decryptionKeys: await openpgp.readPrivateKey({armoredKey: privateKey})
  })

  return decryptedMessage as string
}
