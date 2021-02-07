// for sticky RFID tag
const RFID = require('../../models/rfid');
const { checkStatusCode } = require('../../util/error-handler');

exports.createRFID = (req, res, next) => {
  const { rfidTag } = req.body;

  try {
    const rfidCount = await RFID.find().countDocuments();
    const rfid = new RFID({
      id: rfidCount,
      rfidTag
    });
    await rfid.save();
    res.status(201).json({ rfid });
  } catch (error) {
    checkStatusCode(error, next);
  }
};