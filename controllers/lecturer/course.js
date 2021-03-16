const { validationResult } = require('express-validator');

const Course = require('../../models/course');
const Subject = require('../../models/subject');
const Lecturer = require('../../models/lecturer');
const Student = require('../../models/student');

const {
  errorHandler,
  createError
} = require('../../util/error-handler');

exports.getCourses = async (req, res, next) => {
  try {
    const courses = await Course.find({ lecturerId: req.userId }); // req.userId from is-auth
    if (!courses)
      throw createError('No available courses for this lecturer D:', 404);
    
    const subjects = await Subject.find(null, 'name id');
    const students = await Student.find(null, 'name id');

    res.status(200).json({
      message: 'Fetched courses :D',
      courses,
      subjects,
      students
    });
  } catch (error) {
    errorHandler(req, error, next);
  }
};