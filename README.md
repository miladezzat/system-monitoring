# System Monitor Package
![npm](https://img.shields.io/npm/v/system-monitoring) ![npm](https://img.shields.io/npm/l/system-monitoring)
![npm](https://img.shields.io/npm/dw/system-monitoring)![GitHub stars](https://img.shields.io/github/stars/miladezzat/system-monitoring)


A lightweight and efficient Node.js library for real-time system monitoring. Track CPU, memory, disk usage, network I/O, and more with ease.

A Node.js package for monitoring system metrics like CPU usage, memory usage, disk usage, network interfaces, uptime, process information, and temperature. This package provides middleware for Express to gather and expose these system metrics in your web applications.

## Table of Contents

- [System Monitor Package](#system-monitor-package)
  - [Table of Contents](#table-of-contents)
  - [Installation](#installation)
  - [Usage](#usage)
    - [Basic Usage](#basic-usage)
  - [Available Metrics](#available-metrics)
  - [Express Middlewares](#express-middlewares)
  - [Middlewares](#middlewares)
    - [Error Tracking Middleware](#error-tracking-middleware)
      - [Overview](#overview)
      - [`CustomRequest` Interface](#customrequest-interface)
      - [`createErrorTrackingMiddleware` Function](#createerrortrackingmiddleware-function)
    - [trackTime](#tracktime)
      - [Notes](#notes)
    - [trackRequestResponseTime](#trackrequestresponsetime)
  - [APIs](#apis)
  - [Middlewares](#middlewares-1)
    - [Some Response Examples](#some-response-examples)
  - [Options](#options)
  - [Contributing](#contributing)

## Installation
You can install this package using npm:

```bash
npm install system-monitoring
## Or yarn add system-monitoring
```

## Usage

### Basic Usage
To use the system-monitoring functions in your project:

```ts
import { getCpuInfo, getMemoryUsage, getDiskUsage } from 'system-monitoring';

// Get CPU information
getCpuInfo().then(cpuInfo => {
  console.log('CPU Information:', cpuInfo);
});

// Get memory usage
getMemoryUsage().then(memoryUsage => {
  console.log('Memory Usage:', memoryUsage);
});

// Get disk usage
const diskUsage = getDiskUsage();
console.log('Disk Usage:', diskUsage);
```

## Available Metrics

You can retrieve the following system metrics using the provided functions:

1. **CPU Information**: Get detailed CPU usage information for each core, including user/system/idle times and percentages.
2. **Memory Usage**: Get total, free, and used memory statistics.
3. **Disk Usage**: Get total, used, and available disk space.
4. **Network Interfaces**: Get details about the system’s network interfaces.
5. **Uptime**: Get the system’s uptime in seconds.
6. **Process Info**: Get the CPU and memory usage of the current Node.js process.
7. **System Temperature**: Get the current temperature of the system (if supported).
8. **Logs**: Fetch system logs from a specific file with optional keyword filtering.

## Express Middlewares
This package provides an Express middleware to gather and expose system metrics.

```ts
import express from 'express';
import { systemMonitor, trackRequestResponseTime, createErrorTrackingMiddleware } from 'system-monitoring';

const errorTrackingMiddleware: ReturnType<typeof createErrorTrackingMiddleware> = createErrorTrackingMiddleware();

const app = express();

// Middleware to track response time
app.use(trackRequestResponseTime()); // the time will append on the response header X-Response-Time

// track error rate
app.use(errorTrackingMiddleware) // access information by  req.errorResponse

// System monitor middleware
app.use(systemMonitor({ cpu: true, memory: true, disk: true })); // access information by req.systemMetrics

app.get('/', (req, res) => {
  res.send('System monitoring active.');
});

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});
```




## Middlewares

### Error Tracking Middleware
This middleware tracks error statistics for your Express application by intercepting responses and recording error occurrences. It provides detailed insights into the total number of requests, error count, error rate, and the specific routes that are causing errors.
#### Overview
- `CustomRequest` Interface: Extends the default Express `Request` object to include an optional errorResponse property for error statistics.
- `createErrorTrackingMiddleware` Function: Creates an error tracking middleware with isolated state for tracking errors in your Express application.


| Option            | Type                                  | Default | Description                                                |
|-------------------|---------------------------------------|---------|------------------------------------------------------------|
| `totalRequests`   | `number`                              | `0`     | The total number of requests processed.                   |
| `errorCount`      | `number`                              | `0`     | The total number of error responses (status code 400 and above). |
| `errorRate`       | `string`                              | `0.00%` | The percentage of error responses relative to total requests. |
| `errorRoutes`     | `{ [key: string]: number }`           | `{}`    | An object mapping routes to the number of errors encountered at each route. |


#### `CustomRequest` Interface
The CustomRequest interface extends the standard Express Request object to include an errorResponse property. This property is used to store error tracking information:
```ts
export interface CustomRequest extends Request {
  errorResponse?: {
    totalRequests: number;
    errorCount: number;
    errorRate: string;
    errorRoutes: { [key: string]: number };
  };
}
```

#### `createErrorTrackingMiddleware` Function
This factory function creates an Express middleware function that tracks error statistics. It maintains an in-memory state to count total requests, errors, and error rates. The middleware also tracks errors by route.
- **Usage**
1. Import the Middleware: Import the `createErrorTrackingMiddleware` function into your Express application.
```ts
import { createErrorTrackingMiddleware } from 'system-monitoring';
```
2. Add Middleware to Your Application: Use the middleware in your Express application.
```ts
const app = express();
app.use(createErrorTrackingMiddleware());
```
3. Access Error Statistics: You can access error statistics via the `errorResponse` property on the `req` object within your route handlers or other middleware.
```ts
app.get('/some-route', (req: CustomRequest, res: Response) => {
  // Access error statistics
  const errorStats = req.errorResponse;
  console.log('Error Statistics:', errorStats);
  
  res.send('Response body');
});
```
- Note: Future adding, will add appility to adding on file or db like trackTime 

### trackTime
`trackTime` is a middleware function for Express.js that tracks the response time for each request and provides the ability to log the data either to a file or to a database via a callback function.
1. Import the middleware into your Express app.
2. You can configure trackTime to log the response times to a file, send them to a database, or both.

**Example Code**
```ts
import express from 'express';
import { trackTime } from './middlewares/trackTime';

const app = express();

// Example database storage function (optional)
function storeOnDb(logData: { method: string; url: string; responseTime: string; timestamp: string }) {
  // Simulate storing in a database (replace this with your actual DB logic)
  console.log('Storing log in the database:', logData);
}

// Use the middleware to track request/response time
app.use(trackTime({
  filePath: './logs/request_logs.txt', // Optional: Logs to a file
  storeOnDb: storeOnDb                 // Optional: Callback to store logs in a database
}));

// Example route
app.get('/', (req, res) => {
  res.send('Hello, World!');
});

// Start the server
app.listen(3000, () => {
  console.log('Server is running on port 3000');
});
```

**Track Time Middleware Options**
You can configure the behavior of the `trackTime` middleware by passing an options object with the following properties:

| Option        | Type                                   | Description                                                                                                                 |
|---------------|----------------------------------------|-----------------------------------------------------------------------------------------------------------------------------|
| `filePath`    | `string` (optional)                    | The path where logs will be written. If provided, the middleware will log each request to this file in JSON format.          |
| `storeOnDb`   | `(logData: LogData) => void` (optional) | A callback function that receives the log data for storing in a database. This function will be called every time a request finishes. |

**Log Data Structure**
The log data passed to the file or the storeOnDb function will have the following structure:
```ts
interface LogData {
  method: string;       // HTTP method (e.g., GET, POST)
  url: string;          // The URL requested
  responseTime: string; // Time taken to process the request in milliseconds
  timestamp: string;    // ISO timestamp when the request was made
}
```
**Logging Options**
1. **Logging to a File:** If you provide the filePath option, the logs will be written to the specified file in JSON format. Each log entry will be appended to the file on a new line.
Example log entry:
```json
{"method":"GET","url":"/","responseTime":"12.345","timestamp":"2024-09-15T10:30:00.123Z"}
```
2. **Storing in a Database:** If you pass a storeOnDb callback function, it will be called with the log data. You can implement your own logic to store this data in a database (e.g., MongoDB, MySQL).

Example of Custom Database Storage Function
```ts
// Example function to store log data in a MongoDB database
import { MongoClient } from 'mongodb';

async function storeLogInDb(logData: LogData) {
  const client = await MongoClient.connect('mongodb://localhost:27017');
  const db = client.db('logsDatabase');
  await db.collection('requestLogs').insertOne(logData);
  await client.close();
}

// Pass this function to the `trackTime` middleware
app.use(trackTime({ storeOnDb: storeLogInDb }));
```
#### Notes
- **File Path:** Ensure that the file path exists or is writable by your application. If the path does not exist, the middleware will automatically create the directory.
- **Performance Considerations:** If you log data to a file or database on every request, ensure your storage mechanism can handle the load without affecting performance.

### trackRequestResponseTime
// will write docs here


## APIs

**System Monitoring Functions**
- **getCpuInfo()**: Returns CPU usage details for all cores and the system as a whole.
- **getMemoryUsage()**: Retrieves total, free, and used memory information.
- **getDiskUsage()**: Fetches disk usage statistics including total, used, and available space.
- **getNetworkInfo()**: Returns details about all network interfaces.
- **getSystemUptime()**: Returns the system uptime in seconds.
- **getProcessInfo()**: Provides the CPU and memory usage of the current process.
- **getOSInfo**: Retrieves detailed information about the operating system.
- **getLoadAverage**: Retrieves the system load averages over 1, 5, and 15 minutes.
- **getUserInfo**: Retrieves extended user information and system details.
- **getTemperature()**: Returns the system temperature (if supported).
- **getFileSystemInfo**: Retrieves information about the file system, including disk space usage.
- **getActiveConnections**: Retrieves the active network connections on the system.
- **getScheduledTasks**: Retrieves a list of scheduled tasks from the system and parses them into an object.
- **getServiceStatus**: Retrieves the status of a given service.
- **getLogs(path, keyword)**: Fetches logs from the specified file, optionally filtering by a keyword.


## Middlewares
- **systemMonitor**: System monitor middleware for gathering system metrics.
- **trackTime**: Middleware to track request/response time. Logs can either be stored in a file or sent to a database via a callback.
- **createErrorTrackingMiddleware**: Factory function to create error tracking middleware with isolated state
- **trackRequestResponseTime**: Middleware to track request and response time. and adding the response time to response header in ms

### Some Response Examples

1. CPU Information
```json
{
  "totalUserTime": 123456,
  "totalSystemTime": 654321,
  "totalIdleTime": 789012,
  "totalTime": 1567890,
  "usedTime": 777777,
  "idleTime": 789012,
  "usagePercentage": 49.5,
  "coreDetails": [
    {
      "coreId": 0,
      "userTime": 12345,
      "systemTime": 6543,
      "idleTime": 7890,
      "totalTime": 15678,
      "usagePercentage": 51.4
    }
    // more cores...
  ]
}
```

2. Memory Usage

```json
{
    "totalMemory": 16777216,
    "freeMemory": 8388608,
    "usedMemory": 8388608
}
```
3. Disk Usage
```json
{
  "total": 104857600,
  "used": 52428800,
  "available": 52428800
}
```

## Options
The `systemMonitor` middleware accepts an object with the following options:

| Option           | Type                                  | Default | Description                                                |
|------------------|---------------------------------------|---------|------------------------------------------------------------|
| `cpu`            | `boolean`                             | `true`  | Enable CPU usage monitoring.                              |
| `memory`         | `boolean`                             | `true`  | Enable memory usage monitoring.                           |
| `disk`           | `boolean`                             | `true`  | Enable disk usage monitoring.                             |
| `network`        | `boolean`                             | `true`  | Enable network interface information monitoring.          |
| `uptime`         | `boolean`                             | `true`  | Enable system uptime monitoring.                          |
| `processInfo`    | `boolean`                             | `true`  | Enable process CPU and memory usage monitoring.            |
| `temperature`    | `boolean`                             | `false` | Enable system temperature monitoring (only on Linux/Windows).|
| `osInfo`         | `boolean`                             | `false` | Enable operating system information monitoring.            |
| `loadAverage`    | `boolean`                             | `false` | Enable load average monitoring.                           |
| `userInfo`       | `boolean`                             | `false` | Enable user information monitoring.                       |
| `fileSystemInfo` | `boolean`                             | `false` | Enable file system information monitoring.                |
| `activeConnections` | `boolean`                          | `false` | Enable active network connections monitoring.             |
| `scheduledTasks` | `boolean`                             | `false` | Enable scheduled tasks monitoring.                        |
| `logs`           | `{ path: string, keyword?: string }`  | `null`  | Fetch logs from a specified file, optionally filtered by keyword. |
| `responseTime`   | `boolean`                             | `false` | Track response time for each request.                      |


## Contributing
Contributions are welcome! If you have any bug reports, suggestions, or feature requests, please open an issue on GitHub.

**To contribute:**
1. Fork the repository
2. Create a new feature branch (`git checkout -b feature/new-feature`)
3. Commit your changes (`git commit -m 'Add new feature'`)
4. Push to the branch (`git push origin feature/new-feature`)
5. Create a new Pull Request


Make sure to follow the [Contributor Covenant Code of Conduct](./CONTRIBUTER.md) when participating in the project.

