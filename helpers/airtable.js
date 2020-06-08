const Airtable = require('airtable');

module.exports.getAllRecordsInTable = async (base_name, table) => {
  const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(base_name);
  var all_records = await base(table).select({}).all();
  return all_records.map(r => r.fields);
}

module.exports.getSingleFieldArrayAllRecordsInTable = async (base_name, table, field_name, filter_field_name, filter_field_value) => {
  const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(base_name);
  var select = {};
  if (filter_field_name) select = {
    filterByFormula: "({" + filter_field_name + "} = '" + filter_field_value + "')"
  };
  var all_records = await base(table).select(select).all();
  return all_records.map(r => r.fields[field_name]).filter(Boolean);
}

module.exports.getRecordInTable = async (base_name, table, field_name, field_value) => {
  const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(base_name);

  var records = await base(table).select({
    maxRecords: 1,
    filterByFormula: "({" + field_name + "} = '" + field_value + "')"
  }).all();

  if (records.length > 0) return records[0].fields;
  return null;
}