const Course = require('../models/course');
const Student = require('../models/student');
const Lecturer = require('../models/lecturer');
const Attendance = require('../models/attendance');

const { createError } = require('./error-handler');
const convertToWeekday = require('./weekday-converter');

exports.getAttendanceAggregationGroupByLecturer = async () => {
  // get lecturers' ids
  const lecturers = await Lecturer.find().select('_id name courseIds');

  const attendanceGrpByDateCourseAgg = await Attendance.aggregate([
    {
      $group: {
        _id: {
          date: { $dateToString: { format: "%Y/%m/%d", date: "$createdAt" } },
          courseId: '$courseId'
        },
        studentCount: {
          $sum: 1
          // or $push: '$studentId'
        }
      }
    },
    {
      $sort: {
        _id: 1
      }
    },
  ]);
  const attendanceGrpByDateCourseLecturer = attendanceGrpByDateCourseAgg.map(a => {
    const lecturerId = lecturers.find(l => l.courseIds.includes(a._id.courseId))._id;
    return {
      ...a,
      lecturerId
    };
  });
  const attendanceAggregation = attendanceGrpByDateCourseLecturer.map(a => {
    return {
      ...a,
      _id: {
        ...a._id,
        date: a._id.date.split('/').reverse().join('/')
      }
    };
  });

  const reducedAggregationOnLecturerId = attendanceAggregation.reduce((results, agg) => {
    (results[agg.lecturerId] = results[agg.lecturerId] || []).push({
      date: agg._id.date,
      courseId: agg._id.courseId,
      studentCount: agg.studentCount
    });
    return results;
  }, {});

  for (const [key, value] of Object.entries(reducedAggregationOnLecturerId)) {
    reducedAggregationOnLecturerId[key] = value.reduce((results, agg) => {
      (results[agg.courseId] = results[agg.courseId] || []).push({
        date: agg.date,
        studentCount: agg.studentCount
      });
      return results;
    }, {});
  }

  for (const [k, v] of Object.entries(reducedAggregationOnLecturerId)) {
    const resultPromises = Object.entries(reducedAggregationOnLecturerId[k]).map(async value => {
      // value[0]: courseId, value[1]: {date,studentCount}
      const course = await Course.findById(value[0])
        .select('subjectId weekday periods roomId classType regStudentIds')
        .populate('subjectId', '-_id id name')
        .populate('roomId', '-_id code');
      return {
        courseId: course._id,
        subjectId: course.subjectId.id,
        subjectName: course.subjectId.name,
        roomCode: course.roomId.code,
        periods: course.periods,
        studentNumber: course.regStudentIds.length,
        weekday: convertToWeekday(course.weekday),
        classType: course.classType === '1' ? 'Laboratory' : 'Theory',
        attendances: value[1]
      };
    });
    const results = await Promise.all(resultPromises);
    reducedAggregationOnLecturerId[k] = results;
  }

  const resPromises = Object.entries(reducedAggregationOnLecturerId).map(async value => {
    // value[0]: lecturerId, value[1]: [array of courses]
    const lecturer = await Lecturer.findById(value[0]).select('name email');
    return {
      lecturerId: lecturer._id,
      lecturerName: lecturer.name,
      lecturerEmail: lecturer.email,
      courses: value[1]
    };
  });

  const res = await Promise.all(resPromises);

  return res;
}

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
          $dateToString: { date: "$createdAt", format: "%Y/%m/%d" }
        }
      }
    },
    {
      $sort: {
        _id: 1
      }
    },
  ]);
  const dates = attendanceDateAgg.map(d => d._id.split('/').reverse().join('/'));

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
            $dateToString: { date: "$createdAt", format: "%d/%m/%Y" },
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
  return result;
};