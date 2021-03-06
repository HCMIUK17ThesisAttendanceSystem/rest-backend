const excel = require('exceljs');

const { getAttendanceReport } = require('../../util/attendance-function');
// const { createAttendanceReport } = require('./util/excel-function');

const { errorHandler, createError } = require('../../util/error-handler');
const io = require('../../util/socket');

const Student = require('../../models/student');
const Course = require('../../models/course');
const Attendance = require('../../models/attendance');

exports.getAttendanceReport = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const report = await getAttendanceReport(courseId);
    res.status(200).json({ ...report });
  } catch (error) {
    errorHandler(req, error, next);
  }
};

exports.downloadAttendanceReport = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const report = await getAttendanceReport(courseId);
    const {
      course,
      dates,
      studentAttendances
    } = report;

    // Preparing workbook
    let workbook = new excel.Workbook();
    let worksheet = workbook.addWorksheet(course.subjectId + '-' + course.room);

    // Creating columns
    let columns = [
      { header: '#', key: 'index' },
      { header: 'Student ID', key: 'studentId' },
      { header: 'Student Name', key: 'studentName' }
    ];
    dates.forEach((date, index) => columns.push({
      header: date,
      key: index + ''
    }));
    columns.push({ header: 'Total Absence', key: 'totalAbsence' });
    worksheet.columns = columns;

    // Formatting headers
    const studentNameColWidth = studentAttendances.reduce((a, b) => a.name.length > b.name.length ? a : b)
      .name.length + 5;
    worksheet.columns.forEach(column => {
      column.width = column.key === 'studentName'
        ? studentNameColWidth
        : (column.header.length < 14 ? 14 : column.header.length + 10)
    });
    // Make the header bold.
    worksheet.getRow(1).font = { bold: true };

    // Dump all the data into Excel
    studentAttendances.forEach((data, idx) => {
      const totalAbsence = data.attendances.filter(a => a === false).length;
      const attendances = data.attendances.map(a => a ? a : '');
      const index = idx + 1;
      const row = {
        index,
        studentId: data.id,
        studentName: data.name,
        ...attendances,
        totalAbsence
      };
      worksheet.addRow(row);
    });

    // align id column to right
    worksheet.getColumn(2).alignment = { horizontal: 'right' };
    // align date columns to right
    let colIndex = 4;
    for (colIndex; colIndex <= worksheet.rowCount; colIndex++) {
      worksheet.getColumn(colIndex).alignment = { horizontal: 'right' };
    }

    // Send response
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=' + 'report.xlsx');
    return workbook.xlsx.write(res)
      .then(() => res.status(200).end());
  } catch (error) {
    errorHandler(req, error, next);
  }
};

exports.postAttendance = async (req, res, next) => {
  const { studentId, courseId, note } = req.body;
  try {
    // check student exist
    const student = await Student.findById(studentId);
    if (!student)
      throw createError('Student not found D:', 404);

    // check course exist and lecturer teach
    const course = await Course.findById(courseId);
    if (!course)
      throw createError('Course not found D:', 404);
    if (req.userId !== course.lecturerId.toString())
      throw createError('Lecturer is not authenticated to add attendance for this course!', 401);

    // check if student registered the course
    const isStudentInCourse = course.regStudentIds.includes(student._id);
    if (!isStudentInCourse)
      throw createError('Student did not register for this course!', 400);

    // check if already check attendance
    const todayAtZero = new Date().setHours(0, 0, 0, 0);
    const existingAttendance = await Attendance.findOne({
      studentId: student._id,
      courseId: course._id,
      createdAt: { $gt: todayAtZero }
    });
    if (existingAttendance)
      throw createError('Student has already checked attendance!', 400);

    const attendance = new Attendance({
      studentId: student._id,
      courseId: course._id,
      note
    });
    await attendance.save();

    res.status(201).json({
      message: 'Check attendance successfully',
      studentName: student.name,
      attendance
    });
  } catch (error) {
    errorHandler(req, error, next);
  }
};