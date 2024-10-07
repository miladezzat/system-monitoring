/* eslint-disable @typescript-eslint/no-explicit-any */
// src/app.ts
import express from "express";
import { trackTime, systemMonitor } from "../src";

const app = express();

// Example database storage function
function storeOnDb(logData: {
  method: string;
  url: string;
  responseTime: string;
  timestamp: string;
}) {
  // Simulate storing in a database
  console.log("Storing log in database:", logData);
}

// Use the middleware and configure the options
app.use(
  trackTime({
    filePath: "./logs/request_logs", // Option to log to a file
    storeOnDb: storeOnDb, // Option to store in database
  }),
);

app.use(systemMonitor({ fileSystemInfo: true }));

// Sample route
app.get("/", (req: any, res) => {
  res.json({ message: "Hello, world!", systemMetrics: req.systemMetrics });
});

// Start the server
app.listen(3000, () => {
  console.log("Server is running on port 3000");
});
