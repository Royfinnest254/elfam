import { mutation } from "./_generated/server";

/**
 * Database reset utility.
 *
 * Deletes all records from every application table so the deployment starts
 * from a clean slate. Accounts must be created through the normal sign-up
 * flow — this mutation no longer inserts any demo data.
 *
 * Call via the Convex dashboard or `npx convex run seed` when you need to
 * wipe a development deployment.
 */
export default mutation({
  args: {},
  handler: async (ctx) => {
    const tables = [
      "users",
      "authSessions",
      "authAccounts",
      "cows",
      "milkingSessions",
      "treatments",
      "services",
      "pregnancyDiagnoses",
      "calvings",
      "calves",
      "fields",
      "fieldApplications",
      "harvestRecords",
      "contracts",
      "deliveries",
      "feedInventory",
      "vetInventory",
      "tasks",
      "inventoryMovementsLegacy",
      "inventoryMovements",
      "livestock",
      "livestockProduction",
      "livestockHealth",
      "livestockBreeding",
      "cropBlocks",
      "cropActivities",
      "inventory",
      "incidents",
      "machinery",
      "machineryMaintenance",
      "rainfall",
      "financialTransactions",
      "requests",
    ];

    for (const table of tables) {
      const records = await ctx.db.query(table as any).collect();
      for (const r of records) {
        await ctx.db.delete(r._id);
      }
    }

    return { success: true, message: "Database cleared. No seed data inserted." };
  },
});
