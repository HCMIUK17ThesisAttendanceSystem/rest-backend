const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const subjectSchema = new Schema({
  name: {
    type: String,
    required: true
  },
  id: {
    type: String,
    required: true,
    unique: true
  },
  credit_theory: {
    type: Number,
    get: v => Math.round(v),
    set: v => Math.round(v),
    required: true
  },
  credit_lab: {
    type: Number,
    get: v => Math.round(v),
    set: v => Math.round(v),
    required: true // if none => value = 0
  },
  courseIds: [{
    type: Schema.Types.ObjectId,
    ref: 'Course'
  }]
});

module.exports = mongoose.model('Subject', subjectSchema);
