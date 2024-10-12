import { Response, NextFunction } from "express";
import { TrackingCustomErrorRequest } from "./types";

/**
 * Factory function to create error tracking middleware with isolated state.
 *
 * This middleware tracks the total number of requests and counts the number of errors
 * that occur during those requests. It also keeps track of the routes that caused errors.
 *
 * @returns {(req: TrackingCustomErrorRequest, res: Response, next: NextFunction) => void} - An Express middleware function.
 */
export const createErrorTrackingMiddleware = () => {
  // In-memory storage for error tracking
  let totalRequests: number = 0; // Total number of requests received
  let errorCount: number = 0; // Total number of errors encountered
  const errorRoutes: { [key: string]: number } = {}; // Tracks error counts per route

  return (
    req: TrackingCustomErrorRequest,
    res: Response,
    next: NextFunction,
  ): void => {
    totalRequests++; // Increment total request count

    // Save the original res.send method
    const originalSend = res.send;

    /**
     * Overrides the res.send method to intercept the response.
     * If the status code indicates an error (4xx or 5xx), it increments the error count
     * and tracks the route that caused the error. Appends error stats to the req object.
     *
     * @param {unknown} body - The response body, which can be of any type.
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
          errorRoutes[route] = 1; // Initialize count for the route
        }
      }

      // Attach error stats to the request object
      req.errorResponse = {
        totalRequests,
        errorCount,
        errorRate: `${((errorCount / totalRequests) * 100).toFixed(2)}%`, // Calculate error rate as a percentage
        errorRoutes: { ...errorRoutes }, // Clone the errorRoutes object
      };

      // Call the original res.send with the body
      return originalSend.apply(this, [body]) as Response;
    };

    next(); // Pass control to the next middleware
  };
};

export default createErrorTrackingMiddleware;
