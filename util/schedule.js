const io = require('./socket');

const Course = require('../models/course');

exports.emitScheduledCourses = async (period) => {
  const currWeekday = new Date().getDay().toString();
  const coursesAtPeriod = await Course.find({
    periods: period,
    weekday: currWeekday
  })
    .populate('roomId', 'readerIp');

  let result = [];
  coursesAtPeriod.forEach(course => {
    let obj = {
      courseId: course._id,
      readerIp: course.roomId.readerIp
    };
    result.push(obj);
  });
  console.log(result);
  io.getIO().emit('scheduled-courses', {
    action: 'update',
    data: result
  });
};