const pg = require('pg')

// Currently using timestamp without timezone so this ensures the time isn't messed with
pg.types.setTypeParser(1114, str => str)

const config = {
  user: process.env.PGUSER,
  host: process.env.PGHOST,
  database: process.env.PGDATABASE,
  password: process.env.PGPASSWORD,
  port: process.env.PGPORT,
  ssl: {
    rejectUnauthorized: false
  },
  max: 10,
  idleTimeoutMillis: 30000
}

var pool = new pg.Pool(config)

module.exports = pool
