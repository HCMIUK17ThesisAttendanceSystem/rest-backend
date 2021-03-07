const path = require('path');
const fs = require('fs');

const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const schedule = require('node-schedule');
const helmet = require('helmet'); // protection from common attack
const compression = require('compression'); // compress sent data to reduce workload
const morgan = require('morgan'); // logging
// const csrf = require('csurf');

const adminRoutes = require('./routes/admin');
const lecturerRoutes = require('./routes/lecturer');
const readerRoutes = require('./routes/reader');
const mongooseUri = require('./util/database');
const periodCrons = require('./util/period-cron');

const app = express();

// const csrfProtection = csrf();

const accessLogStream = fs.createWriteStream(
  path.join(__dirname, 'access.log'),
  { flags: 'a' }
);

app.use(helmet());
app.use(compression());
app.use(morgan('combined', { stream: accessLogStream }));

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

// app.use(csrfProtection);
// app.use((req, res, next) => {
//   res.locals.csrfToken = req.csrfToken();
//   next();
// });

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
    const server = app.listen(process.env.PORT || 8080);
    const io = require('./util/socket').init(server);
    io.on('connection', socket => {
      console.log(`Client ${socket.client.id} connected to socket.io`);
      // io.emit('current-courses', {
      //   action: 'update',
      //   data: ["These are courses :D", "This is another course :D"]
      // });
    });
    io.on('get-current-courses', socket => {
      console.log('Reader app requires courses :D');
      // check password
      // emit courses
      io.emit('current-courses', {
        action: 'update',
        data: "These are courses :D"
      });
    });
  })
  .catch(err => console.log(err));

// TODO
/*
  Add schedule to send [{ readerIP, courseID }] to desktop app via socket.io
  Desktop app sends { studentRfid, courseId, timestamp } for attendance
  Add csrf, ssl protection
 */

