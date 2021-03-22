const Airtable = require('airtable')

module.exports.getAllRecordsInTable = async (baseName, table) => {
  const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(baseName)
  var allRecords = await base(table).select({}).all()
  return allRecords.map(r => r.fields)
}

module.exports.getSingleFieldArrayAllRecordsInTable = async (baseName, table, fieldName, filterFieldName, filterFieldValue) => {
  const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(baseName)
  var select = {}
  if (filterFieldName) {
    select = {
      filterByFormula: '({' + filterFieldName + "} = '" + filterFieldValue + "')"
    }
  }
  try {
    var allRecords = await base(table).select(select).all()
    return allRecords.map(r => r.fields[fieldName]).filter(Boolean)
  } catch (e) {
    return null
  }
}

module.exports.getRecordInTable = async (baseName, table, fieldName, fieldValue) => {
  const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(baseName)

  var records = await base(table).select({
    maxRecords: 1,
    filterByFormula: '({' + fieldName + "} = '" + fieldValue + "')"
  }).all()

  if (records.length > 0) return records[0].fields
  return null
}
