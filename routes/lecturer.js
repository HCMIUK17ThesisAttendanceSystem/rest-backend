const express = require('express');
const { body } = require('express-validator');

const isAuth = require('../util/is-auth');
const { createError } = require('../util/error-handler');

const authController = require('../controllers/lecturer/auth');
const courseController = require('../controllers/lecturer/course');

const Lecturer = require('../models/lecturer');

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
//________________________________________________________________


module.exports = Router;
