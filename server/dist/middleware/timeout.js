"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.timeout = void 0;
const timeout = (seconds) => {
    return (req, res, next) => {
        const timeoutId = setTimeout(() => {
            if (!res.headersSent) {
                res.status(408).json({
                    status: 'error',
                    message: 'Request timeout'
                });
            }
        }, seconds * 1000);
        res.on('finish', () => {
            clearTimeout(timeoutId);
        });
        res.on('error', () => {
            clearTimeout(timeoutId);
        });
        req.on('close', () => {
            clearTimeout(timeoutId);
        });
        next();
    };
};
exports.timeout = timeout;
