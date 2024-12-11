"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = exports.AppError = void 0;
class AppError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
    }
}
exports.AppError = AppError;
const errorHandler = (err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    console.error({
        timestamp: new Date().toISOString(),
        path: req.path,
        method: req.method,
        error: err.message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
    res.status(err.statusCode).json(Object.assign({ status: 'error', statusCode: err.statusCode, message: err.message }, (process.env.NODE_ENV === 'development' && { stack: err.stack })));
};
exports.errorHandler = errorHandler;
