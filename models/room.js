const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const roomSchema = new Schema({
  code: {
    type: String,
    required: true,
    unique: true
  },
  readerIp: {
    type: String,
    required: true,
    unique: true
  }
});

module.exports = mongoose.model('Room', roomSchema);
