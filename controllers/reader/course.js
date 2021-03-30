const { getCurrentPeriod } = require('../../util/periods');
const { errorHandler } = require('../../util/error-handler');

const Course = require('../../models/course');
const Room = require('../../models/room');

exports.getCurrentCourse = async (req, res, next) => {
  try {
    const { roomCode } = req.params;
    const currentPeriod = getCurrentPeriod();
    const currentWeekday = new Date().getDay().toString();
    if (currentPeriod) {
      const room = await Room.findOne({ code: roomCode });
      const currentCourse = await Course.findOne({
        roomId: room._id,
        periods: currentPeriod,
        weekday: currentWeekday
      }).populate('subjectId', 'name id');

      if (currentCourse)
        res.status(200).json({
          _id: currentCourse._id,
          SubjectName: currentCourse.subjectId.name,
          SubjectId: currentCourse.subjectId.id,
          RoomCode: roomCode,
          Periods: currentCourse.periods,
          CurrentPeriod: currentPeriod,
          Weekday: currentWeekday
        });
      else res.status(404).json({
        message: `No course for ${roomCode} now :D`
      });
    } else {
      res.status(404).json({
        message: 'No course currently :D'
      });
    }
  } catch (error) {
    errorHandler(req, error, next);
  }
};