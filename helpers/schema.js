const axios = require('axios')

/**
 * Gets the contents of a file from the URL provided
 * @param {string} url The file URL
 * @returns {string} The file contents
 */
module.exports.getFileFromUrl = async url => {
  const response = await axios.get(url)
  return response.data
}
