const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { execFileSync } = require("node:child_process");
const root = path.resolve(__dirname, "..");
const temp = fs.mkdtempSync(
  path.join(os.tmpdir(), "system-monitoring-package-"),
);
const npm = process.env.npm_execpath;
if (!npm) throw new Error("Run this check through npm run check:package");
const run = (args, cwd = root) =>
  execFileSync(process.execPath, args, {
    cwd,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
try {
  const packed = JSON.parse(
    run([
      npm,
      "pack",
      "--ignore-scripts",
      "--json",
      "--pack-destination",
      temp,
      "--cache",
      path.join(temp, "cache"),
    ]),
  );
  const manifest = packed[0];
  const files = new Set(manifest.files.map((file) => file.path));
  for (const name of [
    "dist/index.js",
    "dist/index.d.ts",
    "dist/express/index.js",
    "dist/express/index.d.ts",
    "MIGRATION.md",
    "LICENSE",
  ])
    assert(files.has(name), `Missing ${name}`);
  assert(
    !manifest.files.some((file) =>
      /^(src|test|node_modules|docs)\//.test(file.path),
    ),
  );
  const consumer = path.join(temp, "consumer");
  fs.mkdirSync(consumer);
  fs.writeFileSync(
    path.join(consumer, "package.json"),
    JSON.stringify({ name: "clean-consumer", private: true }),
  );
  run(
    [
      npm,
      "install",
      path.join(temp, manifest.filename),
      "--offline",
      "--ignore-scripts",
      "--no-audit",
      "--no-fund",
      "--cache",
      path.join(temp, "cache"),
    ],
    consumer,
  );
  const installed = JSON.parse(
    fs.readFileSync(
      path.join(consumer, "node_modules/system-monitoring/package.json"),
    ),
  );
  assert.equal(Object.keys(installed.dependencies || {}).length, 0);
  const body = `const monitor = api.createMonitor({ metrics: { cpu:false,processInfo:false,disk:false } }); const snapshot = await monitor.collect(); if(snapshot.metrics.memory.status !== 'ok') throw new Error('No memory metric'); await monitor.stop(); if(typeof adapter.systemMonitor !== 'function') throw new Error('No adapter');`;
  fs.writeFileSync(
    path.join(consumer, "common.cjs"),
    `const api = require('system-monitoring'); const adapter = require('system-monitoring/express'); (async()=>{${body}})().catch(e=>{console.error(e);process.exitCode=1;});`,
  );
  fs.writeFileSync(
    path.join(consumer, "module.mjs"),
    `import * as api from 'system-monitoring'; import { createMonitor } from 'system-monitoring'; import * as adapter from 'system-monitoring/express'; if(typeof createMonitor !== 'function') throw new Error('Missing named ESM export'); ${body}`,
  );
  run(["common.cjs"], consumer);
  run(["module.mjs"], consumer);
  const types = path.join(consumer, "node_modules/@types");
  fs.mkdirSync(types);
  fs.cpSync(
    path.join(root, "node_modules/@types/node"),
    path.join(types, "node"),
    { recursive: true },
  );
  fs.cpSync(
    path.join(root, "node_modules/undici-types"),
    path.join(consumer, "node_modules/undici-types"),
    { recursive: true },
  );
  fs.writeFileSync(
    path.join(consumer, "example.ts"),
    `import { createMonitor, getCpuInfo, type Snapshot } from 'system-monitoring'; import { systemMonitor } from 'system-monitoring/express'; const monitor = createMonitor(); void monitor.collect().then((s: Snapshot)=>s.metrics.cpu); void getCpuInfo(); void systemMonitor();
const snapshot = monitor.getSnapshot();
if(snapshot?.metrics.disk?.status === 'ok') {
  // @ts-expect-error Snapshots are deeply readonly.
  snapshot.metrics.disk.value[0].totalBytes = 0;
}`,
  );
  run(
    [
      path.join(root, "node_modules/typescript/bin/tsc"),
      "example.ts",
      "--noEmit",
      "--strict",
      "--module",
      "node16",
      "--target",
      "es2022",
      "--esModuleInterop",
      "--typeRoots",
      types,
    ],
    consumer,
  );
  assert(!fs.existsSync(path.join(types, "express")));
  console.log(
    JSON.stringify({
      version: installed.version,
      files: files.size,
      commonjs: "passed",
      esm: "passed",
      typesWithoutExpress: "passed",
      runtimeDependencies: 0,
    }),
  );
} finally {
  fs.rmSync(temp, { recursive: true, force: true });
}
