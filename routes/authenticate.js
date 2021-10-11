const express = require('express')
const router = express.Router()
const authHelper = require('../helpers/authenticate')

/**
 * Trigger a new authentication request
 */
router.post('/', async function (req, res) {
  const email = req.body.email
  const website = req.body.website

  const domain = email.split('@').pop()

  const claims = await authHelper.getDomainClaims(domain)
  if (claims.codes.length === 0 && !claims.admin) {
    res.sendStatus(401)
    return
  }

  await authHelper.sendMagicLink(email, claims, website)
  res.sendStatus(200)
})

module.exports = router
