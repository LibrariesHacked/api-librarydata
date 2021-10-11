const { Octokit } = require('@octokit/rest')
const { Base64 } = require('js-base64')

/**
 * Creates or updates a file stored in GitHub
 * @param {string} path The path of the file including the file name
 * @param {string} file The content of the file
 * @param {string} message A commit message that describes the change
 * @returns {boolean} Whether the update was successful.
 */
module.exports.createOrUpdateFile = async (path, file, message, authorName, authorEmail) => {
  const content = Base64.encode(file)

  const octokit = new Octokit({
    auth: process.env.GITHUB_TOKEN
  })

  const organisation = process.env.GITHUB_ORGANISATION
  const repo = process.env.GITHUB_DATA_REPO

  const fileResult = await octokit.repos.getContent({
    owner: organisation,
    repo: repo,
    path
  })

  const sha = fileResult?.data?.sha

  const result = await octokit.repos.createOrUpdateFileContents({
    owner: organisation,
    repo: repo,
    path,
    message: message,
    content: content,
    committer: {
      name: process.env.GITHUB_ORGANISATION_BOT_NAME,
      email: process.env.GITHUB_ORGANISATION_EMAIL
    },
    author: {
      name: authorName,
      email: authorEmail
    },
    sha
  })

  return (result?.status === 200)
}
