const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const Lecturer = require('../../models/lecturer');
const {
  checkStatusCode,
  createError
} = require('../../util/error-handler');

exports.login = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty())
    throw createError('Validation failed D:', 422, errors.array());

  const { email, password } = req.body;

  try {
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
    checkStatusCode(error, next);
  };
};
