import { Router } from 'express'
import { Parser } from 'json2csv'

import cache from '../middleware/cache.js'

import {
  getLibraries,
  getNearestLibraries,
  getLibrariesSchema,
  getSchemaFields,
  getLibraryById,
  getLibraryBySystemName,
  getTileData,
  getBuildingsTileData
} from '../models/library.js'

import { convertJsonToGeoJson } from '../helpers/utils.js'

const router = Router()

/**
 * A call to the libraries endpoint has been made
 * Returns a list of libraries in either geojson or json depending on the Accept header.
 * @param {string} service_codes - The service codes to filter by.
 * @param {number} longitude - The longitude to filter by.
 * @param {number} latitude - The latitude to filter by.
 * @param {number} distance - The distance to filter by.
 * @param {number} limit - The number of results to return.
 * @param {number} page - The page number to return.
 * @param {string} sort - The column to sort by.
 * @param {string} direction - The direction to sort by.
 * @param {boolean} closed - Whether to include closed libraries.
 * @returns {object} 200 - An array of libraries.
 * @returns {object} 404 - No libraries found.
 * @returns {object} 500 - An error occurred.
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

  let libraries = await getLibraries(
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

  if (req.get('Accept') === 'application/geo+json') {
    const geoJson = convertJsonToGeoJson(libraries, 'Longitude', 'Latitude')
    res.json(geoJson)
  } else {
    res.json(libraries)
  }
})

/**
 * A call to the libraries/nearest endpoint has been made
 * Returns the nearest library to a given longitude and latitude.
 * @param {number} longitude - The longitude to filter by.
 * @param {number} latitude - The latitude to filter by.
 * @param {number} limit - The number of results to return.
 * @returns {object} 200 - The nearest library.
 * @returns {object} 404 - No libraries found.
 * @returns {object} 500 - An error occurred.
 */
router.get('/nearest', async (req, res) => {
  const longitude = req.query.longitude || null
  const latitude = req.query.latitude || null
  const limit = req.query.limit || 1

  const libraries = await getNearestLibraries(longitude, latitude, limit)
  res.json(libraries)
})

/**
 * A call to the libraries/schema endpoint has been made
 * Returns the libraries in the schema format as either json or csv depending on the Accept header.
 * @returns {object} 200 - An array of libraries in schema format.
 * @returns {object} 500 - An error occurred.
 */
router.get('/schema', async (req, res) => {
  const libraries = await getLibrariesSchema()
  if (req.accepts('text/csv')) {
    const fields = getSchemaFields()
    const parser = new Parser({ fields })
    res.send(parser.parse(libraries))
  } else {
    res.json(libraries)
  }
})

/**
 * A call to the libraries/schema/:service_code endpoint has been made
 * Returns the libraries in the schema format as either json or csv depending on the Accept header.
 * @param {string} service_code - The service code to filter by.
 * @returns {object} 200 - An array of libraries in schema format.
 * @returns {object} 500 - An error occurred.
 */
router.get('/schema/:service_code', async (req, res) => {
  const libraries = await getLibrariesSchema(
    req.params.service_code.toUpperCase()
  )
  if (req.accepts('text/csv')) {
    const fields = getSchemaFields()
    const parser = new Parser({ fields })
    res.send(parser.parse(libraries))
  } else {
    res.json(libraries)
  }
})

/**
 * A call to the libraries/:id endpoint has been made
 * Returns a library by its id.
 * @param {number} id - The id of the library.
 * @returns {object} 200 - The library.
 * @returns {object} 404 - No library found.
 */
router.get('/:id', cache(3600), async (req, res) => {
  const id = req.params.id
  if (!id) return res.status(400)
  const library = await getLibraryById(id)
  if (library == null) return res.status(404).send(null)
  res.json(library)
})

/**
 * A call to the libraries/:service_system_name/:library_system_name endpoint has been made
 * Returns a library by its service system name and library system name.
 * @param {string} service_system_name - The service system name of the library.
 * @param {string} library_system_name - The library system name of the library.
 * @returns {object} 200 - The library.
 * @returns {object} 404 - No library found.
 */
router.get(
  '/:service_system_name/:library_system_name',
  cache(3600),
  async (req, res) => {
    const librarySystemName = req.params.library_system_name
    const serviceSystemName = req.params.service_system_name

    if (!librarySystemName || !serviceSystemName) return res.status(400)

    const library = await getLibraryBySystemName(
      serviceSystemName,
      librarySystemName
    )
    if (!library) return res.status(404).send(null)
    res.json(library)
  }
)

/**
 * A call to the libraries/:z/:x/:y.mvt endpoint has been made
 * Returns a MVT tile of libraries.
 * @param {number} z - The zoom level of the tile.
 * @param {number} x - The x coordinate of the tile.
 * @param {number} y - The y coordinate of the tile.
 * @returns {object} 200 - The MVT tile.
 * @returns {object} 204 - No tile found.
 */
router.get('/:z/:x/:y.mvt', cache(3600), async (req, res) => {
  const { z, x, y } = req.params
  const tile = await getTileData(x, y, z)
  res.setHeader('Content-Type', 'application/x-protobuf')
  if (!tile) return res.status(204).send(null)
  res.send(tile)
})

/**
 * A call to the libraries/buildings/:z/:x/:y.mvt endpoint has been made
 * Returns a MVT tile of buildings.
 * @param {number} z - The zoom level of the tile.
 * @param {number} x - The x coordinate of the tile.
 * @param {number} y - The y coordinate of the tile.
 * @returns {object} 200 - The MVT tile.
 * @returns {object} 204 - No tile found.
 */
router.get('/buildings/:z/:x/:y.mvt', cache(3600), async (req, res) => {
  const { z, x, y } = req.params
  const tile = await getBuildingsTileData(x, y, z)
  res.setHeader('Content-Type', 'application/x-protobuf')
  if (!tile) return res.status(204).send(null)
  res.send(tile)
})

export default router
