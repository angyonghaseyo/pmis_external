const errorHandler = (err, req, res, next) => {
    console.error(err.stack);
  
    const status = err.statusCode || 500;
    const message = err.message || 'Something went wrong';
  
    res.status(status).json({
      error: {
        message: message,
        status: status
      }
    });
  };
  
  module.exports = errorHandler;