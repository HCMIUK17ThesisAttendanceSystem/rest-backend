const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const Admin = require('../../models/admin');
const {
  checkStatusCode,
  createError
} = require('../../util/error-handler');

exports.signup = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log(errors);
    throw createError('Validation failed D:', 422, errors.array());
  }

  const { email, password, name } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 12);
    const admin = new Admin({
      email,
      password: hashedPassword,
      name
    });
    const createdAdmin = await admin.save();
    res.status(201).json({
      message: 'Admin created :D',
      adminId: createdAdmin._id
    });
  } catch (error) {
    checkStatusCode(error, next);
  }
};

exports.login = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty())
    throw createError('Validation failed D:', 422, errors.array());

  const { email, password } = req.body;

  try {
    const admin = await Admin.findOne({ email });
    if (!admin)
      throw createError('Admin not found D:', 401); // 401: not authenticated

    const isEqual = await bcrypt.compare(password, admin.password);
    if (!isEqual)
      throw createError('Wrong password D:', 401);
    const token = jwt.sign(
      {
        email: admin.email,
        adminId: admin._id.toString()
      },
      'asecretprivatekey',
      { expiresIn: '1h' }
    );
    res.status(200).json({
      token,
      adminId: admin._id.toString()
    });
  } catch (error) {
    checkStatusCode(error, next);
  };
};
