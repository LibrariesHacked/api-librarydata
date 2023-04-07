'use strict'

const express = require('express')
const app = express()

const authenticate = require('./routes/authenticate')
const libraries = require('./routes/libraries')
const schemas = require('./routes/schemas')
const services = require('./routes/services')

require('dotenv').config()
require('dotenv-defaults').config()

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
