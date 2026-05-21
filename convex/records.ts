import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { auth, enforceRole } from "./auth";

// Expose queries and mutations for all secondary tables

// --- 1. Fields ---
export const listFields = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("fields").collect();
  },
});

export const getField = query({
  args: { fieldId: v.id("fields") },
  handler: async (ctx, args) => {
    const field = await ctx.db.get(args.fieldId);
    if (!field) return null;
    const applications = await ctx.db
      .query("fieldApplications")
      .withIndex("by_field", (q) => q.eq("fieldId", args.fieldId))
      .collect();
    const harvests = await ctx.db
      .query("harvestRecords")
      .withIndex("by_field", (q) => q.eq("fieldId", args.fieldId))
      .collect();
    return { field, applications, harvests };
  },
});

// --- 2. Contracts & Deliveries ---
export const listContracts = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("contracts").collect();
  },
});

export const listAllDeliveries = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("deliveries").collect();
  },
});

export const getContractDetails = query({
  args: { contractId: v.id("contracts") },
  handler: async (ctx, args) => {
    const contract = await ctx.db.get(args.contractId);
    if (!contract) return null;
    const deliveries = await ctx.db
      .query("deliveries")
      .withIndex("by_contract", (q) => q.eq("contractId", args.contractId))
      .collect();
    return { contract, deliveries };
  },
});

export const addDelivery = mutation({
  args: {
    contractId: v.id("contracts"),
    date: v.number(),
    bags: v.number(),
    vehicleRef: v.string(),
    notes: v.string(),
  },
  handler: async (ctx, args) => {
    if (args.bags <= 0) {
      throw new Error("[Contract] addDelivery failed: bags delivered must be greater than zero");
    }
    return await ctx.db.insert("deliveries", args);
  },
});

// --- 3. Inventory ---
export const listFeedInventory = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("feedInventory").collect();
  },
});

export const listVetInventory = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("vetInventory").collect();
  },
});

export const updateFeedQuantity = mutation({
  args: {
    id: v.id("feedInventory"),
    quantity: v.number(),
  },
  handler: async (ctx, args) => {
    if (args.quantity < 0) {
      throw new Error("[Inventory] updateFeedQuantity failed: quantity cannot be negative");
    }
    await ctx.db.patch(args.id, { quantity: args.quantity, updatedAt: Date.now() });
    return { success: true };
  },
});

export const updateVetQuantity = mutation({
  args: {
    id: v.id("vetInventory"),
    quantity: v.number(),
  },
  handler: async (ctx, args) => {
    if (args.quantity < 0) {
      throw new Error("[Inventory] updateVetQuantity failed: quantity cannot be negative");
    }
    await ctx.db.patch(args.id, { quantity: args.quantity });
    return { success: true };
  },
});

// --- 4. Tasks ---
export const listTasks = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("tasks").collect();
  },
});

export const completeTask = mutation({
  args: { taskId: v.id("tasks") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.taskId, {
      status: "done",
      completedAt: Date.now(),
    });
    return { success: true };
  },
});

export const createTask = mutation({
  args: {
    title: v.string(),
    description: v.string(),
    assignedTo: v.id("users"),
    assignedBy: v.id("users"),
    dueDate: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("tasks", {
      ...args,
      status: "pending",
      completedAt: null,
    });
  },
});

// --- 5. Milking Sessions ---
export const logMilkingSession = mutation({
  args: {
    cowId: v.id("cows"),
    session: v.union(v.literal("AM"), v.literal("PM")),
    date: v.string(),
    litres: v.number(),
    loggedBy: v.id("users"),
    flagged: v.boolean(),
  },
  handler: async (ctx, args) => {
    if (args.litres < 0) {
      throw new Error("[Milking] logMilkingSession failed: yield litres cannot be negative");
    }

    // Server-side withholding verification (Never trust the client)
    const now = Date.now();
    const cowTreatments = await ctx.db
      .query("treatments")
      .withIndex("by_cow", (q) => q.eq("cowId", args.cowId))
      .collect();

    const activeTreatment = cowTreatments.find((t) => t.withholdingUntil > now);
    let flagged = args.flagged;
    let warningMessage: string | undefined;

    if (activeTreatment) {
      flagged = true;
      const cow = await ctx.db.get(args.cowId);
      const dateObj = new Date(activeTreatment.withholdingUntil);
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const formattedDate = `${dateObj.getDate()} ${months[dateObj.getMonth()]}`;
      warningMessage = `${cow?.tagNumber || "EL-UNKNOWN"} ${cow?.name || "Unknown"} — milk withheld until ${formattedDate}. Do not add to bulk tank.`;
    }

    const sessionId = await ctx.db.insert("milkingSessions", {
      ...args,
      flagged,
      loggedAt: now,
    });

    return {
      success: true,
      sessionId,
      flagged,
      message: warningMessage,
    };
  },
});

