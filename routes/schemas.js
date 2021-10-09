const express = require('express')
const router = express.Router()
const cache = require('../middleware/cache')
const token = require('../middleware/token')
const libraryModel = require('../models/library')
const csv = require("fast-csv")

/**
 * Upload library CSV schema
 */
router.put('/schemas/:service', token.verifyToken, async (req, res) => {
  const csvString = req.body
  const claims = req.claims

  // Get authority codes and check permissions

  // Validate it 

  res.sendStatus(200)
})

module.exports = router
