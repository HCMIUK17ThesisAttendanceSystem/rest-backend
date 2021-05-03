const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');

const Lecturer = require('../../models/lecturer');
const {
  errorHandler,
  createError
} = require('../../util/error-handler');
const { sendEmailWithTemplate } = require('../../util/mailer-example');

exports.createLecturer = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      throw createError('Validation failed D:', 422, errors.array());

    const { email, password, name } = req.body;

    await sendEmailWithTemplate('/welcome.ejs', { name, email, password }, email, 'Welcome to Presence!');

    const hashedPassword = await bcrypt.hash(password, 12);
    const lecturer = new Lecturer({
      email,
      password: hashedPassword,
      name
    });
    const createdLecturer = await lecturer.save();

    res.status(201).json({
      message: 'Lecturer created :D',
      lecturerId: createdLecturer._id,
      lecturer
    });
  } catch (error) {
    errorHandler(req, error, next);
  };
};

exports.updateLecturerPassword = async (req, res, next) => {
  const { lecturerId, newPassword } = req.body;

  try {
    const lecturer = await Lecturer.findById(lecturerId);
    if (!lecturer)
      throw createError('Lecturer not found D:', 404);

    const newHashedPassword = await bcrypt.hash(newPassword, 12);
    lecturer.password = newHashedPassword;
    await lecturer.save();

    //await updateLecturerPasswordEmail(lecturer.email, newPassword, lecturer.name);

    res.status(200).json({
      message: 'Updated lecturer\'s password :D',
      lecturerId: lecturer._id
    });
  } catch (error) {
    errorHandler(req, error, next);
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
    errorHandler(req, error, next);
  }
};

exports.deleteLecturer = async (req, res, next) => {
  const { lecturerId } = req.params;

  try {
    const lecturer = await Lecturer.findById(lecturerId);

    if (!lecturer)
      throw createError('Lecturer not found D:', 404);

    if (lecturer.courseIds.length > 0) {
      res.status(302).json({
        message: 'Can\'t delete lecturer with courses'
      });
    } else {
      await Lecturer.findByIdAndRemove(lecturerId);

      res.status(200).json({
        message: 'Lecturer removed'
      });
    }
  } catch (error) {
    errorHandler(req, error, next);
  }
};