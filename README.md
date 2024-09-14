# System Monitor Package

[![npm version](https://badge.fury.io/js/system-monitoring.svg)](https://www.npmjs.com/package/system-monitoring)
<!-- [![License](https://img.shields.io/npm/l/system-monitoring)](LICENSE) -->
[![Downloads](https://img.shields.io/npm/dt/system-monitoring)](https://www.npmjs.com/package/system-monitoring)

A lightweight and efficient Node.js library for real-time system monitoring. Track CPU, memory, disk usage, network I/O, and more with ease.

A Node.js package for monitoring system metrics like CPU usage, memory usage, disk usage, network interfaces, uptime, process information, and temperature. This package provides middleware for Express to gather and expose these system metrics in your web applications.

## Table of Contents

- [System Monitor Package](#system-monitor-package)
  - [Table of Contents](#table-of-contents)
  - [Installation](#installation)
  - [Usage](#usage)
    - [Basic Usage](#basic-usage)
- [Available Metrics](#available-metrics)
  - [Express Middleware](#express-middleware)
  - [API](#api)
  - [Example Response](#example-response)
    - [Options](#options)
  - [Options](#options-1)
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

# Available Metrics

You can retrieve the following system metrics using the provided functions:

1. **CPU Information**: Get detailed CPU usage information for each core, including user/system/idle times and percentages.
2. **Memory Usage**: Get total, free, and used memory statistics.
3. **Disk Usage**: Get total, used, and available disk space.
4. **Network Interfaces**: Get details about the system’s network interfaces.
5. **Uptime**: Get the system’s uptime in seconds.
6. **Process Info**: Get the CPU and memory usage of the current Node.js process.
7. **System Temperature**: Get the current temperature of the system (if supported).
8. **Logs**: Fetch system logs from a specific file with optional keyword filtering.

## Express Middleware
This package provides an Express middleware to gather and expose system metrics.

```ts
import express from 'express';
import { systemMonitor, trackRequestResponseTime } from 'your-package-name';

const app = express();

// Middleware to track response time
app.use(trackRequestResponseTime);

// System monitor middleware
app.use(systemMonitor({ cpu: true, memory: true, disk: true }));

app.get('/', (req, res) => {
  res.send('System monitoring active.');
});

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});
```

## API

**System Monitoring Functions**
- **getCpuInfo()**: Returns CPU usage details for all cores and the system as a whole.
- **getMemoryUsage()**: Retrieves total, free, and used memory information.
- **getDiskUsage()**: Fetches disk usage statistics including total, used, and available space.
- **getNetworkInfo()**: Returns details about all network interfaces.
- **getSystemUptime()**: Returns the system uptime in seconds.
- **getProcessInfo()**: Provides the CPU and memory usage of the current process.
- **getTemperature()**: Returns the system temperature (if supported).
- **getLogs(path, keyword)**: Fetches logs from the specified file, optionally filtering by a keyword.

## Example Response

- CPU Information
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

- Memory Usage

```json
{
    "totalMemory": 16777216,
    "freeMemory": 8388608,
    "usedMemory": 8388608
}
```
- Disk Usage
```json
{
  "total": 104857600,
  "used": 52428800,
  "available": 52428800
}
```

### Options
The systemMonitor middleware accepts an object with the following options:

## Options

The `systemMonitor` middleware accepts an object with the following options:

| Option        | Type                                  | Default | Description                                                |
|---------------|---------------------------------------|---------|------------------------------------------------------------|
| `cpu`         | `boolean`                             | `true`  | Enable CPU usage monitoring.                              |
| `memory`      | `boolean`                             | `true`  | Enable memory usage monitoring.                           |
| `disk`        | `boolean`                             | `true`  | Enable disk usage monitoring.                             |
| `network`     | `boolean`                             | `true`  | Enable network interface information monitoring.           |
| `uptime`      | `boolean`                             | `true`  | Enable system uptime monitoring.                          |
| `processInfo` | `boolean`                             | `true`  | Enable process CPU and memory usage monitoring.            |
| `temperature` | `boolean`                             | `false` | Enable system temperature monitoring (only on Linux/Windows).|
| `logs`        | `{ path: string, keyword?: string }`  | `null`  | Fetch logs from a specified file, optionally filtered by keyword. |
| `responseTime`| `boolean`                             | `false` | Track response time for each request.                      |



## Contributing
Contributions are welcome! If you have any bug reports, suggestions, or feature requests, please open an issue on GitHub.

**To contribute:**
1. Fork the repository
2. Create a new feature branch (`git checkout -b feature/new-feature`)
3. Commit your changes (`git commit -m 'Add new feature'`)
4. Push to the branch (`git push origin feature/new-feature`)
5. Create a new Pull Request


Make sure to follow the [Contributor Covenant Code of Conduct](./CONTRIBUTER.md) when participating in the project.

