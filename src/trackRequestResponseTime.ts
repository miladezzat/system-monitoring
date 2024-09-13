import { Request, Response, NextFunction } from "express";

/**
 * Middleware to track request and response time.
 * @param {Request} req - Express Request object.
 * @param {Response} res - Express Response object.
 * @param {NextFunction} next - Express Next middleware function.
 */
export const trackRequestResponseTime = (
  req: Request & { responseTime?: number },
  res: Response,
  next: NextFunction,
) => {
  const start = process.hrtime(); // Start time

  res.on("finish", () => {
    const end = process.hrtime(start); // End time
    const responseTimeInMs = end[0] * 1000 + end[1] / 1e6; // Convert to milliseconds

    // Attach the response time to the request object if needed
    req.responseTime = responseTimeInMs;
  });

  next(); // Proceed to the next middleware
};
