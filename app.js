'use strict'

import express from 'express'

import authenticate from './routes/authenticate.js'
import libraries from './routes/libraries.js'
import schemas from './routes/schemas.js'
import services from './routes/services.js'

import dotenv from 'dotenv'
import dotenvDefaults from 'dotenv-defaults'

const app = express()
dotenv.config()
dotenvDefaults.config()

// Allow cross origin requests
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.header(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept, Authorization'
  )
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