export const getMilkingAudit = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;
    return await ctx.db.query("milkingSessions").order("desc").take(limit);
  },
});

// --- 6. Calvings & Calves ---
export const listCalvings = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("calvings").order("desc").collect();
  },
});

export const listCalves = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("calves").order("desc").collect();
  },
});

export const registerCalving = mutation({
  args: {
    cowId: v.id("cows"),
    date: v.number(),
    calfSex: v.union(v.literal("M"), v.literal("F")),
    calfTagNumber: v.union(v.string(), v.null()),
    sireInfo: v.string(),
    complications: v.string(),
    notes: v.string(),
  },
  handler: async (ctx, args) => {
    const calvingId = await ctx.db.insert("calvings", args);
    
    // Update the mother's record
    await ctx.db.patch(args.cowId, {
      lastCalvingDate: args.date,
    });

    // If tag number is provided, register the calf
    if (args.calfTagNumber) {
      await ctx.db.insert("calves", {
        tagNumber: args.calfTagNumber,
        name: args.calfSex === "F" ? "Heifer Calf" : "Bull Calf",
        dateOfBirth: args.date,
        sex: args.calfSex,
        damTagNumber: "EL-UNKNOWN", // We can populate this dynamically on read if needed
        sireInfo: args.sireInfo,
        weaningDate: null,
        currentWeight: 40, // standard default
        status: "active",
      });
    }

    return calvingId;
  },
});

// --- 7. Treatments ---
export const listAllTreatments = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("treatments").order("desc").collect();
  },
});

export const logTreatment = mutation({
  args: {
    cowId: v.id("cows"),
    date: v.number(),
    condition: v.string(),
    drugAdministered: v.string(),
    dosage: v.string(),
    withholdingDays: v.number(),
    administeredBy: v.id("users"),
    notes: v.string(),
  },
  handler: async (ctx, args) => {
    if (args.withholdingDays < 0) {
      throw new Error("[Treatment] logTreatment failed: withholding days cannot be negative");
    }
    const withholdingUntil = args.date + args.withholdingDays * 24 * 60 * 60 * 1000;
    
    // Update cow status to treatment
    await ctx.db.patch(args.cowId, {
      status: "treatment",
    });

    return await ctx.db.insert("treatments", {
      ...args,
      withholdingUntil,
    });
  },
});

// --- 8. Breeding & Services ---
export const listServices = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("services").order("desc").collect();
  },
});

export const logService = mutation({
  args: {
    cowId: v.id("cows"),
    date: v.number(),
    type: v.union(v.literal("AI"), v.literal("natural")),
    bullOrSemenCode: v.string(),
    performedBy: v.id("users"),
    notes: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("services", args);
  },
});

export const listPregnancyDiagnoses = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("pregnancyDiagnoses").order("desc").collect();
  },
});

