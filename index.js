const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const schedule = require('node-schedule');

const adminRoutes = require('./routes/admin');
const lecturerRoutes = require('./routes/lecturer');
const readerRoutes = require('./routes/reader');
const mongooseUri = require('./util/database');
const periodCrons = require('./util/period-cron');

const app = express();

// app.use(bodyParser.urlencoded()) // x-www-form-urlencoded <form>
app.use(bodyParser.json()) // application/json

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader(
    'Access-Control-Allow-Methods',
    'OPTIONS, GET, POST, PUT, PATCH, DELETE'
  );
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization'
  );
  next();
});

app.use('/admin', adminRoutes);
app.use('/reader', readerRoutes);
app.use('/lecturer', lecturerRoutes);

const emitCourseSchedule = periodCrons.forEach(pC => schedule.scheduleJob(
  pC.cron,
  () => require('./util/schedule').emitScheduledCourses(pC.period)
));

app.use((error) => {
  console.log(error);
  const status = error.statusCode || 500;
  const message = error.message;
  const data = error.data;
  res.status(status).json({ message, data });
});


mongoose.connect(
  mongooseUri,
  {
    useUnifiedTopology: true,
    useNewUrlParser: true,
    useFindAndModify: false,
    useCreateIndex: true
  }
)
  .then(result => {
    const server = app.listen(8080);
    const io = require('./util/socket').init(server);
    io.on('connection', socket => {
      console.log('client connected to socket.io');
    });
  })
  .catch(err => console.log(err));

// TODO
/*
  Create model of Room with reader IP and room code
  Create static [{ periodNum, periodTime(10p early) }]
  Create function to make [{ readerIP, courseID }] in a period
  npm i node-schedule
  Add schedule to send [{ readerIP, courseID }] to desktop app via socket.io
  Desktop app sends { studentRfid, courseId, timestamp } for attendance
 */

