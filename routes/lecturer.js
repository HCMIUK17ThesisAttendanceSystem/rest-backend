const express = require('express');
const { body } = require('express-validator');

const isAuth = require('../util/is-auth');

const authController = require('../controllers/lecturer/auth');
const courseController = require('../controllers/lecturer/course');
const attendanceController = require('../controllers/lecturer/attendance');

const Router = express.Router();
// Authorization
//________________________________________________________________
// POST /lecturer/login
Router.post('/login',
  [
    body('email')
      .isEmail()
      .withMessage('Pls enter valid email D:')
      .normalizeEmail(),
    body('password').trim()
      .isLength({ min: 5 })
  ],
  authController.login
);
//________________________________________________________________

// Manage courses
//________________________________________________________________
// GET /lecturer/courses
Router.get('/courses', isAuth, courseController.getCourses);

// GET /lecturer/current-course
Router.get('/current-course', isAuth, courseController.getCurrentCourse);

// GET /lecturer/overall-report/:courseId
Router.get('/overall-report/:courseId', isAuth, courseController.downloadAttendanceReport);
//________________________________________________________________


// Manage attendance
//________________________________________________________________
// POST /lecturer/attendance
Router.post('/attendance', isAuth, attendanceController.postAttendance);

// GET /lecturer/overall-attendance/:courseId
Router.get('/overall-attendance/:courseId', isAuth, attendanceController.getAttendanceReport);

Router.get('/download-report/:courseId', isAuth, attendanceController.downloadAttendanceReport);
//________________________________________________________________

module.exports = Router;
