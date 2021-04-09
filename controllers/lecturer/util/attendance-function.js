const Course = require('../../../models/course');
const Student = require('../../../models/student');
const Attendance = require('../../../models/attendance');

const { createError } = require('../../../util/error-handler');


exports.getAttendanceReport = async (courseId) => {
  const course = await Course
    .findById(courseId, 'periods classType weekday roomId lecturerId subjectId')
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
  const dates = attendanceDateAgg.map(d => d._id.split('-').reverse().join('-'));

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
    dates.forEach(date => {
      if (a.attendDates.includes(date))
        attendances.push(true);
      else
        attendances.push(false);
    });
    return {
      id: a._id.id,
      name: a._id.name,
      attendances: attendances
    };
  });

  const result = {
    course: {
      courseId: course._id,
      subjectId: course.subjectId.id,
      subjectName: course.subjectId.name,
      lecturer: course.lecturerId.name,
      room: course.roomId.code,
      classType: course.classType,
      weekday: course.weekday,
      periods: course.periods
    },
    dates: dates,
    studentAttendances: studentAttendances
  };
  console.log(result);
  return result;
};