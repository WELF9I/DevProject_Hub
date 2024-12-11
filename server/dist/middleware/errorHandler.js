"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleErrors = exports.CustomError = void 0;
/**
 * @description this is a custom error class that extends the native Error class
 */
class CustomError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode !== null && statusCode !== void 0 ? statusCode : 500; // set default to 500 if no status code is provided
    }
}
exports.CustomError = CustomError;
/**
 * @description this is a Middleware to handle errors in the app.
 */
const handleErrors = (errorInstance, request, response, next) => {
    let statusCode = errorInstance.statusCode;
    // Fallback to 500 if statusCode is not defined
    if (!statusCode) {
        statusCode = 500;
    }
    // developer mode can be set as a global flag for debugging purposes
    const developerMode = process.env.NODE_ENV === 'development';
    // print error details for debugging in development mode
    console.log({
        time: new Date().toISOString(),
        route: request.path,
        method: request.method,
        errorMessage: errorInstance.message,
        stackTrace: developerMode ? errorInstance.stack : 'Stack hidden in production mode'
    });
    // send error response to the client
    response.status(statusCode).json(Object.assign({ status: 'error', code: statusCode, message: errorInstance.message || 'An unexpected error occurred' }, (developerMode && { stackTrace: errorInstance.stack })));
};
exports.handleErrors = handleErrors;
