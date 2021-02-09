// for sticky RFID tag
const RFID = require('../../models/rfid');
const { checkStatusCode } = require('../../util/error-handler');

exports.createRFID = async (req, res, next) => {
  const { rfidTag } = req.body;

  try {
    const existingRfidTag = await RFID.find({ rfidTag });
    if (existingRfidTag) {
      res.status(500).json({ message: 'Existing tag D:' })
    } else {
      const rfidCount = await RFID.find().countDocuments();
      const rfid = new RFID({
        id: rfidCount,
        rfidTag
      });
      await rfid.save();
      res.status(201).json({ rfid });
    }
  } catch (error) {
    checkStatusCode(error, next);
  }
};