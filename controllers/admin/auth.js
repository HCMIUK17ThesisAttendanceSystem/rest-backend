const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const Admin = require('../../models/admin');
const {
  errorHandler,
  createError
} = require('../../util/error-handler');

exports.signup = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log(errors);
      throw createError('Validation failed D:', 422, errors.array());
    }

    const { email, password, name } = req.body;

    const hashedPassword = await bcrypt.hash(password, 12);
    const admin = new Admin({
      email,
      password: hashedPassword,
      name
    });
    const createdAdmin = await admin.save();
    res.status(201).json({
      message: 'Admin created :D',
      userId: createdAdmin._id
    });
  } catch (error) {
    errorHandler(req, error, next);
  }
};

exports.login = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      throw createError('Validation failed D:', 422, errors.array());

    const { email, password } = req.body;

    const admin = await Admin.findOne({ email });
    if (!admin)
      throw createError('Admin not found D:', 401); // 401: not authenticated

    const isEqual = await bcrypt.compare(password, admin.password);
    if (!isEqual)
      throw createError('Wrong password D:', 401);
    const token = jwt.sign(
      {
        email: admin.email,
        userId: admin._id.toString()
      },
      'asecretprivatekey',
      { expiresIn: '1h' }
    );
    res.status(200).json({
      token,
      userId: admin._id.toString()
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

    const { adminId, oldPassword, newPassword } = req.body;

    const admin = await Admin.findById(adminId);
    if (!admin)
      throw createError('Admin not found D:', 401); // 401: not authenticated

    const isEqual = await bcrypt.compare(oldPassword, admin.password);
    if (!isEqual)
      throw createError('Wrong old password D:', 401);

    const hashedNewPassword = await bcrypt.hash(newPassword, 12);
    admin.password = hashedNewPassword;
    await admin.save();

    res.status(200).json({
      message: 'Changed password :D',
      userId: admin._id.toString()
    });
  } catch (error) {
    errorHandler(req, error, next);
  };
};
