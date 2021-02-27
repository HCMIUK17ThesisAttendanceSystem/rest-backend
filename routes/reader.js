const express = require('express');
const { body } = require('express-validator');

const rfidController = require('../controllers/reader/rfid');

const Router = express.Router();

Router.get('/hello', rfidController.hello);

// Manage RFID tags
//________________________________________________________________
// POST /reader/create-rfid
Router.post('/new-rfid',
  rfidController.createStudentRFID
);
//________________________________________________________________

// Manage attendance records
//________________________________________________________________
// 
//________________________________________________________________
module.exports = Router;
