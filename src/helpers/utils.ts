import BN from "bn.js"
import { File } from "formdata-node"
import { Buffer } from "buffer"

import { balanceToNumber } from "../blockchain"
import { Errors } from "../constants"
import { RetryUploadErrorType } from "./types"

/**
 * @name convertFileToBuffer
 * @summary                 Converts a File to Buffer.
 * @param file              File to convert.
 * @returns                 A Buffer.
 */
export const convertFileToBuffer = async (file: File): Promise<Buffer> => {
  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  return buffer
}

/**
 * @name formatPermill
 * @summary         Checks that percent is in range 0 to 100 and format to permill.
 * @param percent   Number in range from 0 to 100 with max 4 decimals.
 * @returns         The formated percent in permill format.
 */
export const formatPermill = (percent: number): number => {
  if (percent > 100 || percent < 0) {
    throw new Error(Errors.MUST_BE_PERCENTAGE)
  }

  return parseFloat(percent.toFixed(4)) * 10000
}

export const roundBalance = (amount: string) =>
  Number(balanceToNumber(new BN(amount), { forceUnit: "-", withUnit: false }).split(",").join(""))

export const removeURLSlash = (url: string) => {
  if (url.length === 0) return url
  const lastChar = url.charAt(url.length - 1)
  if (lastChar === "/") {
    return url.slice(0, -1)
  } else {
    return url
  }
}

export const retryPost = async <T>(fn: () => Promise<any>, n: number): Promise<T | RetryUploadErrorType> => {
  let lastError: RetryUploadErrorType | undefined

  for (let i = 0; i < n; i++) {
    try {
      return await fn()
    } catch (err: any) {
      lastError = {
        isRetryError: true,
        status: "SDK_RETRY_POST_ERROR",
        message: err?.message ? err.message : JSON.stringify(err),
      }
    }
  }

  return lastError as RetryUploadErrorType
}

export const ensureHttps = (url: string) => {
  if (!url) throw new Error(Errors.URL_UNDEFINED)
  if (url.indexOf("https://") === 0) return url
  else if (url.indexOf("http://") === 0) return url.replace("http://", "https://")
  else return "https://" + url
}

export const timeoutTrigger = <T>(fn: () => Promise<T>, duration = 10000): Promise<T> => {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error("Error: Function timed out"))
    }, duration)

    try {
      const data = fn()
      clearTimeout(timer)
      resolve(data)
    } catch (error) {
      clearTimeout(timer)
      reject(error)
    }
  })
}

export function base64ToArray (b64encoded: string) {
  const u8 = new Uint8Array(
      atob(b64encoded).split("").map(
          function(c) {
              return c.charCodeAt(0);
          }
      ));

  return u8;
}

export function arrayToBase64 (byteArray: Uint8Array) {
  const numArray = Array.from(byteArray)
  return btoa(String.fromCharCode.apply(null, numArray));
}
