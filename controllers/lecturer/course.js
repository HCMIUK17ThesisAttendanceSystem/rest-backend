const Course = require('../../models/course');
const Subject = require('../../models/subject');
const Student = require('../../models/student');
const Attendance = require('../../models/attendance');

const { getCurrentPeriod } = require('../../util/periods');

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

exports.downloadOverallReport = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const course = await Course.findById(courseId, 'periods classType weekday roomId lecturerId subjectId')
      .populate('subjectId', '-_id name id')
      .populate('roomId', '-_id code')
      .populate('lecturerId', '-_id name');
    if (!course)
      throw createError('Course not found D:', 404);

    const attendanceDateAgg = await Attendance.aggregate([
      {
        $match: {
          courseId: course._id
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { date: "$createdAt", format: "%Y-%m-%d" }
          }
        }
      },
      {
        $sort: {
          _id: 1
        }
      },
    ]);
    const attendanceDates = attendanceDateAgg.map(d => d._id.split('-').reverse().join('-'));

    const attendancesGroupByStudentId = await Attendance.aggregate([
      {
        $match: {
          courseId: course._id
        }
      },
      {
        $group: {
          _id: "$studentId",
          attendDates: {
            $addToSet: {
              $dateToString: { date: "$createdAt", format: "%d-%m-%Y" },
            }
          }
        }
      }
    ]);
    const populatedAttendances = await Student.populate(attendancesGroupByStudentId, {
      path: '_id',
      select: 'name id'
    });
    const studentAttendances = populatedAttendances.map(a => {
      let attendances = [];
      attendanceDates.forEach(date => {
        if (a.attendDates.includes(date))
          attendances.push(1);
        else
          attendances.push(0);
      });
      return {
        id: a._id.id,
        name: a._id.name,
        attendances: attendances
      };
    });
    console.log(course, attendanceDates, studentAttendances);
    res.status(200).json({
      course,
      attendanceDates,
      studentAttendances
    });
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
        periods: currentPeriod,
        weekday: currentWeekday
      })
        .populate('subjectId', 'name id')
        .populate('roomId', 'code');

      if (currentCourse) {
        const todayAtZero = new Date().setHours(0, 0, 0, 0);
        const attendanceCount = await Attendance.find({
          courseId: currentCourse._id,
          createdAt: { $gt: todayAtZero }
        }).countDocuments();
        const recentAttendance = await Attendance.findOne({
          courseId: currentCourse._id,
          createdAt: { $gt: todayAtZero }
        }, {}, {
          sort: {
            'createdAt': -1
          }
        })
          .populate('studentId', 'name');

        const attendanceGroupByDate = await Attendance.aggregate([
          {
            $match: {
              courseId: currentCourse._id
            }
          },
          {
            $group: {
              _id: {
                $dateToString: { format: "%d-%m-%Y", date: "$createdAt" }
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
        res.status(200).json({
          message: 'Fetched current course :D',
          currentCourse: {
            _id: currentCourse._id,
            roomCode: currentCourse.roomId.code,
            subjectName: currentCourse.subjectId.name,
            weekday: currentCourse.weekday,
            startPeriod: currentCourse.periods[0],
            endPeriod: currentCourse.periods[currentCourse.periods.length - 1],
            attendanceCount: attendanceCount,
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
        message: 'No course currently :D'
      });
    }
  } catch (error) {
    errorHandler(req, error, next);
  }
};