export const logPregnancyDiagnosis = mutation({
  args: {
    cowId: v.id("cows"),
    date: v.number(),
    result: v.union(v.literal("pregnant"), v.literal("open"), v.literal("uncertain")),
    expectedCalvingDate: v.union(v.number(), v.null()),
    performedBy: v.id("users"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("pregnancyDiagnoses", args);
  },
});

// --- 9. Inventory Movements (Stock Flow) ---
export const listInventoryMovements = query({
  args: {},
  handler: async (ctx) => {
    const movements = await ctx.db.query("inventoryMovementsLegacy").order("desc").collect();
    const users = await ctx.db.query("users").collect();
    const userMap = new Map(users.map((u) => [u._id, u.name]));
    return movements.map((m) => ({
      ...m,
      userName: userMap.get(m.performedBy) ?? "System",
    }));
  },
});

export const addInventoryMovement = mutation({
  args: {
    itemId: v.string(),
    itemType: v.union(v.literal("feed"), v.literal("vet"), v.literal("machinery"), v.literal("general")),
    productName: v.string(),
    type: v.union(v.literal("restock"), v.literal("withdrawal")),
    quantity: v.number(),
    unit: v.string(),
    performedBy: v.id("users"),
    notes: v.string(),
  },
  handler: async (ctx, args) => {
    if (args.quantity <= 0) {
      throw new Error("[Inventory] addInventoryMovement failed: quantity must be greater than zero");
    }
    // 1. Insert movement log
    const movementId = await ctx.db.insert("inventoryMovementsLegacy", {
      ...args,
      timestamp: Date.now(),
    });

    // 2. Adjust target inventory quantity if a matching item exists
    if (args.itemType === "feed") {
      const feedId = ctx.db.normalizeId("feedInventory", args.itemId);
      if (feedId) {
        const item = await ctx.db.get(feedId);
        if (item) {
          const delta = args.type === "restock" ? args.quantity : -args.quantity;
          const newQty = Math.max(0, item.quantity + delta);
          await ctx.db.patch(feedId, { quantity: newQty, updatedAt: Date.now() });
        }
      }
    } else if (args.itemType === "vet") {
      const vetId = ctx.db.normalizeId("vetInventory", args.itemId);
      if (vetId) {
        const item = await ctx.db.get(vetId);
        if (item) {
          const delta = args.type === "restock" ? args.quantity : -args.quantity;
          const newQty = Math.max(0, item.quantity + delta);
          await ctx.db.patch(vetId, { quantity: newQty });
        }
      }
    }

    return movementId;
  },
});

// --- 10. Incidents & Departmental Issues ---
export const listIncidents = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("incidents").order("desc").collect();
  },
});

export const addIncident = mutation({
  args: {
    title: v.string(),
    department: v.union(v.literal("dairy"), v.literal("cereal"), v.literal("machinery"), v.literal("infrastructure"), v.literal("general")),
    description: v.string(),
    reportedBy: v.id("users"),
    severity: v.union(v.literal("low"), v.literal("medium"), v.literal("critical")),
    notes: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("incidents", {
      ...args,
      reportedAt: Date.now(),
      status: "open",
      resolvedAt: null,
    });
  },
});

export const updateIncidentStatus = mutation({
  args: {
    incidentId: v.id("incidents"),
    status: v.union(v.literal("open"), v.literal("investigating"), v.literal("resolved")),
    notes: v.string(),
  },
  handler: async (ctx, args) => {
    const patchData: { status: typeof args.status; resolvedAt?: number | null; notes: string } = {
      status: args.status,
      notes: args.notes,
    };
    if (args.status === "resolved") {
      patchData.resolvedAt = Date.now();
    } else {
      patchData.resolvedAt = null;
    }
    await ctx.db.patch(args.incidentId, patchData);
    return { success: true };
  },
});

// --- 11. Machinery Fleet ---
export const listMachinery = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("machinery").collect();
  },
});

export const addMachinery = mutation({
  args: {
    name: v.string(),
    type: v.union(v.literal("tractor"), v.literal("harvester"), v.literal("milking_pump"), v.literal("vehicle"), v.literal("other")),
    plateNumber: v.string(),
    status: v.union(v.literal("operational"), v.literal("maintenance"), v.literal("broken")),
    fuelType: v.union(v.literal("diesel"), v.literal("petrol"), v.literal("electric")),
    nextServiceDate: v.number(),
    notes: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("machinery", args);
  },
});

export const listMaintenance = query({
  args: { machineryId: v.optional(v.id("machinery")) },
  handler: async (ctx, args) => {
    if (args.machineryId !== undefined) {
      return await ctx.db
        .query("machineryMaintenance")
        .withIndex("by_machinery", (q) => q.eq("machineryId", args.machineryId!))
        .order("desc")
        .collect();
    }
    return await ctx.db.query("machineryMaintenance").order("desc").collect();
  },
});

