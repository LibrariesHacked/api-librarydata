import pg from 'pg'

const { types, Pool } = pg

// Currently using timestamp without timezone so this ensures the time isn't messed with
types.setTypeParser(1114, str => str)

// This is the connection to the database
// It uses the .env file to get the credentials
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

const pool = new Pool(config)

export default pool
