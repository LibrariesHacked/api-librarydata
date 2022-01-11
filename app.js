'use strict'

const express = require('express')
const app = express()

const authenticate = require('./routes/authenticate')
const services = require('./routes/services')
const schemas = require('./routes/schemas')
const libraries = require('./routes/libraries')

require('dotenv').config()
require('dotenv-defaults').config()

// Allow cross origin
app.use(function (req, res, next) {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept')
  res.header('Access-Control-Allow-Methods', 'POST, PUT, GET, OPTIONS')
  next()
})

app.use(express.urlencoded({ extended: false }))
app.use(express.json())
app.use(express.text({ type: 'text/csv' }))

app.use('/authenticate', authenticate)
app.use('/schemas', schemas)
app.use('/services', services)
app.use('/libraries', libraries)

const port = process.env.PORT || 8080
const server = app.listen(port)
server.timeout = 240000
