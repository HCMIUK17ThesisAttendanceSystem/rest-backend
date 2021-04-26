const excel = require('exceljs');

const { getAttendanceReport } = require('./util/attendance-function');
const { createAttendanceReport } = require('./util/excel-function');

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
      { header: '#', key: '#' },
      { header: 'Student ID', key: 'id' },
      { header: 'Student Name', key: 'name' }
    ];
    dates.forEach(date => columns.push({
      header: date._id,
      key: date._id
    }));
    worksheet.columns = columns;

    // Formatting headers
    // force the columns to be at least as long as their header row.
    // Have to take this approach because ExcelJS doesn't have an autofit property.
    // worksheet.columns.forEach(column => {
    //   column.width = column.header.length < 12 ? 12 : column.header.length
    // });
    // Make the header bold.
    // Note: in Excel the rows are 1 based, meaning the first row is 1 instead of 0.
    worksheet.getRow(1).font = { bold: true };

    // Dump all the data into Excel
    studentAttendances.forEach((e, index) => {
      // row 1 is the header.
      //const rowIndex = index + 2;
      // By using destructuring we can easily dump all of the data into the row without doing much
      // We can add formulas pretty easily by providing the formula property.
      worksheet.addRow({
        index,
        ...e
      });
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