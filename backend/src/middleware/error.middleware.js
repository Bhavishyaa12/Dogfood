const notFound = (req, res) => {
  res.status(404).json({
    success: false,
    message: "Resource not found",
  });
};

// Express identifies error-handling middleware by arity — keep all 4 params
// even though `next` is unused, or Express will treat this as a normal
// middleware and never call it on errors.
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  console.error(err);
  res.status(500).json({
    success: false,
    message: "Internal server error",
  });
};

const requestLogger = (req, res, next) => {
  console.log("REQUEST RECEIVED:", req.method, req.url);
  next();
};

module.exports = { notFound, errorHandler, requestLogger };
