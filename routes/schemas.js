const express = require('express')
const router = express.Router()
const token = require('../middleware/token')

const authHelper = require('../helpers/authenticate')
const githubHelper = require('../helpers/github')
const schemaHelper = require('../helpers/schema')

const localAuthorityModel = require('../models/localAuthority')

router.get('/libraries/:service_code', async (req, res) => {
  const serviceCode = req.params.service_code

  const localAuthorities = await localAuthorityModel.getLocalAuthoritiesByCodes(
    [serviceCode.toUpperCase()]
  )
  if (localAuthorities.length < 1) return res.sendStatus(400)

  const slug = localAuthorityModel.getLocalAuthoritySlugFromName(
    localAuthorities[0].name
  )
  const content = await schemaHelper.getFileFromUrl(
    `https://raw.githubusercontent.com/LibrariesHacked/librarydata-db/main/data/schemas/libraries/${slug}.csv`
  )
  res.send(content)
})

router.put('/libraries/:service_code', token.verifyToken, async (req, res) => {
  const serviceCode = req.params.service_code.toUpperCase()
  const claims = req.claims
  const csvData = req.body
  const token = req.token

  if (!authHelper.verifyServiceCodeAccess(serviceCode, claims)) {
    return res.sendStatus(403)
  }

  const emailDomain = await authHelper.getTokenDomain(token)

  const localAuthorities = await localAuthorityModel.getLocalAuthoritiesByCodes(
    [serviceCode]
  )
  if (localAuthorities.length < 1) return res.sendStatus(400)

  // Get the message from a custom header
  const message =
    req.headers['x-message'] ||
    `Updating ${localAuthorities[0].name} libraries schema`

  // Get the file slug from the local authority code
  const slug = localAuthorityModel.getLocalAuthoritySlugFromName(
    localAuthorities[0].name
  )

  const success = githubHelper.createOrUpdateFile(
    `data/schemas/libraries/${slug}.csv`,
    csvData,
    message,
    localAuthorities[0].name,
    `anon@${emailDomain}`
  )
  res.sendStatus(success ? 200 : 500)
})

module.exports = router