export const logMaintenance = mutation({
  args: {
    machineryId: v.id("machinery"),
    date: v.number(),
    type: v.union(v.literal("routine"), v.literal("repair"), v.literal("overhaul")),
    description: v.string(),
    cost: v.number(),
    performedBy: v.string(),
    notes: v.string(),
  },
  handler: async (ctx, args) => {
    if (args.cost < 0) {
      throw new Error("[Machinery] logMaintenance failed: service cost cannot be negative");
    }
    return await ctx.db.insert("machineryMaintenance", args);
  },
});

// --- 12. Rainfall Logs ---
export const listRainfall = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("rainfall").order("desc").collect();
  },
});

export const logRainfall = mutation({
  args: {
    date: v.string(),
    amountMm: v.number(),
    recordedBy: v.id("users"),
    notes: v.string(),
  },
  handler: async (ctx, args) => {
    if (args.amountMm < 0) {
      throw new Error("[Rainfall] logRainfall failed: rainfall amount cannot be negative");
    }
    return await ctx.db.insert("rainfall", args);
  },
});

// --- 13. Financial Transactions ---
export const listTransactions = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("financialTransactions").order("desc").collect();
  },
});

export const addTransaction = mutation({
  args: {
    date: v.number(),
    type: v.union(v.literal("income"), v.literal("expense")),
    category: v.union(
      v.literal("milk_sales"),
      v.literal("crop_sales"),
      v.literal("animal_sales"),
      v.literal("wages"),
      v.literal("vet_medical"),
      v.literal("feed_purchase"),
      v.literal("machinery_fuel"),
      v.literal("maintenance"),
      v.literal("supplies"),
      v.literal("other")
    ),
    amount: v.number(),
    description: v.string(),
    reference: v.string(),
    loggedBy: v.id("users"),
  },
  handler: async (ctx, args) => {
    if (args.amount <= 0) {
      throw new Error("[Finance] addTransaction failed: transaction amount must be greater than zero");
    }
    return await ctx.db.insert("financialTransactions", args);
  },
});

// --- 14. Purge Database ---
export const clearDatabase = mutation({
  args: {},
  handler: async (ctx) => {
    await enforceRole(ctx, ["manager"]);
    const tables = [
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
    ];
    for (const t of tables) {
      const records = await ctx.db.query(t as any).collect();
      for (const r of records) {
        await ctx.db.delete(r._id);
      }
    }
    return { success: true };
  },
});

// ==================== NEW GENERALIZED AGRIBUSINESS MODULES ====================

// --- 1. Generalized Livestock ---
export const listLivestock = query({
  args: { category: v.optional(v.string()) },
  handler: async (ctx, args) => {
    let q = ctx.db.query("livestock");
    if (args.category !== undefined) {
      return await q.withIndex("by_category", (dbQ) => dbQ.eq("category", args.category!)).collect();
    }
    return await q.collect();
  },
});

export const getLivestock = query({
  args: { id: v.id("livestock") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const getLivestockByTag = query({
  args: { tagNumber: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db.query("livestock").withIndex("by_tag", (q) => q.eq("tagNumber", args.tagNumber)).unique();
  },
});

export const listLivestockProduction = query({
  args: { livestockId: v.optional(v.id("livestock")), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const q = args.livestockId !== undefined
      ? ctx.db.query("livestockProduction").withIndex("by_livestock_and_date", (dbQ) => dbQ.eq("livestockId", args.livestockId!))
      : ctx.db.query("livestockProduction");
    const limit = args.limit ?? 100;
    return await q.order("desc").take(limit);
  },
});

export const listLivestockHealth = query({
  args: { livestockId: v.optional(v.id("livestock")) },
  handler: async (ctx, args) => {
    const q = args.livestockId !== undefined
      ? ctx.db.query("livestockHealth").withIndex("by_livestock", (dbQ) => dbQ.eq("livestockId", args.livestockId!))
      : ctx.db.query("livestockHealth");
    return await q.order("desc").collect();
  },
});

export const listLivestockBreeding = query({
  args: { livestockId: v.optional(v.id("livestock")) },
  handler: async (ctx, args) => {
    const q = args.livestockId !== undefined
      ? ctx.db.query("livestockBreeding").withIndex("by_livestock", (dbQ) => dbQ.eq("livestockId", args.livestockId!))
      : ctx.db.query("livestockBreeding");
    return await q.order("desc").collect();
  },
});

// --- 2. Generalized Crops & Fields ---
export const listCropBlocks = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("cropBlocks").collect();
  },
});

