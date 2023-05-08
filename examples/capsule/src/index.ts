import * as fs from "fs"
import { initializeApi } from "ternoa-js"
import { File } from "formdata-node"

import { getCapsuleNFTPrivateKey, mintCapsuleNFT } from "ternoa-js"
import { getKeyringFromSeed } from "ternoa-js"
import { encryptFile, generatePGPKeys, TernoaIPFS } from "ternoa-js"

//const SEED_TEST_FUNDS_PUBLIC="5CcqaTBwWvbB2MvmeteSDLVujL3oaFHtdf24pPVT3Xf8v7tC"
const CHAIN_ENDPOINT = "wss://dev-0.ternoa.network"
const CLUSTER_ID = 0
const SEED = "hockey fine lawn number explain bench twenty blue range cover egg sibling"
const IPFS_NODE_URL = "https://ipfs-dev.trnnfr.com"
const IPFS_API_KEY = "98791fae-d947-450b-a457-12ecf5d9b858"
const FILE = "public.jpg"
const SECRET_FILE = "secret.jpg"

const capsule = async () => {
  const nftMetadata = {
    title: "Public NFT Metadata title",
    description: "Public NFT Metadata description",
  }
  const capsuleNFTMetadata = {
    name: "Public Capsule Metadata title",
    description: "Public Capsule Metadata description",
    properties: {
      title: "Capsule - property title",
      description: "Capsule - property desc",
      testRandomString: "Ternoa",
    },
  }
  const capsuleMediaMetadata = {
    name: "Capsule Media Metadata title to be crypted",
    description: "Capsule Media Metadata description to be crypted",
  }
  const nftFile = new File([await fs.promises.readFile(FILE)], FILE, {
    type: "image/jpg",
  })
  const secretNftFile = new File([await fs.promises.readFile(SECRET_FILE)], "Title", {
    type: "image/jpg",
  })

  try {
    await initializeApi(CHAIN_ENDPOINT)
    const ipfsClient = new TernoaIPFS(new URL(IPFS_NODE_URL), IPFS_API_KEY)
    const owner = await getKeyringFromSeed(SEED)
    const keys = await generatePGPKeys()

    const encryptedMedia = [
      {
        encryptedFile: await encryptFile(secretNftFile, keys.publicKey),
        type: secretNftFile.type,
        ...capsuleMediaMetadata,
      },
    ]
    const mintCapasuleRes = await mintCapsuleNFT(
      owner,
      ipfsClient,
      keys,
      nftFile,
      nftMetadata,
      encryptedMedia,
      capsuleNFTMetadata,
      CLUSTER_ID,
    )
    console.log(mintCapasuleRes)
    if (mintCapasuleRes && mintCapasuleRes.clusterResponse) {
      const nftid = mintCapasuleRes?.clusterResponse[0]?.nft_id;
      if (nftid) {
        const privateKey = await getCapsuleNFTPrivateKey(
          nftid,
          owner,
          "OWNER",
          undefined,
          0,
        )

        console.log(privateKey)
      }
    }
  } catch (e) {
    console.log(e)
  } finally {
    process.exit()
  }
}

capsule()
