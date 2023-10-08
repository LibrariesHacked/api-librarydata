const Airtable = require('airtable')

/**
 * Gets all records and fields from a table
 * @param {string} baseName The base name e.g. librarieshacked
 * @param {string} table The table name e.g. Library services
 * @returns {Array} An array of records
 */
module.exports.getAllRecordsInTable = async (baseName, table) => {
  const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(
    baseName
  )
  const allRecords = await base(table).select({}).all()
  return allRecords.map(r => r.fields)
}

/**
 * Gets a particular field from a filtered set of records from a table
 * @param {string} baseName The base name e.g. librarieshacked
 * @param {string} table The table name e.g. Library services
 * @param {string} fieldName The fields to return e.g. Name
 * @param {string} filterFieldName A field to filter on
 * @param {string} filterFieldValue The value to filter the filter field by
 * @returns {Array} An array of records
 */
module.exports.getSingleFieldArrayAllRecordsInTable = async (
  baseName,
  table,
  fieldName,
  filterFieldName,
  filterFieldValue
) => {
  const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(
    baseName
  )
  let select = {}
  if (filterFieldName) {
    select = {
      filterByFormula:
        '({' + filterFieldName + "} = '" + filterFieldValue + "')"
    }
  }
  try {
    const allRecords = await base(table).select(select).all()
    return allRecords.map(r => r.fields[fieldName]).filter(Boolean)
  } catch (e) {
    return null
  }
}

/**
 * Gets a single record from a table based upon a value match within a field
 * @param {string} baseName The base name e.g. librarieshacked
 * @param {string} table The table name e.g. Library services
 * @param {string} fieldName A field to filter on
 * @param {string} fieldValue The value to filter the filter field by
 * @returns
 */
module.exports.getRecordInTable = async (
  baseName,
  table,
  fieldName,
  fieldValue
) => {
  const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(
    baseName
  )

  const records = await base(table)
    .select({
      maxRecords: 1,
      filterByFormula: '({' + fieldName + "} = '" + fieldValue + "')"
    })
    .all()

  if (records.length > 0) return records[0].fields
  return null
}
