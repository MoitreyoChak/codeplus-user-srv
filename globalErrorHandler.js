const globalErrorHandler = (err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || "error";
    let errorMessage = err.message;

    if (err.name === "MongoServerError" && err.code === 11000) {
        errorMessage = `The email ${err.keyValue.email} already exists`;
    }

    res.status(err.statusCode).json({
        status: err.status,
        message: errorMessage,
    });
};

export default globalErrorHandler;