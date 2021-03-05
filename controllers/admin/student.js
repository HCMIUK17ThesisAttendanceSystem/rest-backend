const { validationResult } = require('express-validator');

const Student = require('../../models/student');
const NewStudentRFID = require('../../models/newStudentRfid');
const RFID = require('../../models/rfid');

const {
  checkStatusCode,
  createError
} = require('../../util/error-handler');

exports.createStudent = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      throw createError('Validation failed D:', 422, errors.array());

    const {
      name, id, rfidTag
    } = req.body;

    const sameIdStudent = await Student.findOne({ id: id });
    if (sameIdStudent)
      throw createError('Replicated Student ID D:', 500);
    const sameRfidStudent = await Student.findOne({ rfidTag: rfidTag });
    if (sameRfidStudent)
      throw createError('Replicated RFID Tag D:', 500);

    const student = new Student({
      name, id, rfidTag
    });
    await student.save();
    // await NewStudentRFID.findOneAndRemove();
    const rfid = await RFID.findOne({ rfidTag });
    rfid.isLinked = true;
    await rfid.save();

    res.status(201).json({
      message: 'Created student :D',
      student
    })
  } catch (error) {
    checkStatusCode(error, next);
  }
};

exports.getStudents = async (req, res, next) => {
  try {
    const students = await Student.find();
    if (!students)
      throw createError('Students not found D:', 404);
    const newRFID = await NewStudentRFID.findOne();
    const RFIDs = await RFID.find({ isLinked: { $ne: true } });
    res.status(200).json({ students, newRFID, RFIDs });
  } catch (error) {
    checkStatusCode(error, next);
  }
};

exports.deleteStudent = async (req, res, next) => {
  const { studentId } = req.params;

  try {
    const student = await Student.findById(studentId);
    if (!student)
      throw createError('Subject not found D:', 404);

    const rfid = await RFID.findOne({ rfidTag: student.rfidTag });
    rfid.isLinked = false;
    await rfid.save();

    await Student.findByIdAndRemove(studentId);

    res.status(200).json({
      message: 'Student deleted :D',
      studentName: student.name
    });
  } catch (error) {
    checkStatusCode(error, next);
  }
}
