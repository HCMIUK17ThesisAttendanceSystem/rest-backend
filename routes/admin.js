const express = require('express');
const { body } = require('express-validator');

const isAuth = require('../util/is-auth');

const authController = require('../controllers/admin/auth');
const lecController = require('../controllers/admin/lecturer');
const subjectController = require('../controllers/admin/subject');
const courseController = require('../controllers/admin/course');
const studentController = require('../controllers/admin/student');
const rfidController = require('../controllers/admin/rfid');

const Admin = require('../models/admin');
const Lecturer = require('../models/lecturer');
const Subject = require('../models/subject');
const { createError } = require('../util/error-handler');
const e = require('express');

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
// POST /admin/lecturer
Router.post('/lecturer',
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

// PUT /admin/lecturer-password
Router.put('/lecturer-password',
  [
    body('newPassword').trim()
      .isLength({ min: 5 })
  ],
  lecController.updateLecturerPassword
);

// GET /admin/lecturers
Router.get('/lecturers', lecController.getLecturers);

// DELETE /admin/lecturer
Router.delete('/lecturer/:lecturerId', lecController.deleteLecturer);

//________________________________________________________________

// Manage subjects
//________________________________________________________________
// POST /admin/subject
Router.post('/subject',
  [
    body('id')
      .isLength({ min: 7, max: 7 })
      .isAlphanumeric()
      .trim(),
    body('name').trim()
      .isLength({ min: 5 })
      .matches(/^[a-zA-Z0-9 ]/), // Alphanumeric and spaces
    body('creditLab')
      .isInt({ min: 0 })
      .custom((value, { req }) => {
        if (parseInt(value) + parseInt(req.body.creditTheory) <= 0) {
          throw new Error('The course has no credit D:');
        }
        return true;
      }),
    body('creditTheory')
      .isInt({ min: 0 })
  ],
  isAuth,
  subjectController.createSubject
);

// GET /admin/subjects
Router.get('/subjects', isAuth, subjectController.getSubjects);

// DELETE /admin/subject
Router.delete('/subject/:subjectId', isAuth, subjectController.deleteSubject);

//________________________________________________________________

// Manage courses
//________________________________________________________________
Router.post('/course',
  [
    body('classType')
      .isInt({ min: 0, max: 1 }),
    body('room')
      .trim()
      .isLength({ min: 4, max: 6 })
      .matches(/^[A-Z0-9 .]/),
    body('weekday')
      .isInt({ min: 0, max: 6 }),
    body('periods')
      .isArray()
      .withMessage('Minimun period number is 2, max is 5 D:')
      .custom((value) => {
        if (!value.every(Number.isInteger))
          throw createError('Periods are not Integers', 502);
        if (value.some((el, idx) => idx !== 0 ?
          el != parseInt(value[idx - 1]) + 1 :
          el != parseInt(value[value.length - 1]) - parseInt(value.length - 1)
        ))
          throw createError('Invalid periods\' data', 502);
        return true;
      }), // valid periods: [1,2,3]...
    // body('periodStart')
    //   .isInt({ min: 1, max: 15 }),
    // body('periodEnd')
    //   .isInt({ min: 2, max: 16 })
    //   .custom((value, { req }) => {
    //     if (value < req.body.periodStart) {
    //       throw new Error('Start period larger than end period D:');
    //     } else {
    //       return value;
    //     }
    //   }),
    body('subjectId')
      .custom((value, { req }) => {
        return Subject.findById(value).then(subjectDoc =>
          !subjectDoc && Promise.reject('Subject doesn\'t exist D:')
        );
      }),
    body('lecturerId')
      .custom((value, { req }) => {
        return Lecturer.findById(value).then(lecDoc =>
          !lecDoc && Promise.reject('Lecturer doesn\'t exist D:')
        );
      })
  ],
  courseController.createCourse
);

//GET /admin/courses
Router.get('/courses', isAuth, courseController.getCourses);

// GET /admin/course/:courseId
Router.get('/course/:courseId', isAuth, courseController.getCourse);

// DELETE /admin/course/:courseId
Router.delete('/course/:courseId', isAuth, courseController.deleteCourse);

// PUT /admin/registrations
Router.put('/registrations', isAuth, courseController.updateRegistration);
//________________________________________________________________

// Manage students
//________________________________________________________________
// POST /admin/student
Router.post('/student',
  isAuth,
  [
    body('name')
      .notEmpty().trim(),
    body('id')
      .matches(/^[A-Z0-9]/)
      .isLength({ min: 11, max: 11 })
      .trim()
  ],
  studentController.createStudent
);

// GET /admin/students
Router.get('/students', isAuth, studentController.getStudents);

// DELETE /admin/student/:studentId
Router.delete('/student/:studentId', isAuth, studentController.deleteStudent);
//________________________________________________________________

// Manage rfids
//________________________________________________________________
// GET /admin/new-rfid
Router.get('/new-rfid',
  isAuth,
  rfidController.getNewStudentRfid
);
//________________________________________________________________

module.exports = Router;