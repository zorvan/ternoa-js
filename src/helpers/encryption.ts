import * as openpgp from "openpgp"
import { File } from "formdata-node"
import { generate_secret } from "vsss-wasm"

import { PGPKeysType } from "./types"
import { convertFileToBuffer } from "./utils"
import CryptoJS from "crypto-js"

/**
 * @name generateSSSKey
 * @summary                 Generates a new scalar for verifiable secret sharing.
 * @returns                 A compatible secret for verifiable prime-field secret sharing.
 */
export const generateSSSKey = async (): Promise<string[]> => {
  const secretScalar = await generate_secret().toString()
  const secretHash = CryptoJS.SHA256(secretScalar).toString()

  return [secretScalar, secretHash]
}

/**
 * @name generatePGPKeys
 * @summary                 Generates a new PGP key pair.
 * @returns                 An object with both private and public PGP keys.
 */
export const generatePGPKeys = async (): Promise<PGPKeysType> => {
  const { privateKey, publicKey } = await openpgp.generateKey({
    type: "ecc",
    curve: "curve25519",
    userIDs: [{ name: "Capsule Corp", email: "dev@ternoa.com" }],
  })

  return { privateKey, publicKey }
}

/**
 * @name encryptContent
 * @summary                 Encrypts a content (string).
 * @param content           Content to encrypt.
 * @param privatePGPKey     Private Key to encrypt the content.
 * @see                     Learn more about encryption {@link https://docs.openpgpjs.org/global.html#encrypt here}.
 * @returns                 A string containing the encrypted content.
 */
export const encryptContent = async (content: string, privateKey: string) => {
  const message = await openpgp.createMessage({
    text: content,
  })
  
  //const privateKeyHash = CryptoJS.SHA256(privateKey.write().toString()).toString();

  const encryptedContent = await openpgp.encrypt({
    message,
    passwords: [privateKey],
  })

  return encryptedContent as string
}

/**
 * @name encryptFile
 * @summary                 Encrypts file with the public key.
 * @param file              File to encrypt.
 * @param privateKey        Private Key to encrypt the message.
 * @see                     Learn more about encryption {@link https://docs.openpgpjs.org/global.html#encrypt here}.
 * @returns                 A string containing the encrypted file.
 */
export const encryptFile = async (file: File, privateKey: string) => {
  const buffer = await convertFileToBuffer(file)
  const content = buffer.toString("base64")
  const encryptedFile = await encryptContent(content, privateKey)

  return encryptedFile
}

/**
 * @name decryptFile
 * @summary                 Decrypts message with the private key.
 * @param encryptedMessage  Message to decrypt.
 * @param privateKey        Private Key to decrypt the message.
 * @see                     Learn more about encryption {@link https://docs.openpgpjs.org/global.html#decrypt here}.
 * @returns                 A base64 string containing the decrypted message.
 */
export const decryptFile = async (encryptedMessage: string, privateKey: string) => {
  const message = await openpgp.readMessage({
    armoredMessage: encryptedMessage,
  })

  //const privateKeyHash = CryptoJS.SHA256(privateKey.write().toString()).toString();

  const { data: decryptedMessage } = await openpgp.decrypt({
    message,
    passwords: [privateKey],
  })

  return decryptedMessage as string
}
