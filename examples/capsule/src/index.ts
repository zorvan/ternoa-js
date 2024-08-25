import * as fs from "fs"
//import {Buffer} from "buffer"

//import pkg from 'ternoa-js';

import { generateSSSKey, initializeApi } from "ternoa-js"
//const { generateSSSKey, initializeApi } = pkg;
import { File } from "formdata-node"

import { getCapsuleNFTPrivateKey, mintCapsuleNFT } from "ternoa-js"
//const { getCapsuleNFTPrivateKey, mintCapsuleNFT } = pkg;
import { getKeyringFromSeed } from "ternoa-js"
//const { getKeyringFromSeed } = pkg;

import { encryptCapsuleFile, TernoaIPFS } from "ternoa-js"
//const { encryptCapsuleFile, TernoaIPFS } = pkg;

//import type { buffer } from "stream/consumers"

//const SEED_TEST_FUNDS_PUBLIC="5CcqaTBwWvbB2MvmeteSDLVujL3oaFHtdf24pPVT3Xf8v7tC"
const CHAIN_ENDPOINT = "wss://alphanet.ternoa.com"
const STORE_CLUSTER_ID = 2
const RETRIEVE_CLUSTER_ID = 3
const SEED = "fill it with your seed"
const IPFS_NODE_URL = "https://ipfs-dev.trnnfr.com"
const IPFS_API_KEY = "fill it with your api key"

const FILE = "public.jpg"
const SECRET_FILE = "secret.jpg"

function delay(ms: number) {
  return new Promise( resolve => setTimeout(resolve, ms) );
}

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
    const keys =  await generateSSSKey()
    
    const privateKey = keys[0]?keys[0]:"aBcDeFgHiJkLmNoPqRsTuVwXyZ012345";
    const publicKey = keys[1]?keys[1]:"aBcDeFgHiJkLmNoPqRsTuVwXyZ012345";
    
    //console.log("Encryption Key = ",privateKey)

    console.log("Encrypting the Media ...")
    const encryptedMedia = [
      {
        encryptedFile: await encryptCapsuleFile(secretNftFile, privateKey, publicKey),
        type: secretNftFile.type,
        ...capsuleMediaMetadata,
      },
    ]

    console.log("Minting the Capsule ...")
    const mintCapasuleRes = await mintCapsuleNFT(
      owner,
      ipfsClient,
      [privateKey, publicKey],
      nftFile,
      nftMetadata,
      encryptedMedia,
      capsuleNFTMetadata,
      STORE_CLUSTER_ID,
    )
    
    //console.log("RESULT = ", mintCapasuleRes)

    if (mintCapasuleRes && mintCapasuleRes.clusterResponse) {
     const nftid = mintCapasuleRes?.clusterResponse[0]?.nft_id;
     if (nftid) {
       console.log("Capsule NFTID = ", nftid)

       if (RETRIEVE_CLUSTER_ID as number != STORE_CLUSTER_ID as number) {
        console.log("Waiting a few seconds for cluster synchronization ...")
        await delay(15000)
       }

        try {
          const recPrivateKey = await getCapsuleNFTPrivateKey(
            nftid,
            owner,
            "OWNER",
            undefined,
            RETRIEVE_CLUSTER_ID,
          )

          //console.log("Reconstructed Decryption Key = ", recPrivateKey)
          if (recPrivateKey == privateKey) {
            console.log("Capsule Retrieve Successful!")
            //const capsuleMedia = await decryptFile(encryptedMedia[0]?.encryptedFile!, recPrivateKey)
          }
        } catch (e) {
          console.log(e)
        }
      }
    }
  } catch (e) {
    console.log(e)
  } finally {
    process.exit()
  }
}

capsule()
