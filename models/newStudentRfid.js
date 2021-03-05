const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const rfidSchema = new Schema({
  rfidTag: {
    type: String,
    required: true,
    unique: true
  }
});

module.exports = mongoose.model('NewStudentRFID', rfidSchema);
