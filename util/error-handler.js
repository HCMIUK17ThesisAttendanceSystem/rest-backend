exports.checkStatusCode = (err, next) => {
  if (!err.statusCode)
    err.statusCode = 500;
  next(err);
};

exports.createError = (message, statusCode, data = null) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.data = data;
  return error;
};