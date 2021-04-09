const { getAttendanceReport } = require('./util/attendance-function');
const { errorHandler } = require('../../util/error-handler');

exports.getAttendanceReport = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const report = await getAttendanceReport(courseId);
    res.status(200).json({ ...report });
  } catch (error) {
    errorHandler(req, error, next);
  }
}
