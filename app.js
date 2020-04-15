"use strict";
const express = require("express");
const bodyParser = require('body-parser');
const app = express();

const services = require('./routes/services');

require('dotenv').config();
require('dotenv-defaults').config()

// Allow cross origin
app.use(function (req, res, next) {
	res.header("Access-Control-Allow-Origin", "*");
	res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
	next();
});

// Allow us to read JSON as JSON and text as text
app.use(bodyParser.json());
app.use(bodyParser.text({ type: 'text/csv' }));
app.use(bodyParser.urlencoded({ extended: false }));

app.use('/services', services);

const port = process.env.PORT || 8080;
const server = app.listen(port);
server.timeout = 240000;