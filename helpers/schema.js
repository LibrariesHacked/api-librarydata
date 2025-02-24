import axios from 'axios'

/**
 * Gets the contents of a file from the URL provided
 * @param {string} url The file URL
 * @returns {string} The file contents
 */
export const getFileFromUrl = async url => {
  const response = await axios.get(url)
  return response.data
}
