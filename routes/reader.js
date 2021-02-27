const express = require('express');
const { body } = require('express-validator');

const rfidController = require('../controllers/reader/rfid');

const Router = express.Router();

// Manage RFID tags
//________________________________________________________________
// POST /reader/new-rfid
Router.post('/new-rfid',
  rfidController.createRFID
);
//________________________________________________________________

// Manage attendance records
//________________________________________________________________
// 
//________________________________________________________________
module.exports = Router;
