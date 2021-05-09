exports.errorHandler = (req, err, next) => {
  req.error = err;
  next();
};

exports.createError = (message, statusCode, data = null) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.data = data;
  console.log('Error data: ' + data && data);
  return error;
};