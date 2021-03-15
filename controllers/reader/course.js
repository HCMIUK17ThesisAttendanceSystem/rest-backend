const { getCurrentPeriod } = require('../../util/periods');
const { checkStatusCode } = require('../../util/error-handler');

const Course = require('../../models/course');
const Room = require('../../models/room');

exports.getCurrentCourse = async (req, res, next) => {
  try {
    const { roomCode } = req.params;
    const currentPeriod = getCurrentPeriod();
    if (currentPeriod) {
      const room = await Room.findOne({ code: roomCode });
      const currentCourse = await Course.findOne({
        roomId: room._id,
        periods: currentPeriod
      }).populate('subjectId', 'name id');

      if (currentCourse)
        res.status(200).json({
          _id: currentCourse._id,
          SubjectName: currentCourse.subjectId.name,
          SubjectId: currentCourse.subjectId.id
        });
      else res.status(404).json({
        message: `No course for ${roomCode} now :D`
      });
    } else {
      res.status(404).json({
        message: 'No course currently :D'
      })
    }
  } catch (error) {
    checkStatusCode(error, next);
  }
};