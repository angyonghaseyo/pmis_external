const errorMiddleware = (err, req, res, next) => {
    console.error(err.stack);
  
    // Default error status and message
    let status = 500;
    let message = 'Internal Server Error';
  
    // Check if it's a known error type
    if (err.name === 'ValidationError') {
      status = 400;
      message = err.message;
    } else if (err.name === 'UnauthorizedError') {
      status = 401;
      message = 'Unauthorized';
    } else if (err.name === 'ForbiddenError') {
      status = 403;
      message = 'Forbidden';
    } else if (err.name === 'NotFoundError') {
      status = 404;
      message = 'Resource not found';
    }
  
    // If it's a development environment, send the full error stack
    const error = process.env.NODE_ENV === 'development' 
      ? { message, stack: err.stack }
      : { message };
  
    res.status(status).json({ error });
  };
  
  module.exports = errorMiddleware;