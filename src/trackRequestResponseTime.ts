import { Request, Response, NextFunction } from "express";

/**
 * Middleware to track request and response time.
 * @param {Request} req - Express Request object.
 * @param {Response} res - Express Response object.
 * @param {NextFunction} next - Express Next middleware function.
 *
 * @deprecated Use trackTime instead.
 */
export const trackRequestResponseTime = () => {
  return (
    req: Request & { responseTime?: number },
    res: Response,
    next: NextFunction,
  ) => {
    const start = process.hrtime(); // Start time

    res.on("finish", () => {
      const end = process.hrtime(start); // End time
      const responseTimeInMs = end[0] * 1000 + end[1] / 1e6; // Convert to milliseconds

      // append to to req object
      //   req.responseTime = responseTimeInMs;

      // Set the response time in headers
      res.setHeader("X-Response-Time", `${responseTimeInMs.toFixed(3)}ms`);
    });

    next(); // Proceed to the next middleware
  };
};
