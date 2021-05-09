const Course = require('../models/course');
const Student = require('../models/student');
const Lecturer = require('../models/lecturer');
const Attendance = require('../models/attendance');

const { createError } = require('./error-handler');
const convertToWeekday = require('./weekday-converter');
const course = require('../models/course');
const { check } = require('express-validator');

exports.getAttendanceAggregationGroupByStudent = async () => {
  const courses = await Course.find()
    .select('subjectId weekday periods roomId classType')
    .populate('subjectId', '-_id id name')
    .populate('roomId', '-_id code');
  const students = await Student.find()
    .select('id name');

  const resultPromises = courses.map(async course => {
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
    return {
      courseId: course._id,
      checkDates: attendanceDateAgg.map(date => date._id)
    };
  });
  const datesGroupByCourse = await Promise.all(resultPromises);
  /*
    datesGroupByCourse = [
      { courseId, checkDates: ['YYYY/MM/DD']}
    ]
   */

  const attendanceGrpByStudentCourseAgg = await Attendance.aggregate([
    {
      $group: {
        _id: {
          studentId: '$studentId',
          courseId: '$courseId'
        },
        attendances: {
          $push: {
            date: { $dateToString: { format: "%Y/%m/%d", date: "$createdAt" } },
            hour: { $dateToString: { format: "%H:%M", date: "$createdAt", timezone: 'Asia/Ho_Chi_Minh' } }
          }
        }
      }
    }
  ]);
  /*
    attendanceGrpByStudentCourseAgg = [
      {
        _id: { courseId, studentId },
        attendances: [{date, hour}]
      }
    ]
   */

  const flatAggregation = attendanceGrpByStudentCourseAgg.map(a => {
    const fullDates = datesGroupByCourse.find(c => c.courseId.toString() === a._id.courseId.toString());
    const fullAttendances = fullDates.checkDates.map(date => {
      const checkDate = a.attendances.find(attendance => attendance.date === date);
      return checkDate
        ? {
          date: checkDate.date.split('/').reverse().slice(0, -1).join('/'),
          hour: checkDate.hour
        }
        : {
          date: date.split('/').reverse().slice(0, -1).join('/'),
          hour: null
        };
    });

    return {
      courseId: a._id.courseId,
      studentId: a._id.studentId,
      attendances: fullAttendances
    };
  });
  /*
    flatAggregation = [
      {
        courseId,
        studentId,
        attendances: [ { date, hour: null if not check } ]
      }
    ]
   */

  const reducedAggregationOnStudentId = flatAggregation.reduce((results, agg) => {
    (results[agg.studentId] = results[agg.studentId] || []).push({
      courseId: agg.courseId,
      attendances: agg.attendances
    });
    return results;
  }, {});
  /*
    reducedAggregationOnStudentId = {
      'studentId': [
        { courseId, attendances }
      ]
    }
   */

  let studentList = [];
  for (const [key, values] of Object.entries(reducedAggregationOnStudentId)) {
    // key: studentId; value: [ { courseId, attendances } ]
    const student = students.find(s => s._id.toString() === key);
    const attendCourses = values.map(v => {
      const course = courses.find(c => c._id.toString() === v.courseId.toString());
      return {
        ...v,
        subjectId: course.subjectId.id,
        subjectName: course.subjectId.name,
        roomCode: course.roomId.code,
        periods: course.periods,
        weekday: convertToWeekday(course.weekday),
        classType: course.classType === '1' ? 'Laboratory' : 'Theory',
        courseCode: `${course.classType === '1' ? 'Lab' : 'Theory'}-${course.subjectId.name}`,
      };
    });

    studentList.push({
      studentName: student.name.split(' ').slice(-2).join(' '),
      studentId: student.id,
      studentEmail: student.id + '@student.hcmiu.edu.vn',
      courses: attendCourses
    });
  }
  /*
    studentList = [
      {
        studentName, Id, Email,
        courses: [{ courseData, attendances }]
      }
    ]
   */
  return studentList;
}

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
        date: a._id.date.split('/').reverse().slice(0, -1).join('/')
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
      lecturerName: lecturer.name.split(' ').slice(-2).join(' '),
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