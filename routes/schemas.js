const express = require('express')
const router = express.Router()
const token = require('../middleware/token')

const authHelper = require('../helpers/authenticate')
const githubHelper = require('../helpers/github')

const localAuthorityModel = require('../models/localAuthority')

/**
 * Upload library CSV schema
 */
router.put('/libraries/:service_code', token.verifyToken, async (req, res) => {
  if (!authHelper.verifyServiceCodeAccess(req.params.service_code.toUpperCase(), req.claims)) return res.sendStatus(403)

  const csvData = req.body
  const serviceCode = req.params.service_code.toUpperCase()
  const emailDomain = await authHelper.getTokenDomain(req.token)

  const localAuthorities = await localAuthorityModel.getLocalAuthoritiesByCodes([serviceCode])
  if (localAuthorities.length < 1) return res.sendStatus(400)

  // Get the message from a custom header
  const message = req.headers['x-message'] || `Updating ${localAuthorities[0].name} libraries schema`

  // Get the file slug from the local authority code
  const slug = localAuthorityModel.getLocalAuthoritySlugFromName(localAuthorities[0].name)

  const success = githubHelper.createOrUpdateFile(`data/libraries/${slug}.csv`, csvData, message, localAuthorities[0].name, `anon@${emailDomain}`)
  res.sendStatus(success ? 200 : 500)
})

module.exports = router
