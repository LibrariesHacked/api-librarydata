'use strict'
const express = require('express')
const bodyParser = require('body-parser')
const app = express()

const authenticate = require('./routes/authenticate')
const services = require('./routes/services')
const libraries = require('./routes/libraries')

require('dotenv').config()
require('dotenv-defaults').config()

// Allow cross origin
app.use(function (req, res, next) {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept')
  next()
})

// Allow us to read JSON as JSON and text as text
app.use(bodyParser.json())
app.use(bodyParser.text({ type: 'text/csv' }))
app.use(bodyParser.urlencoded({ extended: false }))

app.use('/authenticate', authenticate)
app.use('/services', services)
app.use('/libraries', libraries)

const port = process.env.PORT || 8080
const server = app.listen(port)
server.timeout = 240000
