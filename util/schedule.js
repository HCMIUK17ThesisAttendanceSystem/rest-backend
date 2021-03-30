const io = require('./socket');

const Course = require('../models/course');
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