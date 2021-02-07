const { validationResult } = require('express-validator');

const Course = require('../../models/course');
const Subject = require('../../models/subject');
const Lecturer = require('../../models/lecturer');

const {
  checkStatusCode,
  createError
} = require('../../util/error-handler');

exports.createCourse = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty())
    throw createError('Validation failed D:', 422, errors.array());

  const { 
    classType, room, weekday, 
    periodStart, periodEnd, 
    lecturerId, subjectId 
  } = req.body;
  const course = new Course({
    classType, room, weekday, 
    periodStart, periodEnd, 
    lecturerId, subjectId 
  });

  try {
    await course.save();
    
    const lecturer = await Lecturer.findById(lecturerId);
    lecturer.courses.push(course);
    await lecturer.save();

    const subject = await Subject.findById(subjectId);
    subject.courses.push(course);
    await subject(save);

    res.status(201).json({
      message: 'Created course :D',
      course,
      subject,
      lecturer
    });

  } catch (error) {
    checkStatusCode(error, next);
  }
};
