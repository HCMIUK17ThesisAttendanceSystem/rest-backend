const moment = require('moment');
const io = require('./socket');

const Course = require('../models/course');
const Student = require('../models/student');
const Lecturer = require('../models/lecturer');
const Attendance = require('../models/attendance');
const { getCurrentPeriod } = require('./periods');
const { getAttendanceAggregationGroupByLecturer } = require('./attendance-function');

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
  const attendanceAgg = await getAttendanceAggregationGroupByLecturer();
  /*
    attendanceAgg = [
      {
        lecturerId,
        lecturerName,
        lecturerEmail,
        courses: [
          {
            courseId,
            subjectId,
            subjectName,
            roomCode,
            periods: array,
            weekday,
            classType,
            attendance: [
              { date, studentCount },
              ...
            ]
          },
          ...
        ]
      },
      ...
    ]
  */
  
};