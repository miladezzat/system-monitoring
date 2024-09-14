import { Request, Response, NextFunction } from "express";

// Interface to extend the Express Request object
export interface CustomRequest extends Request {
  errorResponse?: {
    totalRequests: number;
    errorCount: number;
    errorRate: string;
    errorRoutes: { [key: string]: number };
  };
}

// Factory function to create error tracking middleware with isolated state
export const createErrorTrackingMiddleware = () => {
  // In-memory storage for error tracking
  let totalRequests: number = 0;
  let errorCount: number = 0;
  const errorRoutes: { [key: string]: number } = {};

  return (req: CustomRequest, res: Response, next: NextFunction): void => {
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
};
