const Course = require('../../models/course');
const Subject = require('../../models/subject');
const Student = require('../../models/student');
const Attendance = require('../../models/attendance');

const {
  errorHandler,
  createError
} = require('../../util/error-handler');

exports.getOverallReport = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const course = await Course.findById(courseId)
      .populate('subjectId', 'name id')
      .populate('roomId', 'code');

    if (!course) {
      throw createError('Course not found D:', 404);
    }

    const overallAttendance = await Attendance.aggregate([
      {
        $match: {
          courseId: course._id
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%d-%m-%Y", date: "$createdAt" }
          },
          attendeeCount: { $sum: 1 }
        }
      },
      {
        $sort: {
          '_id': 1
        }
      },
    ]);

    res.status(200).json({
      message: 'Fetched overall record :D',
      course: {
        periods: course.periods,
        weekday: course.weekday,
        roomCode: course.roomId.code,
        subjectName: course.subjectId.name,
        headCount: course.regStudentIds.length
      },
      overallAttendance
    });
  } catch (error) {
    errorHandler(req, error, next);
  }
}