export const getCropBlock = query({
  args: { id: v.id("cropBlocks") },
  handler: async (ctx, args) => {
    const block = await ctx.db.get(args.id);
    if (!block) return null;
    const activities = await ctx.db.query("cropActivities").withIndex("by_block", (q) => q.eq("cropBlockId", block._id)).collect();
    return { ...block, activities };
  },
});

export const listCropActivities = query({
  args: { cropBlockId: v.optional(v.id("cropBlocks")) },
  handler: async (ctx, args) => {
    const q = args.cropBlockId !== undefined
      ? ctx.db.query("cropActivities").withIndex("by_block", (dbQ) => dbQ.eq("cropBlockId", args.cropBlockId!))
      : ctx.db.query("cropActivities");
    return await q.order("desc").collect();
  },
});

// --- 3. Generalized Inventory ---
export const listInventory = query({
  args: { status: v.optional(v.union(v.literal("active"), v.literal("pending_approval"))) },
  handler: async (ctx, args) => {
    const status = args.status ?? "active";
    return await ctx.db.query("inventory").filter((q) => q.eq(q.field("status"), status)).collect();
  },
});

export const getInventoryItem = query({
  args: { id: v.id("inventory") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const listInventoryMovementsNew = query({
  args: { inventoryId: v.optional(v.id("inventory")) },
  handler: async (ctx, args) => {
    const q = args.inventoryId !== undefined
      ? ctx.db.query("inventoryMovements").withIndex("by_inventory", (dbQ) => dbQ.eq("inventoryId", args.inventoryId!))
      : ctx.db.query("inventoryMovements");
    const movements = await q.order("desc").collect();
    const users = await ctx.db.query("users").collect();
    const inventory = await ctx.db.query("inventory").collect();
    const userMap = new Map(users.map((u) => [u._id, { name: u.name ?? "Unknown", role: u.role ?? "worker" }]));
    const itemMap = new Map(inventory.map((i) => [i._id, { productName: i.productName, unit: i.unit, category: i.category }]));
    return movements.map((m) => ({
      ...m,
      userName: userMap.get(m.performedBy)?.name ?? "Unknown",
      userRole: userMap.get(m.performedBy)?.role ?? "worker",
      productName: itemMap.get(m.inventoryId)?.productName ?? "Unknown Item",
      unit: itemMap.get(m.inventoryId)?.unit ?? "",
      category: itemMap.get(m.inventoryId)?.category ?? "",
    }));
  },
});

// --- 4. MUTATIONS (Strict Server-side Role Authorization) ---

// --- Worker Mutations ---
export const logLivestockProduction = mutation({
  args: {
    livestockId: v.id("livestock"),
    category: v.string(),
    type: v.string(),
    quantity: v.number(),
    date: v.string(),
    flagged: v.boolean(),
    notes: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await enforceRole(ctx, ["worker"]);
    if (args.quantity < 0) {
      throw new Error("[LivestockProduction] logLivestockProduction failed: quantity cannot be negative");
    }
    return await ctx.db.insert("livestockProduction", {
      ...args,
      loggedBy: user._id,
      loggedAt: Date.now(),
    });
  },
});

export const logLivestockHealth = mutation({
  args: {
    livestockId: v.id("livestock"),
    category: v.string(),
    date: v.number(),
    condition: v.string(),
    treatment: v.string(),
    dosage: v.string(),
    withholdingDays: v.number(),
    notes: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await enforceRole(ctx, ["worker"]);
    const withholdingUntil = args.date + args.withholdingDays * 24 * 60 * 60 * 1000;
    
    if (args.withholdingDays > 0) {
      await ctx.db.patch(args.livestockId, { status: "treatment" });
    }

    return await ctx.db.insert("livestockHealth", {
      ...args,
      withholdingUntil,
      administeredBy: user._id,
    });
  },
});

export const logLivestockBreeding = mutation({
  args: {
    livestockId: v.id("livestock"),
    category: v.string(),
    date: v.number(),
    type: v.union(v.literal("insemination"), v.literal("pregnancy_check"), v.literal("birth")),
    status: v.union(v.literal("pregnant"), v.literal("open"), v.literal("successful"), v.literal("failed")),
    details: v.string(),
    notes: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await enforceRole(ctx, ["worker"]);

    if (args.type === "birth" && args.status === "successful") {
      await ctx.db.patch(args.livestockId, { status: "active" });
    }

    return await ctx.db.insert("livestockBreeding", {
      ...args,
      performedBy: user._id,
    });
  },
});

export const logCropActivity = mutation({
  args: {
    cropBlockId: v.id("cropBlocks"),
    type: v.union(v.literal("planting"), v.literal("application"), v.literal("harvesting")),
    activityDate: v.number(),
    productApplied: v.optional(v.string()),
    rate: v.optional(v.string()),
    quantityHarvested: v.optional(v.number()),
    notes: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await enforceRole(ctx, ["worker"]);

    if (args.type === "planting") {
      await ctx.db.patch(args.cropBlockId, { status: "planted", plantedDate: args.activityDate });
    } else if (args.type === "harvesting") {
      await ctx.db.patch(args.cropBlockId, { status: "harvested" });
    }

    return await ctx.db.insert("cropActivities", {
      ...args,
      loggedBy: user._id,
    });
  },
});

export const registerInventoryItem = mutation({
  args: {
    category: v.string(),
    productName: v.string(),
    unit: v.string(),
    lowStockThreshold: v.number(),
  },
  handler: async (ctx, args) => {
    await enforceRole(ctx, ["worker"]);

    const existing = await ctx.db.query("inventory")
      .filter((q) => q.eq(q.field("productName"), args.productName))
      .unique();
    if (existing) {
      throw new Error(`[Inventory] registerItem failed: product ${args.productName} is already registered`);
    }

    return await ctx.db.insert("inventory", {
      ...args,
      quantity: 0,
      status: "pending_approval",
      updatedAt: Date.now(),
    });
  },
});

export const logInventoryMovement = mutation({
  args: {
    inventoryId: v.id("inventory"),
    type: v.union(v.literal("restock"), v.literal("withdrawal")),
    quantity: v.number(),
    notes: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await enforceRole(ctx, ["worker"]);

    if (args.quantity <= 0) {
      throw new Error("[Inventory] Movement quantity must be greater than zero");
    }

    const item = await ctx.db.get(args.inventoryId);
    if (!item) {
      throw new Error("[Inventory] Product not found");
    }

    if (item.status !== "active") {
      throw new Error("[Inventory] Product is pending approval and cannot be restocked or withdrawn");
    }

    const delta = args.type === "restock" ? args.quantity : -args.quantity;
    const newQty = item.quantity + delta;
    if (newQty < 0) {
      throw new Error(`[Inventory] Insufficient stock: requested ${args.quantity} but only ${item.quantity} available`);
    }

    await ctx.db.patch(args.inventoryId, {
      quantity: newQty,
      updatedAt: Date.now(),
    });

    return await ctx.db.insert("inventoryMovements", {
      inventoryId: args.inventoryId,
      type: args.type,
      quantity: args.quantity,
      performedBy: user._id,
      timestamp: Date.now(),
      notes: args.notes,
    });
  },
});

// --- Manager Mutations ---
export const addInventoryItem = mutation({
  args: {
    category: v.string(),
    productName: v.string(),
    unit: v.string(),
    lowStockThreshold: v.number(),
    initialQuantity: v.number(),
  },
  handler: async (ctx, args) => {
    await enforceRole(ctx, ["manager"]);

    const existing = await ctx.db.query("inventory")
      .filter((q) => q.eq(q.field("productName"), args.productName))
      .unique();
    if (existing) {
      throw new Error(`[Inventory] addInventoryItem failed: product ${args.productName} is already registered`);
    }

    return await ctx.db.insert("inventory", {
      category: args.category,
      productName: args.productName,
      unit: args.unit,
      lowStockThreshold: args.lowStockThreshold,
      quantity: args.initialQuantity,
      status: "active",
      updatedAt: Date.now(),
    });
  },
});

export const approveInventoryItem = mutation({
  args: { id: v.id("inventory") },
  handler: async (ctx, args) => {
    await enforceRole(ctx, ["manager"]);

    const item = await ctx.db.get(args.id);
    if (!item || item.status !== "pending_approval") {
      throw new Error("[Inventory] approveInventoryItem failed: item not found or not pending approval");
    }

    await ctx.db.patch(args.id, {
      status: "active",
      updatedAt: Date.now(),
    });
    return { success: true };
  },
});

export const rejectInventoryItem = mutation({
  args: { id: v.id("inventory") },
  handler: async (ctx, args) => {
    await enforceRole(ctx, ["manager"]);

    const item = await ctx.db.get(args.id);
    if (!item || item.status !== "pending_approval") {
      throw new Error("[Inventory] rejectInventoryItem failed: item not found or not pending approval");
    }

    await ctx.db.delete(args.id);
    return { success: true };
  },
});

export const updateInventoryThreshold = mutation({
  args: { id: v.id("inventory"), threshold: v.number() },
  handler: async (ctx, args) => {
    await enforceRole(ctx, ["manager"]);

    const item = await ctx.db.get(args.id);
    if (!item) {
      throw new Error("[Inventory] updateInventoryThreshold failed: item not found");
    }

    await ctx.db.patch(args.id, {
      lowStockThreshold: args.threshold,
      updatedAt: Date.now(),
    });
    return { success: true };
  },
});

export const createCropBlock = mutation({
  args: {
    name: v.string(),
    category: v.string(),
    crop: v.string(),
    acres: v.number(),
    status: v.union(v.literal("planted"), v.literal("growing"), v.literal("harvested"), v.literal("fallow")),
    notes: v.string(),
  },
  handler: async (ctx, args) => {
    await enforceRole(ctx, ["worker", "manager"]);

    return await ctx.db.insert("cropBlocks", {
      ...args,
      plantedDate: args.status === "planted" ? Date.now() : null,
      expectedHarvestDate: null,
    });
  },
});

export const editCropBlock = mutation({
  args: {
    id: v.id("cropBlocks"),
    name: v.string(),
    category: v.string(),
    crop: v.string(),
    acres: v.number(),
    status: v.union(v.literal("planted"), v.literal("growing"), v.literal("harvested"), v.literal("fallow")),
    notes: v.string(),
  },
  handler: async (ctx, args) => {
    await enforceRole(ctx, ["manager"]);

    const { id, ...data } = args;
    await ctx.db.patch(id, data);
    return { success: true };
  },
});

export const deleteCropBlock = mutation({
  args: { id: v.id("cropBlocks") },
  handler: async (ctx, args) => {
    await enforceRole(ctx, ["manager"]);
    await ctx.db.delete(args.id);
    return { success: true };
  },
});

export const createLivestock = mutation({
  args: {
    category: v.string(),
    tagNumber: v.string(),
    name: v.string(),
    breed: v.string(),
    dateOfBirth: v.number(),
    status: v.union(v.literal("active"), v.literal("treatment"), v.literal("dry"), v.literal("sold"), v.literal("deceased")),
    notes: v.string(),
  },
  handler: async (ctx, args) => {
    await enforceRole(ctx, ["worker", "manager"]);

    const existing = await ctx.db.query("livestock").withIndex("by_tag", (q) => q.eq("tagNumber", args.tagNumber)).unique();
    if (existing) {
      throw new Error(`[Livestock] createLivestock failed: tagNumber ${args.tagNumber} already exists`);
    }

    return await ctx.db.insert("livestock", args);
  },
});

export const editLivestock = mutation({
  args: {
    id: v.id("livestock"),
    category: v.string(),
    tagNumber: v.string(),
    name: v.string(),
    breed: v.string(),
    dateOfBirth: v.number(),
    status: v.union(v.literal("active"), v.literal("treatment"), v.literal("dry"), v.literal("sold"), v.literal("deceased")),
    notes: v.string(),
  },
  handler: async (ctx, args) => {
    await enforceRole(ctx, ["manager"]);

    const { id, ...data } = args;
    await ctx.db.patch(id, data);
    return { success: true };
  },
});

export const deleteLivestock = mutation({
  args: { id: v.id("livestock") },
  handler: async (ctx, args) => {
    await enforceRole(ctx, ["manager"]);
    await ctx.db.delete(args.id);
    return { success: true };
  },
});

export const createMachinery = mutation({
  args: {
    name: v.string(),
    type: v.union(v.literal("tractor"), v.literal("harvester"), v.literal("milking_pump"), v.literal("vehicle"), v.literal("tool"), v.literal("supply"), v.literal("other")),
    plateNumber: v.string(),
    status: v.union(v.literal("operational"), v.literal("maintenance"), v.literal("broken")),
    fuelType: v.union(v.literal("diesel"), v.literal("petrol"), v.literal("electric")),
    nextServiceDate: v.number(),
    notes: v.string(),
  },
  handler: async (ctx, args) => {
    await enforceRole(ctx, ["worker", "manager"]);
    return await ctx.db.insert("machinery", args);
  },
});

export const editMachinery = mutation({
  args: {
    id: v.id("machinery"),
    name: v.string(),
    type: v.union(v.literal("tractor"), v.literal("harvester"), v.literal("milking_pump"), v.literal("vehicle"), v.literal("tool"), v.literal("supply"), v.literal("other")),
    plateNumber: v.string(),
    status: v.union(v.literal("operational"), v.literal("maintenance"), v.literal("broken")),
    fuelType: v.union(v.literal("diesel"), v.literal("petrol"), v.literal("electric")),
    nextServiceDate: v.number(),
    notes: v.string(),
  },
  handler: async (ctx, args) => {
    await enforceRole(ctx, ["manager"]);
    const { id, ...data } = args;
    await ctx.db.patch(id, data);
    return { success: true };
  },
});

export const deleteMachinery = mutation({
  args: { id: v.id("machinery") },
  handler: async (ctx, args) => {
    await enforceRole(ctx, ["manager"]);
    await ctx.db.delete(args.id);
    return { success: true };
  },
});

export const deleteInventoryItem = mutation({
  args: { id: v.id("inventory") },
  handler: async (ctx, args) => {
    await enforceRole(ctx, ["manager"]);
    await ctx.db.delete(args.id);
    return { success: true };
  },
});

// --- Requests System ---
export const listRequests = query({
  args: {},
  handler: async (ctx) => {
    await enforceRole(ctx, ["worker", "manager"]);
    return await ctx.db.query("requests").order("desc").collect();
  },
});

export const createRequest = mutation({
  args: {
    title: v.string(),
    category: v.union(v.literal("supplies"), v.literal("maintenance"), v.literal("other")),
    details: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await enforceRole(ctx, ["worker", "manager"]);
    return await ctx.db.insert("requests", {
      title: args.title,
      category: args.category,
      details: args.details,
      requestedBy: user._id,
      requestedByName: user.name || "Staff Member",
      requestedAt: Date.now(),
      status: "pending",
    });
  },
});

export const approveRequest = mutation({
  args: { id: v.id("requests"), notes: v.optional(v.string()) },
  handler: async (ctx, args) => {
    await enforceRole(ctx, ["manager"]);
    const req = await ctx.db.get(args.id);
    if (!req) throw new Error("[Requests] approveRequest failed: request not found");
    await ctx.db.patch(args.id, {
      status: "approved",
      notes: args.notes,
    });
    return { success: true };
  },
});

export const rejectRequest = mutation({
  args: { id: v.id("requests"), notes: v.optional(v.string()) },
  handler: async (ctx, args) => {
    await enforceRole(ctx, ["manager"]);
    const req = await ctx.db.get(args.id);
    if (!req) throw new Error("[Requests] rejectRequest failed: request not found");
    await ctx.db.patch(args.id, {
      status: "rejected",
      notes: args.notes,
    });
    return { success: true };
  },
});

export const deleteRequest = mutation({
  args: { id: v.id("requests") },
  handler: async (ctx, args) => {
    await enforceRole(ctx, ["manager"]);
    await ctx.db.delete(args.id);
    return { success: true };
  },
});

