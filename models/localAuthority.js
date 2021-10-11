const pool = require('../helpers/database')

const tableFields = ['code', 'name']

/**
 * Gets the local library authorities in the database
 * @returns {Array} Set of local authorities
 */
module.exports.getLocalAuthorities = async () => {
  let services = []
  try {
    const query = 'select ' + tableFields.join(', ') + ' from schemas_local_authority'
    const { rows } = await pool.query(query)
    if (rows.length > 0) services = rows
    services = rows
  } catch (e) {}
  return services
}

/**
 * Gets the local library authorities in the database that match a set of codes
 * @param {Array} codes An array of ONS codes
 * @returns {Array} Set of local authorities
 */
module.exports.getLocalAuthoritiesByCodes = async (codes) => {
  let services = []
  try {
    const query = 'select ' + tableFields.join(', ') + ' from schemas_local_authority where code = ANY($1::text[])'
    const { rows } = await pool.query(query, [codes])
    if (rows.length > 0) services = rows
    services = rows
  } catch (e) {
    console.log(e)
  }
  return services
}

module.exports.getLocalAuthoritySlugFromName = (name) => {
  return name.trim().replace(/[^\w\s]/gi, '').replace(/ /g, '_').toLowerCase()
}
