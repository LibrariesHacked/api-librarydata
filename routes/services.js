const express = require('express');
const router = express.Router();

const airtableHelper = require('../helpers/airtable');

/**
 * Gets a single service from airtable
 */
router.get('/airtable/:service_code', (req, res) => {
  airtableHelper.getRecordInTable(process.env.AIRTABLE_LIBRARY_SERVICES_BASE_ID, process.env.AIRTABLE_LIBRARY_SERVICES_TABLE_NAME, process.env.AIRTABLE_LIBRARY_SERVICES_CODE_FIELD, req.params.service_code, (data) => { res.json(data) });
});

/**
 * Gets all the library services from airtable
 */
router.get('/airtable', (req, res) => {
  airtableHelper.getAllRecordsInTable(process.env.AIRTABLE_LIBRARY_SERVICES_BASE_ID, process.env.AIRTABLE_LIBRARY_SERVICES_TABLE_NAME, (data) => { res.json(data) });
});

/**
 * Produces a single video feed from all existing feeds.
 * Cached to speed things up
 */
router.get('/airtable/feeds/video', (req, res) => {
  airtableHelper.getAllRecordsInTable(process.env.AIRTABLE_LIBRARY_SERVICES_BASE_ID, process.env.AIRTABLE_LIBRARY_SERVICES_TABLE_NAME, (data) => { res.json(data) });
});

module.exports = router;