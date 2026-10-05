# Validation for the 0.1.0 architecture PR

Local verification on 5 October 2026 used Node.js 24.16.0 on macOS arm64 (Apple M3 Pro, 11 logical cores, 18 GiB RAM).

- Lint and strict TypeScript build passed.
- 37 regression tests passed across eight suites, including real HTTP responses on Express 4/5, interval sampling, command cancellation/output limits, service exit codes, log limits, bounded route/sink state, lifecycle races, and collector failure isolation.
- A clean tarball consumer passed CommonJS, native ESM named exports, and strict TypeScript without Express types. The package has zero runtime dependencies; snapshot values are readonly at compile time and immutable at runtime.
- TypeDoc generated the API reference with warnings treated as errors.
- Native filesystem collection passed on the local OS. Linux and Windows verification belongs to the PR's Node.js 22/24 CI matrix; optional platform executables/hardware are not universally validated by parser fixtures.

## Local HTTP benchmark

Command: `BENCH_REQUESTS=30000 BENCH_ROUNDS=5 npm run benchmark`. Five alternating rounds ran 30000 measured requests per configuration with concurrency 20, after 500 warm-up requests. The monitored application used default periodic collection at 1000 ms and the cached system-metrics adapter. Values below describe the median-throughput round for each configuration, not production measurements or a guarantee for other middleware/configurations.

| Measurement          | Baseline           | Cached system metrics |
| -------------------- | ------------------ | --------------------- |
| Throughput           | 32264 requests/sec | 31615 requests/sec    |
| p50 latency          | 0.580 ms           | 0.625 ms              |
| p95 latency          | 0.750 ms           | 0.671 ms              |
| p99 latency          | 1.649 ms           | 0.764 ms              |
| Event-loop p99 delay | 11.043 ms          | 10.256 ms             |

Observed throughput overhead was 2.01%, below the plan's provisional 5% budget for this configuration. Latency differences include local benchmark noise; they do not imply that monitoring improves latency. Route and sink stress tests assert configured state bounds. A sustained production soak and optional hardware/provider diagnostics remain separate verification work.

The PR prepares version 0.1.0 and a tag-based release workflow. It does not publish npm or deploy the existing website.
