import { Request, Response, NextFunction } from "express";

/**
 * Middleware to track request and response time.
 * This middleware records the time taken to process a request and appends the response
 * time to the response headers.
 *
 * @param {Request} req - Express Request object.
 * @param {Response} res - Express Response object.
 * @param {NextFunction} next - Express Next middleware function.
 *
 * @deprecated Use {@link trackTime} instead.
 * The {@link trackTime} middleware provides enhanced functionality for tracking
 * request and response times, including options for logging.
 */
export const trackRequestResponseTime = () => {
  return (
    req: Request & { responseTime?: number },
    res: Response,
    next: NextFunction,
  ) => {
    const start = process.hrtime(); // Start time measurement

    res.on("finish", () => {
      const end = process.hrtime(start); // End time measurement
      const responseTimeInMs = end[0] * 1000 + end[1] / 1e6; // Convert time to milliseconds

      // Set the response time in the response headers
      res.setHeader("X-Response-Time", `${responseTimeInMs.toFixed(3)}ms`);
    });

    next(); // Proceed to the next middleware
  };
};

export default trackRequestResponseTime;
