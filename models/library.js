const pool = require('../helpers/database')

const viewFieldsSchema = ['"Local authority"', '"Local authority code"', '"Library name"', '"Address 1"', '"Address 2"', '"Address 3"', '"Postcode"', '"Unique property reference number"', '"Unique property reference number longitude"', '"Unique property reference number latitude"', '"Statutory"', '"Library type"', '"Year opened"', '"Year closed"', '"Monday staffed hours"', '"Tuesday staffed hours"', '"Wednesday staffed hours"', '"Thursday staffed hours"', '"Friday staffed hours"', '"Saturday staffed hours"', '"Sunday staffed hours"', '"Monday unstaffed hours"', '"Tuesday unstaffed hours"', '"Wednesday unstaffed hours"', '"Thursday unstaffed hours"', '"Friday unstaffed hours"', '"Saturday unstaffed hours"', '"Sunday unstaffed hours"', '"Co-located"', '"Co-located with"', '"Notes"', '"URL"', '"Email address"', '"Longitude"', '"Latitude"', 'id']
const viewFieldsGeo = ['local_authority', 'local_authority_code', 'library_name', 'address_1', 'address_2', 'address_3', 'postcode', 'library_type', 'year_closed', 'unique_property_reference_number', 'colocated', 'longitude', 'latitude', 'easting', 'northing', 'oa_code', 'county_code', 'ward_code', 'region_code', 'country_code', 'rural_urban_classification', 'imd']

module.exports.getLibraries = async (serviceCodes, longitude, latitude, distance, limit, page, sort) => {
  const services = serviceCodes ? serviceCodes.split('|') : []

  let params = [
    ['limit', limit],
    ['page', page]].filter(x => (x[1] !== null))

  let libraries = []

  try {
    const whereQueries = []
    let limitQuery = ''
    let offsetQuery = ''
    let orderQuery = ' '

    params.forEach((param, i) => {
      const idx = i + 1
      if (param[0] === 'limit') limitQuery = 'limit $' + idx + ' '
      if (param[0] === 'page') {
        params[i][1] = (limit * (page - 1)) // Calculate offset from the page and limit
        offsetQuery = 'offset $' + idx
      }
    })

    if (viewFieldsSchema.indexOf(sort) !== -1) orderQuery = 'order by ' + sort + ' asc '
    params = params.map(p => p[1]) // Change params array just to values.

    if (services.length > 0) {
      whereQueries.push('"Local authority code" in (' + services.map((o, oidx) => '$' + (oidx + 1 + params.length)).join(',') + ')')
      params = params.concat(services)
    }

    if (longitude && latitude && distance) {
      whereQueries.push('st_dwithin(st_transform(st_setsrid(st_makepoint($' + (params.length + 1) + ', $' + (params.length + 2) + '), 4326), 27700), st_transform(geom, 27700), $' + (params.length + 3) + ')')
      params = params.concat([longitude, latitude, distance])
    }

    const query = 'select ' + viewFieldsSchema.join(', ') + ', count(*) OVER() AS total from vw_schemas_libraries_extended ' + (whereQueries.length > 0 ? 'where ' + whereQueries.join(' and ') + ' ' : '') + orderQuery + limitQuery + offsetQuery

    const { rows } = await pool.query(query, params)

    libraries = rows
  } catch (e) { }
  return libraries
}

module.exports.getNearestLibraries = async (longitude, latitude, limit) => {
  let libraries = []
  try {
    const query = 'select ' + viewFieldsGeo.join(', ') + ',  st_distance(st_transform(st_setsrid(st_makepoint($1, $2), 4326), 27700), st_setsrid(st_makepoint(easting, northing), 27700)) as distance from vw_libraries_geo order by distance asc limit $3'
    const { rows } = await pool.query(query, [longitude, latitude, limit])
    if (rows.length > 0) libraries = rows
  } catch (e) {
    console.log(e.message)
  }
  return libraries
}

module.exports.getLibraryById = async (id) => {
  let library = null
  try {
    const query = 'select ' + viewFieldsSchema.join(', ') + ' ' + 'from vw_schemas_libraries_extended where id = $1'
    const { rows } = await pool.query(query, [id])
    if (rows.length > 0) library = rows[0]
  } catch (e) { }
  return library
}

module.exports.getTileData = async (x, y, z) => {
  const query = 'select fn_libraries_mvt($1, $2, $3)'
  let tile = null
  try {
    const { rows } = await pool.query(query, [x, y, z])
    if (rows && rows.length > 0 && rows[0].fn_libraries_mvt) tile = rows[0].fn_libraries_mvt
  } catch (e) { }
  return tile
}

module.exports.getBuildingsTileData = async (x, y, z) => {
  const query = 'select fn_libraries_buildings_mvt($1, $2, $3)'
  let tile = null
  try {
    const { rows } = await pool.query(query, [x, y, z])
    if (rows && rows.length > 0 && rows[0].fn_libraries_buildings_mvt) tile = rows[0].fn_libraries_buildings_mvt
  } catch (e) { }
  return tile
}
