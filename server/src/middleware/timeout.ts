import { Request, Response, NextFunction } from 'express';

/**
 * @description Middleware to end requests that exceed the specified time limit
 */
export const setRequestTimeout = (waitTime: number) => {
    return (req: Request, res: Response, next: NextFunction) => {
        
        // start a timer to trigger after waitTime seconds
        const timerId = setTimeout(() => {
            if (!res.headersSent) {
                res.status(408).json({
                    status: 'error',
                    message: 'Request took too long to complete'
                });
            }
        }, waitTime * 1000);

        // function to clear the timeout when the request ends
        const clearTimer = () => clearTimeout(timerId);

        // clear timer if the request finishes successfully
        res.once('finish', clearTimer);

        // clear timer if an error occurs during response
        res.once('error', clearTimer);

        // clear timer if the client disconnects
        req.once('close', clearTimer);

        // move to the next middleware in the chain
        next();
    };
};
