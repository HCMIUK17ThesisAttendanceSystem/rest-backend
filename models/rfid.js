const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const rfidSchema = new Schema({
  id: {
    type: Number,
    required: true,
    unique: true,
    default: 0
  },
  rfidTag: {
    type: String,
    required: true,
    unique: true
  },
  isLinked: {
    type: Boolean,
  }
});

module.exports = mongoose.model('rfid', rfidSchema);
