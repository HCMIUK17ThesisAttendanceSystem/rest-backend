const moment = require('moment');
const io = require('./socket');

const Course = require('../models/course');
const Student = require('../models/student');
const Lecturer = require('../models/lecturer');
const Attendance = require('../models/attendance');
const { getCurrentPeriod } = require('./periods');

exports.emitScheduledCourses = async (period) => {
  const currWeekday = new Date().getDay().toString();
  const coursesAtPeriod = await Course.find({
    periods: period,
    weekday: currWeekday
  })
    .populate('roomId', 'readerIp code')
    .populate('subjectId', 'name id');

  let result = [];
  coursesAtPeriod.forEach(course => {
    let obj = {
      _id: course._id,
      SubjectName: course.subjectId.name,
      SubjectId: course.subjectId.id,
      RoomCode: course.roomId.code,
      Periods: course.periods,
      CurrentPeriod: getCurrentPeriod(),
      Weekday: currWeekday
    };
    result.push(obj);
  });
  io.getIO().emit('scheduled-courses', {
    action: 'update',
    data: result
  });
};

exports.sendWeeklyReport = async () => {
  const curr = new Date; // get current date
  const first = curr.getDate() - curr.getDay(); // First day is the day of the month - the day of the week
  const last = first + 6; // last day is the first day + 6

  const firstday = new Date(curr.setDate(first));
  const lastday = new Date(curr.setDate(last));

  const day1st = moment(firstday).format('MMM Do');
  const daylast = moment(lastday).format('MMM Do');

  // get attendance group by lecturer's courses for this week and last week
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
    }, {})
    console.log(reducedAggregationOnLecturerId[key]);
  }
  console.log(reducedAggregationOnLecturerId);
};