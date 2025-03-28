const globalErrorHandler = (err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || "error";
    let errorMessage = err.message;

    if (err.name === "MongoServerError" && err.code === 11000) {
        // Extract the duplicate key field dynamically
        const duplicateField = Object.keys(err.keyValue)[0];
        errorMessage = `The ${duplicateField} '${err.keyValue[duplicateField]}' already exists.`;
        // errorMessage = `The email ${err.keyValue.email} already exists`;
    }

    res.status(err.statusCode).json({
        status: err.status,
        message: errorMessage,
    });
};

export default globalErrorHandler;