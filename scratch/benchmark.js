const { ConvexHttpClient } = require("convex/browser");
const path = require("path");
const fs = require("fs");

// Load .env.local manually
const envPath = path.resolve(__dirname, "../.env.local");
if (fs.existsSync(envPath)) {
  const envConfig = fs.readFileSync(envPath, "utf-8");
  for (const line of envConfig.split("\n")) {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      const key = match[1];
      let value = match[2] || "";
      // Remove surrounding quotes if present
      if (value.startsWith('"') && value.endsWith('"')) {
        value = value.substring(1, value.length - 1);
      }
      process.env[key] = value;
    }
  }
}

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
if (!convexUrl) {
  console.error("[Benchmark] execution failed: NEXT_PUBLIC_CONVEX_URL is missing in environment");
  process.exit(1);
}

const client = new ConvexHttpClient(convexUrl);
// Import generated api object
const { api } = require("../convex/_generated/api");

async function runBenchmark() {
  const simNow = 1779205903000;
  const yesterdayDateStr = "2026-05-18";

  console.log("--------------------------------------------------");
  console.log("ELFAM SYSTEM DATABASE BENCHMARK REPORT");
  console.log("--------------------------------------------------");
  console.log(`Convex URL: ${convexUrl}`);
  console.log(`Warmup Runs: 5 (discarded)`);
  console.log(`Measurement Runs: 100`);
  console.log("--------------------------------------------------");

  // --- Warmup ---
  for (let i = 0; i < 5; i++) {
    await client.query(api.cows.getHerdDashboard, { now: simNow, yesterdayDateStr });
    await client.query(api.records.listInventoryMovements);
  }

  // --- Measure getHerdDashboard ---
  const herdLatencies = [];
  for (let i = 0; i < 100; i++) {
    const start = process.hrtime.bigint();
    await client.query(api.cows.getHerdDashboard, { now: simNow, yesterdayDateStr });
    const end = process.hrtime.bigint();
    herdLatencies.push(Number(end - start) / 1_000_000);
  }

  // --- Measure listInventoryMovements ---
  const movementLatencies = [];
  for (let i = 0; i < 100; i++) {
    const start = process.hrtime.bigint();
    await client.query(api.records.listInventoryMovements);
    const end = process.hrtime.bigint();
    movementLatencies.push(Number(end - start) / 1_000_000);
  }

  function reportStats(name, list) {
    list.sort((a, b) => a - b);
    const min = list[0];
    const max = list[list.length - 1];
    const sum = list.reduce((a, b) => a + b, 0);
    const mean = sum / list.length;
    const p50 = list[Math.floor(list.length * 0.50)];
    const p95 = list[Math.floor(list.length * 0.95)];
    const p99 = list[Math.floor(list.length * 0.99)];

    console.log(`QUERY: ${name}`);
    console.log(`  Min:  ${min.toFixed(2)} ms`);
    console.log(`  Mean: ${mean.toFixed(2)} ms`);
    console.log(`  P50:  ${p50.toFixed(2)} ms`);
    console.log(`  P95:  ${p95.toFixed(2)} ms`);
    console.log(`  P99:  ${p99.toFixed(2)} ms`);
    console.log(`  Max:  ${max.toFixed(2)} ms`);
    console.log("--------------------------------------------------");
  }

  reportStats("api.cows.getHerdDashboard (Optimized)", herdLatencies);
  reportStats("api.records.listInventoryMovements (Optimized)", movementLatencies);

  console.log("Infrastructure Disclosure:");
  console.log(`  Platform:     ${process.platform}`);
  console.log(`  Arch:         ${process.arch}`);
  console.log(`  Node Version: ${process.version}`);
  console.log(`  Seed Value:   ${simNow}`);
  console.log("--------------------------------------------------");
}

runBenchmark().catch((err) => {
  console.error("Benchmark failed with error:", err);
  process.exit(1);
});
