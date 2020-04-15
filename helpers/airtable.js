const Airtable = require('airtable');

module.exports.getAllRecordsInTable = (base_name, table, callback) => {
  const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(base_name);

  var all_records = [];
  base(table).select({
    view: 'Grid view'
  }).eachPage(function page(records, fetchNextPage) {
    records.forEach(function (record) {
      all_records.push(record.fields);
    });
    fetchNextPage();
  }, function done(err) {
    callback(all_records);
  });
}

module.exports.getRecordInTable = (base_name, table, record_field, record_value, callback) => {
  const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(base_name);

  base(table).select({
    maxRecords: 1,
    view: 'Grid view',
    filterByFormula: "({" + record_field + "} = '" + record_value + "')"
  }).firstPage(function (err, records) {
    if (records.length > 0) callback(records[0].fields);
    callback(null);
  });
}