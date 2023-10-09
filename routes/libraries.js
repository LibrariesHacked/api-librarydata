const express = require('express')
const router = express.Router()
const { Parser } = require('json2csv')

const cache = require('../middleware/cache')
const libraryModel = require('../models/library')
const utils = require('../helpers/utils')

/*
  Returns a list of libraries
*/
router.get('/', async (req, res) => {
  const serviceCodes = req.query.service_codes || null
  const longitude = req.query.longitude || null
  const latitude = req.query.latitude || null
  const distance = req.query.distance || 1
  const limit = req.query.limit || 1000
  const page = req.query.page || 1
  const sort = req.query.sort || 'id'
  const sortDirection = req.query.direction || 'asc'
  const closed = req.query.closed === 'true'

  let libraries = await libraryModel.getLibraries(
    serviceCodes,
    longitude,
    latitude,
    distance,
    limit,
    page,
    sort,
    sortDirection,
    closed
  )

  if (!libraries || libraries.length === 0) return res.status(404)

  res.setHeader('Access-Control-Expose-Headers', 'X-Total-Count, X-Page')
  res.setHeader('X-Total-Count', libraries.length > 0 ? libraries[0].total : 0)
  res.setHeader('X-Page', page)

  libraries = libraries.map(({ total, ...library }) => library) // Remove total column from results

  if (req.get('Accepts') === 'application/geo+json') {
    res.json(utils.convertJsonToGeoJson(libraries, 'Longitude', 'Latitude'))
  } else {
    res.json(libraries)
  }
})

/* 
  Returns a list of libraries for a location
*/
router.get('/nearest', async (req, res) => {
  const longitude = req.query.longitude || null
  const latitude = req.query.latitude || null
  const limit = req.query.limit || 1

  const libraries = await libraryModel.getNearestLibraries(
    longitude,
    latitude,
    limit
  )
  res.json(libraries)
})

router.get('/schema', async (req, res) => {
  const libraries = await libraryModel.getLibrariesSchema()
  if (req.accepts('text/csv')) {
    const fields = libraryModel.getSchemaFields()
    const parser = new Parser({ fields })
    res.send(parser.parse(libraries))
  } else {
    res.json(libraries)
  }
})

router.get('/schema/:service_code', async (req, res) => {
  const libraries = await libraryModel.getLibrariesSchema(
    req.params.service_code.toUpperCase()
  )
  if (req.accepts('text/csv')) {
    const fields = libraryModel.getSchemaFields()
    const parser = new Parser({ fields })
    res.send(parser.parse(libraries))
  } else {
    res.json(libraries)
  }
})

router.get('/:id', cache(3600), async (req, res) => {
  const id = req.params.id
  if (!id) return res.status(400)
  const library = await libraryModel.getLibraryById(id)
  if (library == null) return res.status(404).send(null)
  res.json(library)
})

router.get(
  '/:service_system_name/:library_system_name',
  cache(3600),
  async (req, res) => {
    const librarySystemName = req.params.library_system_name
    const serviceSystemName = req.params.service_system_name

    if (!librarySystemName || !serviceSystemName) return res.status(400)

    const library = await libraryModel.getLibraryBySystemName(
      serviceSystemName,
      librarySystemName
    )
    if (!library) return res.status(404).send(null)
    res.json(library)
  }
)

/* 
  Returns a vector tile for a given x, y, z
*/
router.get('/:z/:x/:y.mvt', cache(3600), async (req, res) => {
  const { z, x, y } = req.params
  const tile = await libraryModel.getTileData(x, y, z)
  res.setHeader('Content-Type', 'application/x-protobuf')
  if (!tile) return res.status(204).send(null)
  res.send(tile)
})

router.get('/buildings/:z/:x/:y.mvt', cache(3600), async (req, res) => {
  const { z, x, y } = req.params
  const tile = await libraryModel.getBuildingsTileData(x, y, z)
  res.setHeader('Content-Type', 'application/x-protobuf')
  if (!tile) return res.status(204).send(null)
  res.send(tile)
})

module.exports = router
