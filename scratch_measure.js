const { ConvexClient } = require('convex/browser');
const fs = require('fs');

let convexUrl = '';
try {
  const envContent = fs.readFileSync('.env.local', 'utf8');
  const match = envContent.match(/NEXT_PUBLIC_CONVEX_URL\s*=\s*(.+)/);
  if (match) {
    convexUrl = match[1].trim();
  }
} catch (e) {
  console.error("Failed to read .env.local file");
}

if (!convexUrl) {
  console.error("Missing NEXT_PUBLIC_CONVEX_URL in .env.local");
  process.exit(1);
}

const client = new ConvexClient(convexUrl);

async function measureQuery(apiRef, name, args = {}) {
  const start = process.hrtime.bigint();
  try {
    const res = await client.query(apiRef, args);
    const end = process.hrtime.bigint();
    const durationMs = Number(end - start) / 1_000_000;
    console.log(`Query ${name}: SUCCESS in ${durationMs.toFixed(2)}ms, items: ${Array.isArray(res) ? res.length : 'object'}`);
  } catch (err) {
    const end = process.hrtime.bigint();
    const durationMs = Number(end - start) / 1_000_000;
    console.error(`Query ${name}: FAILED in ${durationMs.toFixed(2)}ms. Error:`, err.message || err);
  }
}

async function run() {
  console.log("Loading API module...");
  const apiModule = await import('./convex/_generated/api.js');
  const api = apiModule.api;

  console.log("Measuring query latencies...");
  await measureQuery(api.cows.list, 'cows:list');
  await measureQuery(api.cows.getHerdDashboard, 'cows:getHerdDashboard', { now: Date.now(), yesterdayDateStr: '2026-05-18' });
  await measureQuery(api.users.list, 'users:list');
  await measureQuery(api.records.listFields, 'records:listFields');
  await measureQuery(api.records.listContracts, 'records:listContracts');
  await measureQuery(api.records.listFeedInventory, 'records:listFeedInventory');
  await measureQuery(api.records.listVetInventory, 'records:listVetInventory');
  await measureQuery(api.records.listTasks, 'records:listTasks');
  await measureQuery(api.records.listAllTreatments, 'records:listAllTreatments');
  await measureQuery(api.records.listServices, 'records:listServices');
  await measureQuery(api.records.listPregnancyDiagnoses, 'records:listPregnancyDiagnoses');
  await measureQuery(api.records.listInventoryMovements, 'records:listInventoryMovements');
  await measureQuery(api.records.listIncidents, 'records:listIncidents');
  await measureQuery(api.records.listMachinery, 'records:listMachinery');
  await measureQuery(api.records.listRainfall, 'records:listRainfall');
  await measureQuery(api.records.listTransactions, 'records:listTransactions');
  process.exit(0);
}

run();
