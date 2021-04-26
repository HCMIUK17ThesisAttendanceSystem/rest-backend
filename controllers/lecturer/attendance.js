const excel = require('exceljs');

const { getAttendanceReport } = require('./util/attendance-function');
// const { createAttendanceReport } = require('./util/excel-function');

const { errorHandler } = require('../../util/error-handler');

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
    worksheet.columns = columns;

    // Formatting headers
    const studentNameColWidth = studentAttendances.reduce((a, b) => a.name.length > b.name.length ? a : b)
      .name.length + 5;
    worksheet.columns.forEach(column => {
      column.width = column.key === 'studentName'
        ? studentNameColWidth
        : (column.header.length < 12 ? 12 : column.header.length + 10)
    });
    // Make the header bold.
    worksheet.getRow(1).font = { bold: true };

    // Dump all the data into Excel
    studentAttendances.forEach((data, idx) => {
      const results = data.attendances.map(a => a ? 'x' : '');
      const index = idx + 1;
      const row = {
        index,
        studentId: data.id,
        studentName: data.name,
        ...results
      };
      worksheet.addRow(row);
    });

    // Send response
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=' + 'report.xlsx');
    return workbook.xlsx.write(res)
      .then(() => res.status(200).end());
  } catch (error) {
    errorHandler(req, error, next);
  }
};