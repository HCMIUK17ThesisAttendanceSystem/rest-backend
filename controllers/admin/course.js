const { validationResult } = require('express-validator');

const Course = require('../../models/course');
const Subject = require('../../models/subject');
const Lecturer = require('../../models/lecturer');
const Student = require('../../models/student');
const Room = require('../../models/room');

const {
  errorHandler,
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
      classType, weekday, periods,
      roomId, lecturerId, subjectId
    } = req.body;

    const existingCourses = await Course.find({ roomId, weekday });
    const overlappingCourses = existingCourses.find(course =>
      course.periods.some(period => periods.includes(period))
    );
    if (overlappingCourses)
      throw createError('Courses are overlapping', 503, overlappingCourses);

    const course = new Course({
      classType, weekday, periods,
      roomId, lecturerId, subjectId
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
    errorHandler(req, error, next);
  }
};

// TODO update overlapping logic
exports.updateCourse = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      throw createError('Validation failed D:', 422, errors.array());

    const {
      courseId, roomId,
      classType, weekday,
      periods
    } = req.body;

    const course = await Course.findById(courseId);
    if (!course)
      throw createError('Course not found D:', 404);

    course.classType = classType;
    course.roomId = roomId;
    course.weekday = weekday;
    course.periods = periods;
    await course.save();
  } catch (error) {
    errorHandler(req, error, next);
  }
};

exports.deleteCourse = async (req, res, next) => {
  const { courseId } = req.params;

  try {
    const course = await Course.findById(courseId);
    if (!course)
      throw createError('Course not found D:', 404);

    const lecturer = await Lecturer.findById(course.lecturerId);
    if (lecturer) {
      lecturer.courseIds.pull(courseId);
      await lecturer.save();
    }

    const subject = await Subject.findById(course.subjectId);
    if (subject) {
      subject.courseIds.pull(courseId);
      await subject.save();
    }

    course.regStudentIds.forEach(async (id) => {
      const student = await Student.findById(id);
      if (student) {
        student.regCourseIds.pull(courseId);
        await student.save();
      }
    });

    await Course.findByIdAndRemove(courseId);

    res.status(200).json({ message: 'Deleted course & relations :D' });
  } catch (error) {
    errorHandler(req, error, next);
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
    errorHandler(req, error, next);
  }
}

exports.getCourses = async (req, res, next) => {
  try {
    const courses = await Course.find();
    const subjects = await Subject.find(null, 'name id');
    const lecturers = await Lecturer.find(null, 'name');
    const students = await Student.find(null, 'name id');
    const rooms = await Room.find(null, 'code');

    res.status(200).json({ courses, subjects, lecturers, students, rooms });
  } catch (error) {
    errorHandler(req, error, next);
  }
};

exports.getCoursesByLecturerId = async (req, res, next) => {
  const { lecturerId } = req.body;
  try {
    const courses = await Course.find({ lecturerId });

    res.status(200).json({ courses });
  } catch (error) {
    errorHandler(req, error, next);
  }
};

exports.getCoursesBySubjectId = async (req, res, next) => {
  const { subjectId } = req.body;
  try {
    const courses = await Course.find({ subjectId });

    res.status(200).json({ courses });
  } catch (error) {
    errorHandler(req, error, next);
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
    errorHandler(req, error, next);
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
    if (!course)
      throw createError('Course not found D:', 404);

    const courseRegStudentIds = course.regStudentIds.map(id => id.toString());
    // Find 3 types of students
    // 1. Newly registered (in regIds, not in courseRegIds)
    const newStudentIds = regStudentIds
      .filter(id => !courseRegStudentIds.includes(id));
    // 2. Old registered (in regIds, in courseRegIds)
    const oldRegStudentIds = regStudentIds
      .filter(id => courseRegStudentIds.includes(id));
    // 3. Drop course (not in regIds, in courseRegIds)
    const dropStudentIds = courseRegStudentIds
      .filter(id => !regStudentIds.includes(id));

    newStudentIds.forEach(async (id) => {
      const student = await Student.findById(id);
      if (!student)
        throw createError('Student not found D:', 404);

      student.regCourseIds.push(course);
      await student.save();
    });

    dropStudentIds.forEach(async (id) => {
      const student = await Student.findById(id);
      if (!student)
        throw createError('Student not found D:', 404);

      student.regCourseIds.pull(course._id);
      await student.save();
    });

    course.regStudentIds = regStudentIds;
    await course.save();

    res.status(200).json({
      message: 'Update registrations :D'
    });
  } catch (error) {
    errorHandler(req, error, next);
  }
};