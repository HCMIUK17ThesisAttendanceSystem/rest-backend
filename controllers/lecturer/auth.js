const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const Lecturer = require('../../models/lecturer');
const {
  errorHandler,
  createError
} = require('../../util/error-handler');

exports.login = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      throw createError('Validation failed D:', 422, errors.array());

    const { email, password } = req.body;

    const lecturer = await Lecturer.findOne({ email });
    if (!lecturer)
      throw createError('Lecturer not found D:', 401); // 401: not authenticated

    const isEqual = await bcrypt.compare(password, lecturer.password);
    if (!isEqual)
      throw createError('Wrong password D:', 401);
    const token = jwt.sign(
      {
        email: lecturer.email,
        userId: lecturer._id.toString()
      },
      'asecretprivatekey',
      { expiresIn: '1h' }
    );
    res.status(200).json({
      token,
      userId: lecturer._id.toString()
    });
  } catch (error) {
    errorHandler(req, error, next);
  };
};

exports.changePassword = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      throw createError('Validation failed D:', 422, errors.array());

    const { lecturerId, oldPassword, newPassword } = req.body;

    const lecturer = await Lecturer.findById(lecturerId);
    if (!lecturer)
      throw createError('Lecturer not found D:', 401); // 401: not authenticated

    const isEqual = await bcrypt.compare(oldPassword, lecturer.password);
    if (!isEqual)
      throw createError('Wrong old password D:', 401);

    const hashedNewPassword = await bcrypt.hash(newPassword, 12);
    lecturer.password = hashedNewPassword;
    await lecturer.save();

    res.status(200).json({
      message: 'Changed password :D',
      userId: lecturer._id.toString()
    });
  } catch (error) {
    errorHandler(req, error, next);
  };
};
