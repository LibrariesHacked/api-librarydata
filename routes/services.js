import { Router } from 'express'

import {
  getAllRecordsInTable,
  getRecordInTable,
  getSingleFieldArrayAllRecordsInTable
} from '../helpers/airtable'
import { getFeedFromBlogUrls, getFeedFromYouTubeIds } from '../helpers/feed'
import cache from '../middleware/cache.js'
import { accessToken } from '../middleware/token.js'
import { getLocalAuthorities } from '../models/localAuthority.js'
const router = Router()

/**
 * Get services including access rights for editing
 */
router.get('/', accessToken, async (req, res, next) => {
  const services = await getLocalAuthorities()
  services.forEach(
    service =>
      (service.editable =
        req.claims &&
        (req.claims.admin === true ||
          req.claims.codes.indexOf(service.code) !== -1))
  )
  res.json(services)
})

/**
 * Get all the library services from airtable
 */
router.get('/airtable/', cache(3600), async (req, res) => {
  const fields = req.query.fields ? req.query.fields.split(',') : null
  const records = await getAllRecordsInTable(
    process.env.AIRTABLE_LIBRARY_SERVICES_BASE_ID,
    process.env.AIRTABLE_LIBRARY_SERVICES_TABLE_NAME
  )
  if (fields) {
    records.forEach(record => {
      Object.keys(record).forEach(key => {
        if (fields.indexOf(key) === -1) delete record[key]
      })
    })
  }
  res.json(records)
})

/**
 * Gets a single service from airtable
 */
router.get('/airtable/:service_code', cache(3600), async (req, res) => {
  const record = await getRecordInTable(
    process.env.AIRTABLE_LIBRARY_SERVICES_BASE_ID,
    process.env.AIRTABLE_LIBRARY_SERVICES_TABLE_NAME,
    process.env.AIRTABLE_LIBRARY_SERVICES_CODE_FIELD,
    req.params.service_code
  )
  res.json(record)
})

/**
 * Get a single blog feed from all existing feeds
 */
router.get('/airtable/feeds/blogs{.:ext}', cache(3600), async (req, res) => {
  const blogUrls = await getSingleFieldArrayAllRecordsInTable(
    process.env.AIRTABLE_LIBRARY_SERVICES_BASE_ID,
    process.env.AIRTABLE_LIBRARY_SERVICES_TABLE_NAME,
    'Blog RSS feed',
    req.query.filter_field_name,
    req.query.filter_field_value
  )
  const feed = await getFeedFromBlogUrls(blogUrls)
  if (req.params.ext === 'xml') {
    res.set('Content-Type', 'text/xml')
    return res.send(feed.xml())
  }
  res.json(feed)
})

/**
 * Get a single youtube feed from all existing feeds
 */
router.get('/airtable/feeds/youtube{.:ext}', cache(3600), async (req, res) => {
  const youtubeIds = await getSingleFieldArrayAllRecordsInTable(
    process.env.AIRTABLE_LIBRARY_SERVICES_BASE_ID,
    process.env.AIRTABLE_LIBRARY_SERVICES_TABLE_NAME,
    'YouTube ID',
    req.query.filter_field_name,
    req.query.filter_field_value
  )
  const feed = await getFeedFromYouTubeIds(youtubeIds)
  if (req.params.ext === 'xml') {
    res.set('Content-Type', 'text/xml')
    return res.send(feed.xml())
  }
  res.json(feed)
})

export default router
