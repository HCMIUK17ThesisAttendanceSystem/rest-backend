const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const courseSchema = new Schema({
  classType: {
    type: String,
    required: true
  },
  room: {
    type: String,
    required: true
  },
  weekday: {
    type: String,
    required: true
  },
  periods: [{
    type: Number,
    required: true
  }],
  lecturerId: {
    type: Schema.Types.ObjectId,
    ref: 'Lecturer',
    required: true
  },
  subjectId: {
    type: Schema.Types.ObjectId,
    ref: 'Subject',
    required: true
  },
  regStudentIds: [{
    type: Schema.Types.ObjectId,
    ref: 'Student'
  }]
});

module.exports = mongoose.model('Course', courseSchema);
