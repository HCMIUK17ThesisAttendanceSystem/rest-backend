const express = require('express');
const { body } = require('express-validator');

const rfidController = require('../controllers/reader/rfid');
const attendanceController = require('../controllers/reader/attendance');
const courseController = require('../controllers/reader/course');

const Router = express.Router();

Router.get('/hello', rfidController.hello);

// Manage RFID tags
//________________________________________________________________
// POST /reader/new-rfid
Router.post('/new-rfid', rfidController.createStudentRFID);

// POST /reader/rfid
Router.post('/rfid', rfidController.createRFID);
//________________________________________________________________

// Manage attendance records
//________________________________________________________________
// POST reader/attendance
Router.post('/attendance', attendanceController.checkAttendance);
//________________________________________________________________

// Manage course
//________________________________________________________________
// GET reader/current-course/:roomCode
Router.get('/current-course/:roomCode', courseController.getCurrentCourse);
//________________________________________________________________

module.exports = Router;
