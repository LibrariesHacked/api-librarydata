'use strict'

import express from 'express'

import authenticate from './routes/authenticate.js'
import libraries from './routes/libraries.js'
import schemas from './routes/schemas.js'
import services from './routes/services.js'

// Load environment variables
import dotenv from 'dotenv'

// Load environment variables with defaults
import dotenvDefaults from 'dotenv-defaults'
const app = express()
dotenv.config()
dotenvDefaults.config()

// Allow cross origin
app.use(function (req, res, next) {
  res.header('Access-Control-Allow-Origin', '*')
  res.header(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept, Authorization'
  )
  res.header('Access-Control-Allow-Methods', 'POST, PUT, GET, OPTIONS')
  next()
})

app.use(express.urlencoded({ extended: false }))
app.use(express.json())
app.use(express.text({ type: 'text/csv' }))

app.use('/authenticate', authenticate)
app.use('/libraries', libraries)
app.use('/schemas', schemas)
app.use('/services', services)

const port = process.env.PORT || 3000
const server = app.listen(port)
server.timeout = 240000
