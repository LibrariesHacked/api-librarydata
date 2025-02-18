import { query as _query } from '../helpers/database'

const tableFields = ['code', 'name', 'nice_name']

/**
 * Gets the local library authorities in the database
 * @returns {Array} Set of local authorities
 */
export async function getLocalAuthorities () {
  let services = []
  try {
    const query =
      'select ' + tableFields.join(', ') + ' from schemas_local_authority'
    const { rows } = await _query(query)
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
export async function getLocalAuthoritiesByCodes (codes) {
  let services = []
  try {
    const query =
      'select ' +
      tableFields.join(', ') +
      ' from schemas_local_authority where code = ANY($1::text[])'
    const { rows } = await _query(query, [codes])
    if (rows.length > 0) services = rows
    services = rows
  } catch (e) {
    console.log(e)
  }
  return services
}

export function getLocalAuthoritySlugFromName (name) {
  return name
    .trim()
    .replace(/[^\w\s]/gi, '')
    .replace(/ /g, '_')
    .toLowerCase()
}
