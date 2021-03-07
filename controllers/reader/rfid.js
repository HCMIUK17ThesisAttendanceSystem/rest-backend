const RFID = require('../../models/rfid');
const NewStudentRfid = require('../../models/newStudentRfid');
const { checkStatusCode } = require('../../util/error-handler');
const io = require('../../util/socket');

// for checking connection
exports.hello = (req, res, next) => {
  console.log('Reader is sending us something :D');
  res.status(200).json({ message: 'Hello reader form :D' });
};

// for inputing sticky RFID tags
exports.createRFID = async (req, res, next) => {
  const { rfidTag } = req.query;

  try {
    const existingRfidTag = await RFID.findOne({ rfidTag });
    if (existingRfidTag) {
      res.status(500).json({ 
        message: 'Existing tag D:', 
        id: existingRfidTag.id 
      });
    } else {
      const rfidCount = await RFID.find().countDocuments();
      const rfid = new RFID({
        id: rfidCount,
        rfidTag
      });
      await rfid.save();
      res.status(201).json({ num: rfid.id });
    }
  } catch (error) {
    checkStatusCode(error, next);
  }
};

// for getting 1 tag at a time to create a new student
exports.createStudentRFID = async (req, res, next) => {
  const { rfidTag } = req.query;

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
    io.getIO().emit('new-rfid', {
      action: 'update',
      rfidTag: updateRfidTag.rfidTag
    })
    console.log('New rfid' + updateRfidTag.rfidTag);
    res.status(200).json({ updateRfidTag });
  } catch (error) {
    checkStatusCode(error, next);
  }
};


