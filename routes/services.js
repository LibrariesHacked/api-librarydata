const express = require('express')
const router = express.Router()

const airtableHelper = require('../helpers/airtable')
const feedHelper = require('../helpers/feed')

const cache = require('../middleware/cache')

/**
 * Get a single blog feed from all existing feeds
 */
router.get('/airtable/feeds/blogs.:ext(json|xml)', cache(3600), async (req, res) => {
  const blogUrls = await airtableHelper.getSingleFieldArrayAllRecordsInTable(process.env.AIRTABLE_LIBRARY_SERVICES_BASE_ID, process.env.AIRTABLE_LIBRARY_SERVICES_TABLE_NAME, 'Blog RSS feed', req.query.filter_field_name, req.query.filter_field_value)
  const feed = await feedHelper.getFeedFromBlogUrls(blogUrls)
  if (req.params.ext === 'xml') {
    res.set('Content-Type', 'text/xml')
    return res.send(feed.xml())
  }
  return res.json(feed)
})

/**
 * Get a single youtube feed from all existing feeds
 */
router.get('/airtable/feeds/youtube.:ext(json|xml)', cache(3600), async (req, res) => {
  const youtubeIds = await airtableHelper.getSingleFieldArrayAllRecordsInTable(process.env.AIRTABLE_LIBRARY_SERVICES_BASE_ID, process.env.AIRTABLE_LIBRARY_SERVICES_TABLE_NAME, 'YouTube ID', req.query.filter_field_name, req.query.filter_field_value)
  const feed = await feedHelper.getFeedFromYouTubeIds(youtubeIds)
  if (req.params.ext === 'xml') {
    res.set('Content-Type', 'text/xml')
    return res.send(feed.xml())
  }
  return res.json(feed)
})

/**
 * Get all the library services from airtable
 */
router.get('/airtable', cache(3600), async (req, res) => {
  const records = await airtableHelper.getAllRecordsInTable(process.env.AIRTABLE_LIBRARY_SERVICES_BASE_ID, process.env.AIRTABLE_LIBRARY_SERVICES_TABLE_NAME)
  res.json(records)
})

/**
 * Gets a single service from airtable
 */
router.get('/airtable/:service_code', cache(3600), async (req, res) => {
  const record = await airtableHelper.getRecordInTable(process.env.AIRTABLE_LIBRARY_SERVICES_BASE_ID, process.env.AIRTABLE_LIBRARY_SERVICES_TABLE_NAME, process.env.AIRTABLE_LIBRARY_SERVICES_CODE_FIELD, req.params.service_code)
  res.json(record)
})

module.exports = router
