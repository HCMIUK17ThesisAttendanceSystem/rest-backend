const { validationResult } = require('express-validator');

const Student = require('../../models/student');

const {
  checkStatusCode,
  createError
} = require('../../util/error-handler');

exports.createStudent = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty())
    throw createError('Validation failed D:', 422, errors.array());

  const {
    name, id, rfidTag
  } = req.body;
  const student = new Student({
    name, id, rfidTag
  });

  try {
    await student.save();
    res.status(201).json({
      message: 'Created student :D',
      student
    })
  } catch (error) {
    checkStatusCode(error, next);
  }
};

