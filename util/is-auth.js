const jwt = require('jsonwebtoken');
const { createError } = require('./error-handler');

module.exports = (req, res, next) => {
  const authHeader = req.get('Authorization');
  if (!authHeader)
    throw createError('Not authenticated D=', 401); 

  const token = authHeader.split(' ')[1]; // 'Bearer token'
  let decodedToken;
  try {
    decodedToken = jwt.verify(token, 'asecretprivatekey');
  } catch (error) {
    error.statusCode = 500;
    throw error;
  }
  if (!decodedToken)
    throw createError('Not authenticated D:', 401);

  req.userId = decodedToken.userId;
  next();
};
