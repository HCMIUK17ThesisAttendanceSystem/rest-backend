const RFID = require('../../models/rfid');
const NewStudentRfid = require('../../models/newStudentRfid');
const { checkStatusCode } = require('../../util/error-handler');

// for inputing sticky RFID tags
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

// for getting 1 tag at a time to create a new student
exports.createStudentRFID = async (req, res, next) => {
  const { rfidTag } = req.body;

  // find one then update it
  // if none then create one
  try {
    let updateRfidTag;
    const existingRfidTag = await NewStudentRfid.findOne();
    if (existingRfidTag) {
      existingRfidTag.rfidTag = rfidTag;
      await existingRfidTag.save();
      updateRfidTag = existingRfidTag;
    } else {
      const newRfid = new NewStudentRfid({ rfidTag });
      await newRfid.save();
      updateRfidTag = newRfid;
    }
    res.status(200).json({ updateRfidTag });
  } catch (error) {
    checkStatusCode(error, next);
  }
};


