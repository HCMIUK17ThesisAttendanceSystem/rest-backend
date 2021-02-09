const { validationResult } = require('express-validator');

const Student = require('../../models/student');
const RFID = require('../../models/rfid');

const {
  checkStatusCode,
  createError
} = require('../../util/error-handler');

exports.createStudent = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty())
    throw createError('Validation failed D:', 422, errors.array());

  const {
    name, id, rfidTagId
  } = req.body;

  try {
    const rfidTag = await RFID.findOne({ id: rfidTagId });
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

