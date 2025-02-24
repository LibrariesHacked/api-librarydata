import { Router } from 'express'

import { verifyAccessToken } from '../middleware/token.js'

import {
  verifyServiceCodeAccess,
  getTokenDomain
} from '../helpers/authenticate.js'
import { createOrUpdateFile } from '../helpers/github.js'
import { getFileFromUrl } from '../helpers/schema.js'

import {
  getLocalAuthoritiesByCodes,
  getLocalAuthoritySlugFromName
} from '../models/localAuthority.js'

const router = Router()

/**
 * Gets the schema data for libaries for a given service code
 * @param {string} service_code.path.required - The service code of the local authority
 * @returns {string} 200 - The schema data for the libraries
 * @returns {Error} 400 - The service code is invalid
 * @returns {Error} 500 - An error occurred while getting the schema data
 */
router.get('/libraries/:service_code', async (req, res) => {
  const serviceCode = req.params.service_code

  const localAuthorities = await getLocalAuthoritiesByCodes([
    serviceCode.toUpperCase()
  ])
  if (localAuthorities.length < 1) return res.sendStatus(400)

  const slug = getLocalAuthoritySlugFromName(localAuthorities[0].name)
  const content = await getFileFromUrl(
    `https://raw.githubusercontent.com/LibrariesHacked/librarydata-db/main/data/schemas/libraries/${slug}.csv`
  )
  res.send(content)
})

/**
 * Updates the schema data for libaries for a given service code
 * @param {string} service_code.path.required - The service code of the local authority
 * @returns {string} 200 - The schema data for the libraries has been updated
 * @returns {Error} 400 - The service code is invalid
 * @returns {Error} 403 - The user does not have access to the service code
 * @returns {Error} 500 - An error occurred while updating the schema data
 */
router.put('/libraries/:service_code', verifyAccessToken, async (req, res) => {
  const serviceCode = req.params.service_code.toUpperCase()
  const claims = req.claims
  const csvData = req.body
  const token = req.token

  if (!verifyServiceCodeAccess(serviceCode, claims)) {
    return res.sendStatus(403)
  }

  const emailDomain = await getTokenDomain(token)

  const localAuthorities = await getLocalAuthoritiesByCodes([serviceCode])
  if (localAuthorities.length < 1) return res.sendStatus(400)

  // Get the message from a custom header
  const message =
    req.headers['x-message'] ||
    `Updating ${localAuthorities[0].name} libraries schema`

  // Get the file slug from the local authority code
  const slug = getLocalAuthoritySlugFromName(localAuthorities[0].name)

  const success = createOrUpdateFile(
    `data/schemas/libraries/${slug}.csv`,
    csvData,
    message,
    localAuthorities[0].name,
    `anon@${emailDomain}`
  )
  res.sendStatus(success ? 200 : 500)
})

export default router
