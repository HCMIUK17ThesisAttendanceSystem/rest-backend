const express = require('express');
const { body } = require('express-validator');

const authController = require('../controllers/admin/auth');
const lecController = require('../controllers/admin/lecturer');

const Admin = require('../models/admin');
const Lecturer = require('../models/lecturer');

const Router = express.Router();

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

module.exports = Router;