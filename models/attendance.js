const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const attendanceSchema = new Schema({
  studentId: {
    type: Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  courseId: {
    type: Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  checkTimes: [{
    type: Date,
    default: Date.now()
  }]
}, { timestamps: true });

module.exports = mongoose.model('Attendance', attendanceSchema);
