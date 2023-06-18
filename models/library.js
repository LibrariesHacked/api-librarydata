const pool = require('../helpers/database')

const viewFieldsGeo = [
  'local_authority',
  'local_authority_code',
  'library_name',
  'address_1',
  'address_2',
  'address_3',
  'postcode',
  'library_type',
  'year_closed',
  'unique_property_reference_number',
  'colocated',
  'colocated_with',
  'notes',
  'url',
  'email_address',
  'longitude',
  'latitude',
  'easting',
  'northing',
  'oa_code',
  'county_code',
  'ward_code',
  'region_code',
  'country_code',
  'rural_urban_classification',
  'imd'
]
const viewFieldsSchema = [
  '"Local authority"',
  '"Library name"',
  '"Address 1"',
  '"Address 2"',
  '"Address 3"',
  '"Postcode"',
  '"Unique property reference number"',
  '"Statutory"',
  '"Type of library"',
  '"Year opened"',
  '"Year closed"',
  '"Monday staffed hours"',
  '"Tuesday staffed hours"',
  '"Wednesday staffed hours"',
  '"Thursday staffed hours"',
  '"Friday staffed hours"',
  '"Saturday staffed hours"',
  '"Sunday staffed hours"',
  '"Monday unstaffed hours"',
  '"Tuesday unstaffed hours"',
  '"Wednesday unstaffed hours"',
  '"Thursday unstaffed hours"',
  '"Friday unstaffed hours"',
  '"Saturday unstaffed hours"',
  '"Sunday unstaffed hours"',
  '"Special hours"',
  '"Co-located"',
  '"Co-located with"',
  '"Notes"',
  '"URL"',
  '"Email address"'
]
const viewFieldsSchemaExtended = [
  '"Local authority"',
  '"Local authority code"',
  '"Library name"',
  '"Address 1"',
  '"Address 2"',
  '"Address 3"',
  '"Postcode"',
  '"Unique property reference number"',
  '"Unique property reference number longitude"',
  '"Unique property reference number latitude"',
  '"Statutory"',
  '"Type of library"',
  '"Year opened"',
  '"Year closed"',
  '"Monday staffed hours"',
  '"Tuesday staffed hours"',
  '"Wednesday staffed hours"',
  '"Thursday staffed hours"',
  '"Friday staffed hours"',
  '"Saturday staffed hours"',
  '"Sunday staffed hours"',
  '"Monday unstaffed hours"',
  '"Tuesday unstaffed hours"',
  '"Wednesday unstaffed hours"',
  '"Thursday unstaffed hours"',
  '"Friday unstaffed hours"',
  '"Saturday unstaffed hours"',
  '"Sunday unstaffed hours"',
  '"Co-located"',
  '"Co-located with"',
  '"Notes"',
  '"URL"',
  '"Email address"',
  '"Longitude"',
  '"Latitude"',
  'id'
]

/**
 * Returns the field names in the library view schema
 * @returns {Array} A list of field names
 */
