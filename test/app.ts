// src/app.ts
import express from "express";
import { trackTime } from "../src";

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

// Sample route
app.get("/", (req, res) => {
  res.send("Hello, World!");
});

// Start the server
app.listen(3000, () => {
  console.log("Server is running on port 3000");
});
