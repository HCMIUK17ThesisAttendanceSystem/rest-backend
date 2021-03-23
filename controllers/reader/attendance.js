const Student = require('../../models/student');
const Course = require('../../models/course');
const Attendance = require('../../models/attendance');
const Room = require('../../models/room');

const {
  createError,
  errorHandler
} = require('../../util/error-handler');
const io = require('../../util/socket');

exports.checkAttendance = async (req, res, next) => {
  const { courseId, rfidTag } = req.query;

  try {
    const course = await Course.findById(courseId);
    if (!course)
      throw createError('Course not found', 404);
    io.getIO().emit('attendance', {
      action: 'processing',
      courseId: course._id,
    });

    const student = await Student.findOne({ rfidTag });
    if (student) {
      const studentInCourse = course.regStudentIds.includes(student._id);
      if (studentInCourse) {
        const todayAtZero = new Date().setHours(0, 0, 0, 0);
        const existingAttendance = await Attendance.findOne({
          studentId: student._id,
          courseId: course._id,
          createdAt: { $gt: todayAtZero }
        });
        if (existingAttendance) {
          existingAttendance.checkTimes.push(new Date());
          await existingAttendance.save();
          io.getIO().emit('attendance', {
            action: 'update',
            courseId: course._id,
            studentName: student.name
          });
        } else {
          const attendance = new Attendance({
            courseId: course._id,
            studentId: student._id,
            checkTimes: [new Date()]
          });
          await attendance.save();
          io.getIO().emit('attendance', {
            action: 'create',
            courseId: course._id,
            studentName: student.name
          });
        }
      } else {
        // to different model
        io.getIO().emit('attendance', {
          action: 'no-action',
          courseId: course._id,
          studentName: student.name
        });
        console.log("Student does not registered for this course :D");
      }

      res.status(201).json({
        message: studentInCourse ?
          'Check attendance successfully :D' :
          'Student does not registered for this course :D',
        student: student.name
      });
    } else {
      res.status(200).json({ message: "No student data :D" });
    }
  } catch (error) {
    errorHandler(req, error, next);
  }
};

exports.checkAttendanceByRoom = async (req, res, next) => {
  const { rfidTag, roomCode } = req.query;

  try {

  } catch (error) {
    errorHandler(req, error, next);
  }
};