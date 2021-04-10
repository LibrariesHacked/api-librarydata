const express = require('express')
const router = express.Router()
const cache = require('../middleware/cache')
const libraryModel = require('../models/library')

/**
 * Get all libraries with paging and filter parameters
 */
router.get('/', function (req, res, next) {
  const serviceCodes = req.query.service_codes || null
  const longitude = req.query.longitude || null
  const latitude = req.query.latitude || null
  const distance = req.query.distance || 1
  const limit = req.query.limit || 1000
  const page = req.query.page || 1
  const sort = req.query.sort || 'id'
  const sortDirection = req.query.direction || 'asc'
  const closed = (req.query.closed === 'true')

  libraryModel.getLibraries(serviceCodes, longitude, latitude, distance, limit, page, sort, sortDirection, closed).then(libraries => {
    res.setHeader('Access-Control-Expose-Headers', 'X-Total-Count, X-Page')
    res.setHeader('X-Total-Count', libraries.length > 0 ? libraries[0].total : 0)
    res.setHeader('X-Page', page)
    libraries = libraries.map(({ total, ...library }) => library) // Remove total column
    res.json(libraries)
  })
})

/**
 * Get the nearest libraries to a specified location
 */
router.get('/nearest', function (req, res, next) {
  const longitude = req.query.longitude || null
  const latitude = req.query.latitude || null
  const limit = req.query.limit || 1

  libraryModel.getNearestLibraries(longitude, latitude, limit).then(libraries => res.json(libraries))
})

/**
 * Get a library
 */
router.get('/:id', cache(3600), function (req, res, next) {
  libraryModel.getLibraryById(req.params.id)
    .then(stop => {
      if (stop != null) return res.json(stop)
      res.status(404).json({
        errors: [{ status: '404', title: 'Not Found' }]
      })
    })
})

/**
 * Library buildings MVT tile service
 */
router.get('/buildings/:z/:x/:y.mvt', cache(3600), async (req, res) => {
  const { z, x, y } = req.params
  libraryModel.getBuildingsTileData(x, y, z).then(tile => {
    res.setHeader('Content-Type', 'application/x-protobuf')
    if (!tile) return res.status(204).send(null)
    res.send(tile)
  })
})

/**
 * Libraries MVT tile service
 */
router.get('/:z/:x/:y.mvt', cache(3600), async (req, res) => {
  const { z, x, y } = req.params
  libraryModel.getTileData(x, y, z).then(tile => {
    res.setHeader('Content-Type', 'application/x-protobuf')
    if (!tile) return res.status(204).send(null)
    res.send(tile)
  })
})

module.exports = router
