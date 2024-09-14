import { Request, Response, NextFunction } from "express";

// Extend the Express Request interface to include custom properties
export interface CustomRequest extends Request {
  errorResponse?: {
    totalRequests?: number;
    errorCount?: number;
    errorRate?: string;
    errorRoutes?: { [key: string]: number };
  };
}

// In-memory storage for error tracking
let totalRequests: number = 0;
let errorCount: number = 0;
const errorRoutes: { [key: string]: number } = {};

/**
 * Middleware that tracks the total number of requests and errors.
 * It also appends the error statistics to the request object.
 *
 * @param {CustomRequest} req - The custom request object with extended properties.
 * @param {Response} res - The response object.
 * @param {NextFunction} next - The next middleware function.
 * @returns {void}
 */
export const errorTrackingMiddleware = (
  req: CustomRequest,
  res: Response,
  next: NextFunction,
): void => {
  totalRequests++;

  // Save the original res.send method
  const originalSend = res.send;

  /**
   * Overrides the res.send method to intercept the response.
   * If the status code indicates an error, it increments the error count
   * and tracks the route that caused the error. Appends error stats to the req object.
   *
   * @param {unknown} body - The response body, which can be any type.
   * @returns {Response} - The response object.
   */
  res.send = function (body: unknown): Response {
    if (res.statusCode >= 400) {
      // Increment error count if status code indicates an error
      errorCount++;

      // Capture the route and increment its error count
      const route = req.originalUrl;
      if (errorRoutes[route]) {
        errorRoutes[route]++;
      } else {
        errorRoutes[route] = 1;
      }
    }

    // Attach error stats to the request object
    req.errorResponse = {
      totalRequests,
      errorCount,
      errorRate: `${((errorCount / totalRequests) * 100).toFixed(2)}%`,
      errorRoutes: { ...errorRoutes },
    };

    // Call the original res.send with the body
    return originalSend.apply(this, [body]) as Response;
  };

  next();
};
