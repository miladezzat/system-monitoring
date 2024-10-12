import { createErrorTrackingMiddleware } from "../src/errorTrackingMiddleware";
import { Response, NextFunction } from "express";
import { TrackingCustomErrorRequest } from "../src/types";

// Mock response object with statusCode and send method
const mockResponse = (): Partial<Response> => {
  const res: Partial<Response> = {};
  res.statusCode = 200; // Default to 200 OK
  res.send = jest.fn().mockReturnValue(res); // Mock send method
  return res;
};

// Mock request object
const mockRequest = (): Partial<TrackingCustomErrorRequest> => {
  return {
    originalUrl: "/test-route", // Mock the route
  };
};

// Mock NextFunction
const mockNext: NextFunction = jest.fn();

describe("errorTrackingMiddleware", () => {
  let errorTrackingMiddleware: ReturnType<typeof createErrorTrackingMiddleware>;

  beforeEach(() => {
    // Create a new instance of the middleware before each test
    errorTrackingMiddleware = createErrorTrackingMiddleware();
  });

  afterEach(() => {
    // Clear all mocks after each test
    jest.clearAllMocks();
  });

  it("should increment totalRequests on each call", () => {
    const req = mockRequest() as TrackingCustomErrorRequest;
    const res = mockResponse() as Response;

    errorTrackingMiddleware(req, res, mockNext);
    
    // Call res.send to trigger the middleware logic
    res.send("OK");

    expect(req.errorResponse?.totalRequests).toBe(1); // Expect 1 request counted
  });

  it("should not increment errorCount for non-error responses", () => {
    const req = mockRequest() as TrackingCustomErrorRequest;
    const res = mockResponse() as Response;
    res.statusCode = 200; // Set status to 200 OK

    errorTrackingMiddleware(req, res, mockNext);
    res.send("OK"); // Simulate sending the response

    expect(req.errorResponse?.errorCount).toBe(0); // No errors counted
    expect(req.errorResponse?.errorRate).toBe("0.00%"); // Error rate should be 0%
  });

  it("should increment errorCount for error responses", () => {
    const req = mockRequest() as TrackingCustomErrorRequest;
    const res = mockResponse() as Response;
    res.statusCode = 500; // Set status to 500 Internal Server Error

    errorTrackingMiddleware(req, res, mockNext);
    res.send("Error"); // Simulate sending the response

    expect(req.errorResponse?.errorCount).toBe(1); // Expect 1 error counted
    expect(req.errorResponse?.errorRate).toBe("100.00%"); // Error rate should be 100%
  });

  it("should track errors by route", () => {
    const req = mockRequest() as TrackingCustomErrorRequest;
    const res = mockResponse() as Response;
    res.statusCode = 404; // Set status to 404 Not Found

    errorTrackingMiddleware(req, res, mockNext);
    res.send("Not Found"); // Simulate sending the response

    expect(req.errorResponse?.errorRoutes["/test-route"]).toBe(1); // Expect 1 error on the route
  });

  it("should call the next middleware function", () => {
    const req = mockRequest() as TrackingCustomErrorRequest;
    const res = mockResponse() as Response;

    errorTrackingMiddleware(req, res, mockNext);

    expect(mockNext).toHaveBeenCalled(); // Ensure next() was called
  });

  it("should attach error statistics to the request object", () => {
    const req = mockRequest() as TrackingCustomErrorRequest;
    const res = mockResponse() as Response;
    res.statusCode = 400; // Set status to 400 Bad Request

    errorTrackingMiddleware(req, res, mockNext);
    res.send("Bad Request"); // Simulate sending the response

    expect(req.errorResponse).toBeDefined();
    expect(req.errorResponse?.totalRequests).toBe(1);
    expect(req.errorResponse?.errorCount).toBe(1);
    expect(req.errorResponse?.errorRoutes["/test-route"]).toBe(1);
  });
});
