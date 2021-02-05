const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const Lecturer = require('../../models/lecturer');
const {
  checkStatusCode,
  createError
} = require('../../util/error-handler');

exports.createLecturer = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty())
    throw createError('Validation failed D:', 422, errors.array());

  const { email, password, name } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 12);
    const user = new User({
      email,
      password: hashedPassword,
      name
    });
    const createdUser = await user.save();
    res.status(201).json({
      message: 'User created :D',
      userId: createdUser._id
    });
  } catch (error) {
    checkStatusCode(error, next);
  };
};

