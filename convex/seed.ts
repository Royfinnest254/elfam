import { mutation } from "./_generated/server";
import { v } from "convex/values";

export default mutation({
  args: {},
  handler: async (ctx) => {
    // 1. Delete all existing records across all legacy and generalized tables
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
      "financialTransactions"
    ];

    for (const table of tables) {
      const records = await ctx.db.query(table as any).collect();
      for (const r of records) {
        await ctx.db.delete(r._id);
      }
    }

    const now = 1779205903000; // Fixed timestamp (May 19, 2026)
    const oneDayMs = 24 * 60 * 60 * 1000;

    // 2. Seed Users (Roles strictly mapped to manager or worker)
    const margaretId = await ctx.db.insert("users", {
      name: "Margaret Kamar",
      email: "margaret@elfam.co.ke",
      role: "manager", // Owner is retired; mapped to manager
      phone: "+254711223344",
      joinedAt: now - 365 * oneDayMs,
    });

    const davidId = await ctx.db.insert("users", {
      name: "David Ngetich",
      email: "david@elfam.co.ke",
      role: "manager",
      phone: "+254722334455",
      joinedAt: now - 180 * oneDayMs,
    });

    const kibetId = await ctx.db.insert("users", {
      name: "Kibet",
      email: "kibet@elfam.co.ke",
      role: "worker",
      phone: "+254733445566",
      joinedAt: now - 90 * oneDayMs,
    });

    const chebetId = await ctx.db.insert("users", {
      name: "Chebet",
      email: "chebet@elfam.co.ke",
      role: "worker",
      phone: "+254744556677",
      joinedAt: now - 90 * oneDayMs,
    });

    // 3. Seed Generalized Livestock Categories (Cattle, Poultry, Rabbits)
    const cattle1 = await ctx.db.insert("livestock", {
      category: "Cattle",
      tagNumber: "EL-C001",
      name: "Wambui",
      breed: "Friesian",
      dateOfBirth: now - 3 * 365 * oneDayMs,
      status: "active",
      notes: "High yield dairy cow.",
    });

    const cattle2 = await ctx.db.insert("livestock", {
      category: "Cattle",
      tagNumber: "EL-C002",
      name: "Akinyi",
      breed: "Ayrshire",
      dateOfBirth: now - 2 * 365 * oneDayMs,
      status: "dry",
      notes: "Currently dry, expected calving soon.",
    });

    const poultry1 = await ctx.db.insert("livestock", {
      category: "Poultry",
      tagNumber: "COOP-A",
      name: "Kienyeji Layers Batch A",
      breed: "Kienyeji",
      dateOfBirth: now - 120 * oneDayMs,
      status: "active",
      notes: "500-bird layer flock in Coop A.",
    });

    const rabbits1 = await ctx.db.insert("livestock", {
      category: "Rabbits",
      tagNumber: "HUTCH-01",
      name: "New Zealand White Breeders",
      breed: "New Zealand White",
      dateOfBirth: now - 240 * oneDayMs,
      status: "active",
      notes: "Breeding group of 10 rabbits.",
    });

    // 4. Seed Generalized Crop Blocks (Cereal, Horticulture, Forage)
    const blockA = await ctx.db.insert("cropBlocks", {
      name: "North Sector Field A",
      category: "Cereal",
      crop: "wheat",
      acres: 250,
      status: "growing",
      plantedDate: now - 60 * oneDayMs,
      expectedHarvestDate: now + 60 * oneDayMs,
      notes: "Planted under premium contract.",
    });

    const blockB = await ctx.db.insert("cropBlocks", {
      name: "South Sector Field B",
      category: "Cereal",
      crop: "barley",
      acres: 150,
      status: "growing",
      plantedDate: now - 45 * oneDayMs,
      expectedHarvestDate: now + 75 * oneDayMs,
      notes: "EABL contracted barley block.",
    });

    const blockC = await ctx.db.insert("cropBlocks", {
      name: "Valley Plot C",
      category: "Horticulture",
      crop: "potatoes",
      acres: 20,
      status: "planted",
      plantedDate: now - 10 * oneDayMs,
      expectedHarvestDate: now + 90 * oneDayMs,
      notes: "Drip-irrigated potato crop.",
    });

    const blockD = await ctx.db.insert("cropBlocks", {
      name: "Riverbank Meadow D",
      category: "Forage",
      crop: "lucerne",
      acres: 50,
      status: "growing",
      plantedDate: now - 180 * oneDayMs,
      expectedHarvestDate: now + 15 * oneDayMs,
      notes: "Alfalfa fodder block for dairy feed.",
    });

    // 5. Seed Inventory (Active vs Pending Approval)
    const feed1 = await ctx.db.insert("inventory", {
      category: "Feed",
      productName: "Dairy Meal Concentrate",
      quantity: 120,
      unit: "bags",
      lowStockThreshold: 20,
      status: "active",
      updatedAt: now,
    });

    const feed2 = await ctx.db.insert("inventory", {
      category: "Feed",
      productName: "Maize Silage Pit A",
      quantity: 45,
      unit: "tonnes",
      lowStockThreshold: 10,
      status: "active",
      updatedAt: now,
    });

    const med1 = await ctx.db.insert("inventory", {
      category: "Medicine",
      productName: "Penicillin Antibiotic Vet Injectable",
      quantity: 1500,
      unit: "ml",
      lowStockThreshold: 200,
      status: "active",
      updatedAt: now,
    });

    // Propose items by worker (awaiting manager approval)
    const proposedItem1 = await ctx.db.insert("inventory", {
      category: "Medicine",
      productName: "Foot-and-Mouth Disease Vaccine",
      quantity: 0, // Initial proposed items start with 0 stock
      unit: "vials",
      lowStockThreshold: 10,
      status: "pending_approval", // Pending Manager Approval
      updatedAt: now,
    });

    const proposedItem2 = await ctx.db.insert("inventory", {
      category: "Supplies",
      productName: "Nylon Baler Twine Extra-Strong",
      quantity: 0,
      unit: "rolls",
      lowStockThreshold: 5,
      status: "pending_approval",
      updatedAt: now,
    });

    // 6. Seed Equipment/Machinery Registry
    const tractor = await ctx.db.insert("machinery", {
      name: "John Deere 6110M Utility Tractor",
      type: "tractor",
      plateNumber: "KCD 123X",
      status: "operational",
      fuelType: "diesel",
      nextServiceDate: now + 30 * oneDayMs,
      notes: "Main cultivation tractor.",
    });

    const harvester = await ctx.db.insert("machinery", {
      name: "Claas Lexion 8700 Combine Harvester",
      type: "harvester",
      plateNumber: "KCE 456Y",
      status: "operational",
      fuelType: "diesel",
      nextServiceDate: now + 90 * oneDayMs,
      notes: "Used for wheat and barley harvesting.",
    });

    const pump = await ctx.db.insert("machinery", {
      name: "DeLaval Milking Pump 3HP",
      type: "milking_pump",
      plateNumber: "FIXED-01",
      status: "operational",
      fuelType: "diesel",
      nextServiceDate: now + 15 * oneDayMs,
      notes: "Dairy parlour main vacuum pump.",
    });

    // 7. Seed Tasks
    await ctx.db.insert("tasks", {
      title: "Morning Milking Session",
      description: "Log AM yield for all active milking Cattle.",
      assignedTo: kibetId,
      assignedBy: davidId,
      status: "pending",
      dueDate: now + 1 * oneDayMs,
      completedAt: null,
    });

    await ctx.db.insert("tasks", {
      title: "Fertilizer Application",
      description: "Apply NPK fertilizer on Field A crop block.",
      assignedTo: chebetId,
      assignedBy: davidId,
      status: "pending",
      dueDate: now + 2 * oneDayMs,
      completedAt: null,
    });

    return { success: true };
  },
});
