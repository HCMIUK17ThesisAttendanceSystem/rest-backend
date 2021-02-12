const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');

const Lecturer = require('../../models/lecturer');
const {
  checkStatusCode,
  createError
} = require('../../util/error-handler');
const {
  createLecturerEmail,
  updateLecturerPasswordEmail
} = require('../../util/mailer');

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

    await createLecturerEmail(email, password, name);

    res.status(201).json({
      message: 'Lecturer created :D',
      lecturerId: createdLecturer._id,
      lecturer
    });
  } catch (error) {
    checkStatusCode(error, next);
  };
};

exports.updateLecturerPassword = async (req, res, next) => {
  const { lecturerId, newPassword } = req.body;

  try {
    const lecturer = await Lecturer.findById(lecturerId);
    if (!lecturer)
      throw createError('Lecturer not found D:', 404);

    const newHashedPassword = bcrypt.hash(newPassword, 12);
    lecturer.password = newHashedPassword;
    await lecturer.save();

    await updateLecturerPasswordEmail(lecturer.email, newPassword, lecturer.name);

    res.status(200).json({
      message: 'Updated lecturer\'s password :D',
      lecturerId: lecturer._id
    });
  } catch (error) {
    checkStatusCode(error, next);
  }
};

exports.getLecturers = async (req, res, next) => {
  try {
    const lecturers = await Lecturer.find();
    res.status(200).json({
      message: 'Fetched all lecturers :D',
      lecturers
    })
  } catch (error) {
    checkStatusCode(error, next);
  }
};

exports.deleteLecturer = async (req, res, next) => {
  const { lecturerId } = req.params;
  console.log(req.body);
  try {
    const lecturer = await Lecturer.findById(lecturerId);
    
    if (!lecturer)
      throw createError('Lecturer not found D:', 404);

    await Lecturer.findByIdAndRemove(lecturerId);
    // find all courses where lecturer = lecId
    // remove relation

    res.status(200).json({
      message: 'Lecturer & courses\' relationships removed'
    });
  } catch (error) {
    checkStatusCode(error, next);
  }
};