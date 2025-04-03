const dataUrl =
  'https://raw.githubusercontent.com/LibrariesHacked/librarydata-db/refs/heads/main/data/services/services.json'

/**
 * Gets all records and fields from library services
 * @returns {Array} An array of records
 */
export async function getAllRecordsInTable () {
  const response = await fetch(dataUrl)
  const allRecords = await response.json()
  if (!allRecords) return null
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
export const getSingleFieldArrayAllRecordsInTable = async (
  fieldName,
  filterFieldName,
  filterFieldValue
) => {
  const allRecords = await getAllRecordsInTable()
  if (!allRecords) return null
  // Filter the records based on the filter field name and value
  const filteredRecords = allRecords.filter(
    record => record[filterFieldName] === filterFieldValue
  )
  // Map the filtered records to the field name
  const fieldValues = filteredRecords.map(record => record[fieldName])
  return fieldValues
}

/**
 * Gets a single record from a table based upon a value match within a field
 * @param {string} fieldName A field to filter on
 * @param {string} fieldValue The value to filter the filter field by
 * @returns
 */
export const getRecordInTable = async (fieldName, fieldValue) => {
  const allRecords = await getAllRecordsInTable()
  if (!allRecords) return null

  const filteredRecords = allRecords.filter(
    record => record[fieldName] === fieldValue
  )
  return filteredRecords.length > 0 ? filteredRecords[0] : null
}
