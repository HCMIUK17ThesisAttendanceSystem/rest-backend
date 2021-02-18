const NewStudentRFID = require('../../models/newStudentRfid');

const {
  checkStatusCode,
  createError
} = require('../../util/error-handler');

exports.getNewStudentRfid = (req, res, next) => {
  try {
    const newRfid = NewStudentRFID.findOne();
    if (!newRfid)
     throw createError('New RFID not scanned D:', 404);
    res.status(200).json({ rfidTag: newRfid.rfidTag });
  } catch (error) {
    checkStatusCode(error, next);
  }
};