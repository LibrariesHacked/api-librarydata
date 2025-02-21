import { Router } from 'express'

import { getDomainClaims, sendMagicLink } from '../helpers/authenticate.js'

const router = Router()

/**
 * A new authentication request has been made.
 * We process the email address and website, and send a magic link to the user.
 * @param {string} email - The email address of the user.
 * @param {string} website - The website the user is trying to log in to.
 * @returns {number} 200 - The email has been sent.
 * @returns {number} 400 - The request is missing required parameters.
 * @returns {number} 401 - The domain is not authorized.
 * @returns {number} 500 - The email could not be sent.
 */
router.post('/', async (req, res) => {
  const email = req.body.email
  const website = req.body.website
  if (!email || !website) return res.status(400)

  const domain = email.split('@').pop()
  const claims = await getDomainClaims(domain)
  if (claims.codes.length === 0 && !claims.admin) return res.sendStatus(401)

  const emailSent = await sendMagicLink(email, claims, website)
  if (!emailSent) return res.status(500)
  res.sendStatus(200)
})

export default router
