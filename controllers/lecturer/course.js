const Course = require('../../models/course');
const Subject = require('../../models/subject');
const Student = require('../../models/student');
const Attendance = require('../../models/attendance');

const { getCurrentPeriod } = require('../../util/periods');
const { getAttendanceReport } = require('./util/attendance-function');
const {
  errorHandler,
  createError
} = require('../../util/error-handler');

exports.getCourses = async (req, res, next) => {
  try {
    const courses = await Course.find({ lecturerId: req.userId })
      .populate('roomId', 'code');
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

exports.downloadAttendanceReport = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const report = await getAttendanceReport(courseId);
    console.log(report);
    res.status(200).json({ ...report });
  } catch (error) {
    errorHandler(req, error, next);
  }
}

exports.getCurrentCourse = async (req, res, next) => {
  try {
    const currentPeriod = getCurrentPeriod();
    const currentWeekday = new Date().getDay().toString();
    if (currentPeriod) {
      const currentCourse = await Course.findOne({
        lecturerId: req.userId,
        // lecturerId: '6046d67ffa42780004beaaa7',
        periods: currentPeriod,
        weekday: currentWeekday
      })
        .populate('subjectId', 'name id')
        .populate('roomId', 'code')
        .populate('regStudentIds', 'id name');

      if (currentCourse) {
        const todayAtZero = new Date().setHours(0, 0, 0, 0);
        // get current attendance
        const currentAttendance = await Attendance.find({
          courseId: currentCourse._id,
          createdAt: { $gt: todayAtZero }
        });

        // get recent attendee
        const recentAttendance = await Attendance.findOne({
          courseId: currentCourse._id,
          createdAt: { $gt: todayAtZero }
        }, {}, {
          sort: {
            'createdAt': -1
          }
        })
          .populate('studentId', 'name');

        // get attendance heartbeat
        const attendanceDateAgg = await Attendance.aggregate([
          {
            $match: {
              courseId: currentCourse._id
            }
          },
          {
            $group: {
              _id: {
                $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
              },
              count: { $sum: 1 }
            }
          },
          {
            $sort: {
              '_id': 1
            }
          },
        ]);
        const attendanceGroupByDate = attendanceDateAgg.map(d => {
          const date = d._id.split('-').reverse().join('/');
          return {
            count: d.count,
            date: date
          };
        });

        res.status(200).json({
          message: 'Fetched current course :D',
          currentCourse: {
            _id: currentCourse._id,
            roomCode: currentCourse.roomId.code,
            subjectName: currentCourse.subjectId.name,
            weekday: currentCourse.weekday,
            startPeriod: currentCourse.periods[0],
            endPeriod: currentCourse.periods[currentCourse.periods.length - 1],
            regStudents: currentCourse.regStudentIds,
            currentAttendance: currentAttendance,
            recentAttendee: recentAttendance
              ? recentAttendance.studentId.name
              : '',
            attendanceGroupByDate: attendanceGroupByDate
          }
        });
      }
      else res.status(200).json({
        message: `No course for you now :D`
      });
    } else {
      res.status(200).json({
        message: 'No period currently :D'
      });
    }
  } catch (error) {
    errorHandler(req, error, next);
  }
};