const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

const adminRoutes = require('./routes/admin');
const lecturerRoutes = require('./routes/lecturer');
const readerRoutes = require('./routes/reader');
const mongooseUri = require('./util/database');

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
app.use('/lecturer', lecturerRoutes);
app.use('/reader', readerRoutes);

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

