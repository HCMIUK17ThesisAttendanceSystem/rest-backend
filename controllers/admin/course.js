const { validationResult } = require('express-validator');

const Course = require('../../models/course');
const Subject = require('../../models/subject');
const Lecturer = require('../../models/lecturer');
const Student = require('../../models/student');

const {
  checkStatusCode,
  createError
} = require('../../util/error-handler');

exports.createCourse = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log(errors.array());
      throw createError('Validation failed D:', 422, errors.array());
    }

    const {
      classType, room, weekday,
      periods,
      lecturerId, subjectId
    } = req.body;

    const existingCourses = await Course.find({ room, weekday });

    const overlappingCourse = existingCourses.find(course => {
      course.periods.some(period => periods.includes(period))
    })
    if (overlappingCourse)
      throw createError('Courses are overlapping', 503, overlappingCourse);

    const course = new Course({
      classType, room, weekday,
      periods,
      lecturerId, subjectId
    });
    await course.save();

    const lecturer = await Lecturer.findById(lecturerId);
    if (!lecturer)
      throw createError('Lecturer not found D:', 404);
    lecturer.courseIds.push(course);
    await lecturer.save();

    const subject = await Subject.findById(subjectId);
    if (!subject)
      throw createError('Subject not found D:', 404);
    subject.courseIds.push(course);
    await subject.save();

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

// TODO update overlapping logic
exports.updateCourse = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      throw createError('Validation failed D:', 422, errors.array());

    const {
      courseId,
      classType, room, weekday,
      periods
    } = req.body;

    const course = await Course.findById(courseId);
    if (!course)
      throw createError('Course not found D:', 404);

    course.classType = classType;
    course.room = room;
    course.weekday = weekday;
    course.periods = periods;
    await course.save();
  } catch (error) {
    checkStatusCode(error, next);
  }
};

exports.deleteCourse = async (req, res, next) => {
  const { courseId } = req.params;

  try {
    const course = await Course.findById(courseId);
    if (!course)
      throw createError('Course not found D:', 404);

    await Course.findByIdAndRemove(courseId);
    res.status(200).json({ message: 'Deleted course :D' });
  } catch (error) {
    checkStatusCode(error, next);
  }
};

exports.getCourse = async (req, res, next) => {
  const { courseId } = req.params;

  try {
    const course = await Course.findById(courseId);

    if (!course)
      throw createError('Course not found D:', 404);

    res.status(200).json({ message: 'Fetched course :D', course });
  } catch (error) {
    checkStatusCode(error, next);
  }
}

exports.getCourses = async (req, res, next) => {
  try {
    const courses = await Course.find();

    const subjects = await Subject.find(null, 'name id');
    const lecturers = await Lecturer.find(null, 'name');

    res.status(200).json({ courses, subjects, lecturers });
  } catch (error) {
    checkStatusCode(error, next);
  }
};

exports.getCoursesByLecturerId = async (req, res, next) => {
  const { lecturerId } = req.body;
  try {
    const courses = await Course.find({ lecturerId });

    res.status(200).json({ courses });
  } catch (error) {
    checkStatusCode(error, next);
  }
};

exports.getCoursesBySubjectId = async (req, res, next) => {
  const { subjectId } = req.body;
  try {
    const courses = await Course.find({ subjectId });

    res.status(200).json({ courses });
  } catch (error) {
    checkStatusCode(error, next);
  }
};

exports.getRegistrations = async (req, res, next) => {
  const { courseId } = req.body;

  try {
    const course = await Course.findById(courseId).populate('regStudentIds');
    if (!course)
      throw createError('Course not found D:', 404);

    const students = await Student.find();
    if (!students)
      throw createError('No student created D:', 503);

    res.status(200).json({
      message: 'Fetched course\'s student ids :D',
      regStudents: course.regStudentIds,
      students: students
    })
  } catch (error) {
    checkStatusCode(error, next);
  }
};

// TODO
exports.updateRegistration = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      throw createError('Validation failed D:', 422, errors.array());

    const { regStudentIds, courseId } = req.body;

    const course = await Course.findById(courseId);
    //.populate('regStudentIds');

    // Find 3 types of students
    // 1. Newly registered (in regIds, not in courseRegIds)
    const newStudentIds = regStudentIds
      .filter(id => !course.regStudentIds.includes(id));
    // 2. Old registered (in regIds, in courseRegIds)
    const oldRegStudentIds = regStudentIds
      .filter(id => course.regStudentIds.includes(id));
    // 3. Drop course (not in regIds, in courseRegIds)
    const dropStudentIds = course.regStudentIds
      .filter(id => !regStudentIds.includes(id));

    newStudentIds.forEach(async (id) => {
      const student = await Student.findById(id);
      if (!student)
        throw createError('Student not found D:', 404);

      student.regCourses.push(course);
      await student.save();
    });

    dropStudentIds.forEach(async (id) => {
      const student = await Student.findById(id);
      if (!student)
        throw createError('Student not found D:', 404);

      student.regCourses.pull(course._id);
      await student.save();
    });

    course.regStudentIds = regStudentIds;
    await course.save();

    res.status(200).json({
      message: 'Update registrations :D'
    });
  } catch (error) {
    checkStatusCode(error, next);
  }
};