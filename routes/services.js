const express = require('express');
const router = express.Router();

const airtableHelper = require('../helpers/airtable');
const feedHelper = require('../helpers/feed');

/**
 * Produces a single youtube feed from all existing feeds
 */
router.get('/airtable/feeds/youtube\.:ext(json|xml)', async (req, res) => {
  const youtube_ids = await airtableHelper.getSingleFieldArrayAllRecordsInTable(process.env.AIRTABLE_LIBRARY_SERVICES_BASE_ID, process.env.AIRTABLE_LIBRARY_SERVICES_TABLE_NAME, 'YouTube ID');
  const feed = await feedHelper.getFeedFromYouTubeIds(youtube_ids);
  if (req.params.ext === 'xml') {
    res.set('Content-Type', 'text/xml');
    return res.send(feed.xml());
  }
  return res.json(feed);
});

/**
 * Gets all the library services from airtable
 */
router.get('/airtable', async (req, res) => {
  const records = await airtableHelper.getAllRecordsInTable(process.env.AIRTABLE_LIBRARY_SERVICES_BASE_ID, process.env.AIRTABLE_LIBRARY_SERVICES_TABLE_NAME);
  res.json(records);
});

/**
 * Gets a single service from airtable
 */
router.get('/airtable/:service_code', async (req, res) => {
  const record = await airtableHelper.getRecordInTable(process.env.AIRTABLE_LIBRARY_SERVICES_BASE_ID, process.env.AIRTABLE_LIBRARY_SERVICES_TABLE_NAME, process.env.AIRTABLE_LIBRARY_SERVICES_CODE_FIELD, req.params.service_code);
  res.json(record);
});

module.exports = router;