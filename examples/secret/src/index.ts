import * as fs from "fs"
import { initializeApi } from "ternoa-js"
import { File } from "formdata-node"

import { viewSecretNFT, mintSecretNFT } from "ternoa-js"
import { getKeyringFromSeed } from "ternoa-js"
import { TernoaIPFS } from "ternoa-js"

//const SEED_TEST_FUNDS_PUBLIC="5CcqaTBwWvbB2MvmeteSDLVujL3oaFHtdf24pPVT3Xf8v7tC"
const CHAIN_ENDPOINT = "wss://alphanet.ternoa.com"
const CLUSTER_ID = 0
const SEED = "hockey fine lawn number explain bench twenty blue range cover egg sibling"
const IPFS_NODE_URL = "https://ipfs-dev.trnnfr.com"
const IPFS_API_KEY = "98791fae-d947-450b-a457-12ecf5d9b858"
const FILE = "public.jpg"
const SECRET_FILE = "secret.jpg"

const secret = async () => {
  try {
    await initializeApi(CHAIN_ENDPOINT)
    const ipfsClient = new TernoaIPFS(new URL(IPFS_NODE_URL), IPFS_API_KEY)
    const owner = await getKeyringFromSeed(SEED)

    const nftFile = new File([await fs.promises.readFile(FILE)], FILE, {
      type: "image/jpg",
    })
    const nftMetadata = {
      title: "public NFT",
      description: "public NFT",
    }

    const secretNftFile = new File([await fs.promises.readFile(SECRET_FILE)], SECRET_FILE, {
      type: "image/jpg",
    })
    const secretNftMetadata = {
      title: "secret NFT",
      description: "secret NFT",
    }

    //6. request to store a batch of secret shares to the enclave
    const mintingRes = await mintSecretNFT(
      nftFile,
      nftMetadata,
      secretNftFile,
      secretNftMetadata,
      ipfsClient,
      owner,
      CLUSTER_ID,
    )
    console.log(mintingRes)
    const nftId = mintingRes?.clusterResponse[0]?.nft_id
    console.log(nftId)
    if (nftId) {
      const viewRes = await viewSecretNFT(nftId, ipfsClient, owner, "OWNER", undefined, CLUSTER_ID)
      console.log(viewRes)
	  }
  } catch (e) {
    console.log(e)
  } finally {
    process.exit()
  }
}

secret()
