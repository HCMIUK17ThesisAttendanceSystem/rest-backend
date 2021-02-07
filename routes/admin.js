const express = require('express');
const { body } = require('express-validator');

const authController = require('../controllers/admin/auth');
const lecController = require('../controllers/admin/lecturer');
const subjectController = require('../controllers/admin/subject');
const courseController = require('../controllers/admin/course');
const studentController = require('../controllers/admin/student');

const Admin = require('../models/admin');
const Lecturer = require('../models/lecturer');

const Router = express.Router();

// Authorization
//________________________________________________________________
// PUT /admin/signup
Router.put('/signup',
  [
    body('email')
      .isEmail()
      .withMessage('Pls enter valid email D:')
      .custom((value, { req }) => {
        return Admin.findOne({ email: value }).then(adminDoc =>
          adminDoc && Promise.reject('Email already existed D:')
        );
      })
      .normalizeEmail(),
    body('password').trim()
      .isLength({ min: 5 }),
    body('name').trim()
      .not().isEmpty()
  ],
  authController.signup
);

// POST /admin/login
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

// Manage lecturers
//________________________________________________________________
// POST /admin/create-lecturer
Router.post('/create-lecturer',
  [
    body('email')
      .isEmail()
      .withMessage('Pls enter valid email D:')
      .custom((value, { req }) => {
        return Lecturer.findOne({ email: value }).then(lecDoc =>
          lecDoc && Promise.reject('Email already existed D:')
        );
      })
      .normalizeEmail(),
    body('password').trim()
      .isLength({ min: 5 }),
    body('name').trim()
      .not().isEmpty()
  ],
  lecController.createLecturer
);
//________________________________________________________________

// Manage subjects
//________________________________________________________________
// POST /admin/create-subject
Router.post('/create-subject',
  [
    body('id')
      .isLength({ min: 8, max: 8 })
      .isAlphanumeric()
      .notEmpty().trim(),
    body('name')
      .isLength({ min: 5 })
      .matches(/^[a-zA-Z0-9 ]/) // Alphanumeric and spaces
      .notEmpty().trim(), 
    body('creditLab')
      .isInt()
      .notEmpty(),
    body('creditTheory')
      .isInt()
      .notEmpty()
      .custom((value, { req }) => {
        if (parseInt(value, 10) + parseInt(req.body.creditLab, 10) <= 0) {
          throw new Error('The course has no credit D:');
        } else {
          return value;
        }
      })
  ],
  // isAuth,
  subjectController.createSubject
);
//________________________________________________________________

// Manage courses
//________________________________________________________________
Router.post('/create-course', 
  [
    body('classType')
      .notEmpty(),
    body('room')
      .notEmpty().trim()
      .isLength({ min: 4, max: 6 })
      .matches(/^[A-Z0-9 .]/),
    body('weekday')
      .notEmpty().trim()
      .
  ], 
  courseController.createCourse
);

//________________________________________________________________


module.exports = Router;