module.exports.getSchemaFields = () =>
  viewFieldsSchema.map(f => f.replace(/\"/g, ''))

/**
 * Gets a list of libraries
 * @param {Array} serviceCodes An array of GSS codes
 * @param {numeric} longitude A longitude coordinate value
 * @param {numeric} latitude A latitude coordinate value
 * @param {numeric} distance A distance in metres to limit the libraries to
 * @param {numeric} limit The number of libraries to limit to
 * @param {int} page The page number of the results
 * @param {sting} sortDirection The field to sort by
 * @param {string} sortDirection  ASC or DESC results
 * @param {boolean} closed Whether to include closed libraries
 * @returns {Array} A list of libraries
 */
module.exports.getLibraries = async (
  serviceCodes,
  longitude,
  latitude,
  distance,
  limit,
  page,
  sort,
  sortDirection,
  closed
) => {
  const services = serviceCodes ? serviceCodes.split('|') : []

  let params = [
    ['limit', limit],
    ['page', page]
  ].filter(x => x[1] !== null)

  let libraries = []

  try {
    const whereQueries = []
    let limitQuery = ''
    let offsetQuery = ''
    let orderQuery = ''

    let selectFields = [...viewFieldsSchemaExtended]

    params.forEach((param, i) => {
      const idx = i + 1
      if (param[0] === 'limit') limitQuery = `limit $${idx}`
      if (param[0] === 'page') {
        params[i][1] = limit * (page - 1) // Calculate offset from the page and limit
        offsetQuery = `offset $${idx}`
      }
    })

    const sortDirectionText = sortDirection === 'desc' ? 'desc' : 'asc'
    if (viewFieldsSchemaExtended.indexOf('"' + sort + '"') !== -1) {
      orderQuery = `order by "${sort}" ${sortDirectionText}`
    }
    params = params.map(p => p[1]) // Change params array just to values.

    if (services.length > 0) {
      const servicesText = services
        .map((o, oidx) => '$' + (oidx + 1 + params.length))
        .join(',')
      whereQueries.push(`"Local authority code" in (${servicesText})`)
      params = params.concat(services)
    }

    if (longitude && latitude && distance) {
      const longitudeParam = params.length + 1
      const latitudeParam = params.length + 2
      const distanceParam = params.length + 3
      whereQueries.push(
        `st_dwithin(st_transform(st_setsrid(st_makepoint($${longitudeParam}, $${latitudeParam}), 4326), 27700), st_transform(geom, 27700), $${distanceParam})`
      )
      params = params.concat([longitude, latitude, distance])
      selectFields.push(
        `round(st_distance(st_transform(st_setsrid(st_makepoint($${longitudeParam}, $${latitudeParam}), 4326), 27700), st_transform(geom, 27700))) as distance`
      )

      if (sort === 'distance')
        orderQuery = `order by distance ${sortDirectionText}`
    }

    if (!closed) whereQueries.push('"Year closed" is null')

    const selectFieldsText = selectFields.join(', ')
    const whereQueriesText =
      whereQueries.length > 0 ? `where ${whereQueries.join(' and ')}` : ''
    const query = `select ${selectFieldsText}, count(*) OVER() AS total from vw_schemas_libraries_extended ${whereQueriesText} ${orderQuery} ${limitQuery} ${offsetQuery}`

    const { rows } = await pool.query(query, params)

    libraries = rows
  } catch (e) {}
  return libraries
}

/**
 * Gets a list of libraries in the strict schema definition
 * @param {Array} serviceCodes An array of ONS codes
 * @returns {Array} A list of libraries
 */
module.exports.getLibrariesSchema = async serviceCodes => {
  const services = serviceCodes ? serviceCodes.split('|') : []
  let libraries = []
  try {
    let params = []
    const whereQueries = []
    if (services.length > 0) {
      whereQueries.push(
        '"Local authority" in (select name from schemas_local_authority where code in (' +
          services
            .map((o, oidx) => '$' + (oidx + 1 + params.length))
            .join(',') +
          '))'
      )
      params = params.concat(services)
    }
    const query =
      'select ' +
      viewFieldsSchema.join(', ') +
      ' from vw_schemas_libraries ' +
      (whereQueries.length > 0
        ? 'where ' + whereQueries.join(' and ') + ' '
        : '')
    const { rows } = await pool.query(query, params)
    libraries = rows
  } catch (e) {}
  return libraries
}

/**
 * Gets nearest libraries from a point
 * @param {numeric} longitude A longitude coordinate value
 * @param {numeric} latitude A latitude coordinate value
 * @param {int} limit The number of libraries to limit to
 * @returns {Array} A list of libraries
 */
module.exports.getNearestLibraries = async (longitude, latitude, limit) => {
  let libraries = []
  try {
    const query =
      'select ' +
      viewFieldsGeo.join(', ') +
      ',  st_distance(st_transform(st_setsrid(st_makepoint($1, $2), 4326), 27700), st_setsrid(st_makepoint(easting, northing), 27700)) as distance from vw_libraries_geo where year_closed is null order by distance asc limit $3'
    const { rows } = await pool.query(query, [longitude, latitude, limit])
    if (rows.length > 0) libraries = rows
  } catch (e) {}
  return libraries
}

/**
 * Get library details by the internal ID
 * @param {int} id
 * @returns {object} A library object
 */
module.exports.getLibraryById = async id => {
  let library = null
  try {
    const query =
      'select ' +
      viewFieldsSchemaExtended.join(', ') +
      ' ' +
      'from vw_schemas_libraries_extended where id = $1'
    const { rows } = await pool.query(query, [id])
    if (rows.length > 0) library = rows[0]
  } catch (e) {}
  return library
}

/**
 * Get library details by the system name (slug)
 * @param {serviceSystemName}
 * @param {librarySystemName}
 * @returns {object} A library object
 */
module.exports.getLibraryBySystemName = async (
  serviceSystemName,
  librarySystemName
) => {
  let library = null
  try {
    const query = `select ${viewFieldsSchemaExtended.join(
      ', '
    )} from vw_schemas_libraries_extended where lower(regexp_replace("Local authority", '[. ,:-]+', '-', 'g')) = $1 and lower(regexp_replace("Library name", '[. ,:-]+', '-', 'g')) = $2`
    const { rows } = await pool.query(query, [
      serviceSystemName,
      librarySystemName
    ])
    if (rows.length > 0) library = rows[0]
  } catch (e) {}
  return library
}

/**
 * Get a library points tile
 * @param {int} x
 * @param {*} y
 * @param {*} z
 * @returns {encoded} The tile
 */
module.exports.getTileData = async (x, y, z) => {
  const query = 'select fn_libraries_mvt($1, $2, $3)'
  let tile = null
  try {
    const { rows } = await pool.query(query, [x, y, z])
    if (rows && rows.length > 0 && rows[0].fn_libraries_mvt)
      tile = rows[0].fn_libraries_mvt
  } catch (e) {}
  return tile
}

/**
 * Get a building polygons tile
 * @param {int} x
 * @param {*} y
 * @param {*} z
 * @returns {encoded} The tile
 */
module.exports.getBuildingsTileData = async (x, y, z) => {
  const query = 'select fn_libraries_buildings_mvt($1, $2, $3)'
  let tile = null
  try {
    const { rows } = await pool.query(query, [x, y, z])
    if (rows && rows.length > 0 && rows[0].fn_libraries_buildings_mvt)
      tile = rows[0].fn_libraries_buildings_mvt
  } catch (e) {}
  return tile
}
