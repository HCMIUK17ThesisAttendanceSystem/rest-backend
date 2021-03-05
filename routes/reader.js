const express = require('express');
const { body } = require('express-validator');

const rfidController = require('../controllers/reader/rfid');
const attendanceController = require('../controllers/reader/attendance');

const Router = express.Router();

Router.get('/hello', rfidController.hello);

// Manage RFID tags
//________________________________________________________________
// POST /reader/new-rfid
Router.post('/new-rfid',
  rfidController.createStudentRFID
);
//________________________________________________________________

// Manage attendance records
//________________________________________________________________
// POST reader/attendance
Router.post('/attendance', attendanceController.checkAttendance);
//________________________________________________________________
module.exports = Router;
