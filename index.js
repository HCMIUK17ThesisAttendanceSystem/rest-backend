if (process.env.NODE_ENV !== 'production')
  require('dotenv').config();
const path = require('path');
const fs = require('fs');

const express = require('express');
const bodyParser = require('body-parser');  // parser for request & response with json body
const mongoose = require('mongoose');       // MongoDB connector
const schedule = require('node-schedule');  // scheduling sending course data to reader
const helmet = require('helmet');           // protection from common attack
const compression = require('compression'); // compress sent data to reduce workload
const morgan = require('morgan');           // logging
const cors = require('cors');
// const csrf = require('csurf');

const adminRoutes = require('./routes/admin');
const lecturerRoutes = require('./routes/lecturer');
const readerRoutes = require('./routes/reader');
const mongooseUri = require('./util/database');
const { periods } = require('./util/periods');
const Attendance = require('./models/attendance');

const app = express();

const accessLogStream = fs.createWriteStream(
  path.join(__dirname, 'access.log'),
  { flags: 'a' }
);

app.use(helmet());
app.use(compression());
app.use(morgan('combined', { stream: accessLogStream }));
app.use(cors());

// app.use(bodyParser.urlencoded()) // x-www-form-urlencoded <form>
app.use(bodyParser.json()) // application/json
app.use('/static', express.static(path.join(__dirname, 'public')));

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

app.use((req, res) => {
  const { error } = req;
  if (error) {
    const status = error.statusCode || 500;
    const message = error.message;
    const data = error.data;
    res.status(status).json({ message, data });
  }
});

const emitCourseSchedule = periods.forEach(period => schedule.scheduleJob(
  period.cron,
  () => require('./util/schedule').emitScheduledCourses(period.number)
));

schedule.scheduleJob(
  '0 0 8 ? * SUN *',
  () => require('./util/schedule').sendWeeklyReport()
);
// require('./util/schedule').sendWeeklyReport();

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
      io.on('disconnect', reason => {
        console.log(reason);
      });
    });
  })
  // .then(async () => {
  //   const attendance = await Attendance.find({ note: { $exists: true } })
  //   console.log(attendance)
  //   attendance.forEach(a => {
  //     if (!Array.isArray(a.note)) {
  //       const newNote = [a.note];
  //       a.note = newNote;
  //       a.save();
  //     }
  //   })
  //   console.log(attendance)
  // })
  .catch(err => console.log(err));

// const csrfProtection = csrf();

// app.use(csrfProtection);
// app.use((req, res, next) => {
//   res.locals.csrfToken = req.csrfToken();
//   next();
// });
