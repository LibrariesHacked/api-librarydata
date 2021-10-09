const pool = require('../helpers/database')

const tableFields = ['code', 'name']

module.exports.getLocalAuthorities = async () => {
  let services = []
  try{
    const query = 'select ' + tableFields.join(', ') + ' from schemas_local_authority'
    const { rows } = await pool.query(query)
    if (rows.length > 0) services = rows
    services = rows
  } catch (e) {}
  return services
}
