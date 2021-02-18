const { validationResult } = require('express-validator');

const Student = require('../../models/student');

const {
  checkStatusCode,
  createError
} = require('../../util/error-handler');

exports.createStudent = async (req, res, next) => {

  try {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      throw createError('Validation failed D:', 422, errors.array());

    const {
      name, id, rfidTag
    } = req.body;
    // const rfidTag = await RFID.findOne({ id: rfidTagId });
    const student = new Student({
      name, id, rfidTag
    });
    await student.save();
    res.status(201).json({
      message: 'Created student :D',
      student
    })
  } catch (error) {
    checkStatusCode(error, next);
  }
};

exports.getStudents = async (req, res, next) => {
  try {
    const students = await Student.find();
    if (!students)
      throw createError('Students not found D:', 404);
    res.status(200).json({ students });
  } catch (error) {
    checkStatusCode(error, next);
  }
};
