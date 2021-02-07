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
    const lecturer = new Lecturer({
      email,
      password: hashedPassword,
      name
    });
    const createdLecturer = await lecturer.save();
    res.status(201).json({
      message: 'Lecturer created :D',
      lecturerId: createdLecturer._id
    });
  } catch (error) {
    checkStatusCode(error, next);
  };
};

exports.deleteLecturer = async (req, res, next) => {
  const { lecId } = req.body;

  try {
    await Lecturer.findByIdAndRemove(lecId);

    // find all courses where lecturer = lecId
    // remove relation

    res.status(200).json({
      message: 'Lecturer & courses\' relationships removed'
    });
  } catch (error) {
    checkStatusCode(error, next);
  }
};