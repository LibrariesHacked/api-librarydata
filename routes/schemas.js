import { Router } from 'express'
import { verifyToken } from '../middleware/token'

import {
  verifyServiceCodeAccess,
  getTokenDomain
} from '../helpers/authenticate'
import { createOrUpdateFile } from '../helpers/github'
import { getFileFromUrl } from '../helpers/schema'

import {
  getLocalAuthoritiesByCodes,
  getLocalAuthoritySlugFromName
} from '../models/localAuthority'
const router = Router()

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

router.put('/libraries/:service_code', verifyToken, async (req, res) => {
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
