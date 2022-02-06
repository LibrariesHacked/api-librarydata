const express = require('express')
const router = express.Router()

const authHelper = require('../helpers/authenticate')

/**
 * Trigger a new authentication request
 */
router.post('/', async function (req, res) {
  const email = req.body.email
  const website = req.body.website
  if (!email || !website) return res.status(400)

  const domain = email.split('@').pop()
  const claims = await authHelper.getDomainClaims(domain)
  if (claims.codes.length === 0 && !claims.admin) return res.sendStatus(401)
  
  const emailSent = await authHelper.sendMagicLink(email, claims, website)
  if (!emailSent) return res.status(500)
  res.sendStatus(200)
})

module.exports = router
