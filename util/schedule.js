const moment = require('moment');
const io = require('./socket');

const Course = require('../models/course');

const { getCurrentPeriod } = require('./periods');
const {
  getAttendanceAggregationGroupByLecturer,
  getAttendanceAggregationGroupByStudent
} = require('./attendance-function');
const { sendEmailWithTemplate } = require('./mailer');

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

  const dayFirst = moment(firstday).format('MMM Do');
  const dayLast = moment(lastday).format('MMM Do');

  // get attendance group by lecturer's courses for this week and last week
  const lecturerEmailList = await getAttendanceAggregationGroupByLecturer();
  /*
    lecturerEmailList = [
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
            periods: [int],
            weekday,
            classType,
            studentNumber,
            attendances: [
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
  const studentEmailList = await getAttendanceAggregationGroupByStudent();
  lecturerEmailList.forEach((l, index) => {
    console.log(`Sending weekly report to ${l.lecturerEmail}`);
    setTimeout(() => {
      sendEmailWithTemplate('/lecturer-weekly-report.ejs', { ...l, dayFirst, dayLast }, l.lecturerEmail, 'Presence Weekly Attendance Report');
    }, index * 15000);
  });

  studentEmailList.forEach((s, index) => {
    console.log(`Sending weekly report to ${s.studentEmail}`);
    setTimeout(() => {
      sendEmailWithTemplate('/student-weekly-report.ejs', { ...s }, s.studentEmail, 'Presence Weekly Attendance Report');
    }, index * 15000);
  });
};