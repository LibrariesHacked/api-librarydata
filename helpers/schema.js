import { get } from 'axios'

/**
 * Gets the contents of a file from the URL provided
 * @param {string} url The file URL
 * @returns {string} The file contents
 */
export async function getFileFromUrl (url) {
  const response = await get(url)
  return response.data
}
