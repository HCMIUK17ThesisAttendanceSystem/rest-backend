exports.errorHandler = (req, err, next) => {
  req.error = err;
  next();
};

exports.createError = (message, statusCode, data = null) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.data = data;
  return error;
};