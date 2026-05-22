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
    const soilTests = await ctx.db
      .query("soilTests")
      .withIndex("by_field", (q) => q.eq("fieldId", args.fieldId))
      .collect();
    return { field, applications, harvests, soilTests };
  },
});

export const listAllHarvests = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("harvestRecords").collect();
  },
});

export const logFieldPlanting = mutation({
  args: {
    fieldId: v.id("fields"),
    plantedDate: v.number(),
    expectedHarvestDate: v.union(v.number(), v.null()),
    notes: v.string(),
  },
  handler: async (ctx, args) => {
    await enforceRole(ctx, ["worker", "manager"]);
    await ctx.db.patch(args.fieldId, {
      plantedDate: args.plantedDate,
      expectedHarvestDate: args.expectedHarvestDate,
      notes: args.notes,
    });
    return { success: true };
  },
});

export const logFieldApplication = mutation({
  args: {
    fieldId: v.id("fields"),
    date: v.number(),
    type: v.union(v.literal("fertilizer"), v.literal("herbicide"), v.literal("pesticide"), v.literal("seed")),
    product: v.string(),
    rate: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await enforceRole(ctx, ["worker", "manager"]);
    return await ctx.db.insert("fieldApplications", {
      ...args,
      appliedBy: user._id,
    });
  },
});

export const logFieldHarvest = mutation({
  args: {
    fieldId: v.id("fields"),
    date: v.number(),
    crop: v.string(),
    bags: v.number(),
    bagWeightKg: v.number(),
    notes: v.string(),
  },
  handler: async (ctx, args) => {
    await enforceRole(ctx, ["worker", "manager"]);
    return await ctx.db.insert("harvestRecords", args);
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

// --- 5. Milking Sessions & Production Records ---
async function logProductionRecordInternal(ctx: any, args: {
  livestockId?: string;
  groupId?: string;
  type: "milk" | "eggs" | "wool" | "honey" | "weight";
  amount: number;
  session?: "AM" | "PM";
  date: string;
  flagged: boolean;
}) {
  const user = await enforceRole(ctx, ["worker", "manager"]);
  if (args.amount < 0) {
    throw new Error("Production amount cannot be negative");
  }

  let flagged = args.flagged;
  let warningMessage: string | undefined;

  // Validations for individual livestock
  if (args.livestockId) {
    const animal = await ctx.db.get(args.livestockId as any);
    if (!animal) {
      throw new Error("Livestock not found");
    }

    // Reject milk yields if not dairy (cattle/goat) or status is dry, young, sold, deceased
    if (args.type === "milk") {
      if (animal.species !== "cattle" && animal.species !== "goat") {
        throw new Error("Milk yields can only be logged for dairy species (cattle, goat)");
      }
      if (["dry", "young", "sold", "deceased"].includes(animal.status)) {
        throw new Error(`Cannot log milk yield for an animal in status: ${animal.status}`);
      }
    }

    // Flag the record if animal is within an active medication withholding window
    const now = Date.now();
    const treatments = await ctx.db
      .query("treatments")
      .withIndex("by_livestock", (q: any) => q.eq("livestockId", args.livestockId as any))
      .collect();
    const activeTreatment = treatments.find((t: any) => t.withholdingUntil > now);
    if (activeTreatment) {
      flagged = true;
      const dateObj = new Date(activeTreatment.withholdingUntil);
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const formattedDate = `${dateObj.getDate()} ${months[dateObj.getMonth()]}`;
      warningMessage = `${animal.tagNumber} ${animal.name} — production withheld until ${formattedDate}. Do not add to bulk stock.`;
    }
  }

  // Validations for group
  if (args.groupId) {
    const group = await ctx.db.get(args.groupId as any);
    if (!group) {
      throw new Error("Livestock group not found");
    }

    // Reject eggs logging if target is not poultry or group is inactive
    if (args.type === "eggs") {
      if (group.species !== "poultry") {
        throw new Error("Egg production can only be logged for poultry groups");
      }
      if (group.status !== "active") {
        throw new Error("Cannot log egg production for an inactive group");
      }
    }

    // Flag if group is under withholding
    const now = Date.now();
    const treatments = await ctx.db
      .query("treatments")
      .withIndex("by_group", (q: any) => q.eq("groupId", args.groupId as any))
      .collect();
    const activeTreatment = treatments.find((t: any) => t.withholdingUntil > now);
    if (activeTreatment) {
      flagged = true;
      const dateObj = new Date(activeTreatment.withholdingUntil);
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const formattedDate = `${dateObj.getDate()} ${months[dateObj.getMonth()]}`;
      warningMessage = `${group.groupCode} ${group.name} — production withheld until ${formattedDate}. Do not use yield.`;
    }
  }

  const recordId = await ctx.db.insert("productionRecords", {
    livestockId: args.livestockId as any,
    groupId: args.groupId as any,
    type: args.type,
    amount: args.amount,
    session: args.session,
    date: args.date,
    flagged,
    loggedBy: user._id,
    loggedAt: Date.now(),
  });

  return {
    success: true,
    recordId,
    flagged,
    message: warningMessage,
  };
}

export const logProductionRecord = mutation({
  args: {
    livestockId: v.optional(v.id("livestock")),
    groupId: v.optional(v.id("livestockGroups")),
    type: v.union(v.literal("milk"), v.literal("eggs"), v.literal("wool"), v.literal("honey"), v.literal("weight")),
    amount: v.number(),
    session: v.optional(v.union(v.literal("AM"), v.literal("PM"))),
    date: v.string(), // YYYY-MM-DD
    flagged: v.boolean(),
  },
  handler: async (ctx, args) => {
    return await logProductionRecordInternal(ctx, args);
  },
});

export const logMilkingSession = mutation({
  args: {
    livestockId: v.id("livestock"),
    session: v.union(v.literal("AM"), v.literal("PM")),
    date: v.string(),
    litres: v.number(),
    loggedBy: v.id("users"),
    flagged: v.boolean(),
  },
  handler: async (ctx, args) => {
    const res = await logProductionRecordInternal(ctx, {
      livestockId: args.livestockId,
      type: "milk",
      amount: args.litres,
      session: args.session,
      date: args.date,
      flagged: args.flagged,
    });
    return {
      success: res.success,
      sessionId: res.recordId,
      flagged: res.flagged,
      message: res.message,
    };
  },
});

export const getMilkingAudit = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;
    return await ctx.db.query("productionRecords").order("desc").take(limit);
  },
});

// --- 6. Birth Events & Offspring / Calvings & Calves ---
export const listCalvings = query({
  args: {},
  handler: async (ctx) => {
    const events = await ctx.db.query("birthEvents").order("desc").collect();
    return events.map(e => ({
      _id: e._id,
      _creationTime: e._creationTime,
      cowId: e.parentId,
      date: e.date,
      calfSex: e.offspringSex === "mixed" || e.offspringSex === "unknown" ? "F" : e.offspringSex,
      calfTagNumber: null,
      sireInfo: "",
      complications: e.complications,
      notes: e.notes,
    }));
  },
});

export const listCalves = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("offspring").order("desc").collect();
  },
});

async function logBirthEventInternal(ctx: any, args: {
  parentId: any;
  date: number;
  offspringCount: number;
  offspringSex: "M" | "F" | "mixed" | "unknown";
  complications: string;
  notes: string;
  offspringTagNumber?: string;
}) {
  await enforceRole(ctx, ["worker", "manager"]);
  const birthEventId = await ctx.db.insert("birthEvents", {
    parentId: args.parentId,
    date: args.date,
    offspringCount: args.offspringCount,
    offspringSex: args.offspringSex,
    complications: args.complications,
    notes: args.notes,
  });

  const parentTable = ctx.db.normalizeId("livestock", args.parentId);
  let damTag = "EL-UNKNOWN";
  let species = "cattle";
  let sireInfo = "Unknown";
  if (parentTable) {
    const parent = await ctx.db.get(parentTable);
    if (parent) {
      damTag = parent.tagNumber;
      species = parent.species;
      sireInfo = parent.sireInfo || "Unknown";
      await ctx.db.patch(parentTable, {
        lastBirthDate: args.date,
        currentLactationNumber: parent.currentLactationNumber + 1,
      });
    }
  }

  if (args.offspringTagNumber) {
    await ctx.db.insert("offspring", {
      tagNumber: args.offspringTagNumber,
      species,
      name: `${species.toUpperCase()} Offspring`,
      dateOfBirth: args.date,
      sex: args.offspringSex === "mixed" || args.offspringSex === "unknown" ? "F" : args.offspringSex,
      damTagNumber: damTag,
      sireInfo,
      weaningDate: null,
      currentWeight: 35,
      status: "young",
    });
  }

  return birthEventId;
}

export const logBirthEvent = mutation({
  args: {
    parentId: v.union(v.id("livestock"), v.id("livestockGroups")),
    date: v.number(),
    offspringCount: v.number(),
    offspringSex: v.union(v.literal("M"), v.literal("F"), v.literal("mixed"), v.literal("unknown")),
    complications: v.string(),
    notes: v.string(),
    offspringTagNumber: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await logBirthEventInternal(ctx, args);
  },
});

export const registerCalving = mutation({
  args: {
    livestockId: v.id("livestock"),
    date: v.number(),
    calfSex: v.union(v.literal("M"), v.literal("F")),
    calfTagNumber: v.union(v.string(), v.null()),
    sireInfo: v.string(),
    complications: v.string(),
    notes: v.string(),
  },
  handler: async (ctx, args) => {
    return await logBirthEventInternal(ctx, {
      parentId: args.livestockId,
      date: args.date,
      offspringCount: 1,
      offspringSex: args.calfSex,
      complications: args.complications,
      notes: args.notes,
      offspringTagNumber: args.calfTagNumber || undefined,
    });
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
    livestockId: v.optional(v.id("livestock")),
    cowId: v.optional(v.id("livestock" as any)),
    groupId: v.optional(v.id("livestockGroups")),
    incidentId: v.optional(v.id("incidents")),
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
    
    const targetId = args.livestockId || args.cowId;

    if (targetId) {
      await ctx.db.patch(targetId, {
        status: "treatment",
      });
    }

    if (args.incidentId) {
      await ctx.db.patch(args.incidentId, {
        status: "investigating",
        notes: `Treatment initiated: Administered ${args.drugAdministered} (${args.dosage}) by staff.`,
      });
    }

    return await ctx.db.insert("treatments", {
      livestockId: targetId,
      groupId: args.groupId,
      incidentId: args.incidentId,
      date: args.date,
      condition: args.condition,
      drugAdministered: args.drugAdministered,
      dosage: args.dosage,
      withholdingDays: args.withholdingDays,
      withholdingUntil,
      administeredBy: args.administeredBy,
      notes: args.notes,
    });
  },
});

// --- 8. Breeding & Services ---
export const listServices = query({
  args: {},
  handler: async (ctx) => {
    const list = await ctx.db.query("breedingServices").order("desc").collect();
    return list.map(s => ({
      _id: s._id,
      _creationTime: s._creationTime,
      cowId: s.livestockId,
      date: s.date,
      type: s.type,
      bullOrSemenCode: s.bullOrSemenCode,
      performedBy: s.performedBy,
      notes: s.notes,
    }));
  },
});

export const logService = mutation({
  args: {
    livestockId: v.id("livestock"),
    date: v.number(),
    type: v.union(v.literal("AI"), v.literal("natural")),
    bullOrSemenCode: v.string(),
    performedBy: v.id("users"),
    notes: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("breedingServices", {
      livestockId: args.livestockId,
      date: args.date,
      type: args.type,
      bullOrSemenCode: args.bullOrSemenCode,
      performedBy: args.performedBy,
      notes: args.notes,
    });
  },
});

export const listPregnancyDiagnoses = query({
  args: {},
  handler: async (ctx) => {
    const list = await ctx.db.query("pregnancyChecks").order("desc").collect();
    return list.map(p => ({
      _id: p._id,
      _creationTime: p._creationTime,
      cowId: p.livestockId,
      date: p.date,
      result: p.result,
      expectedCalvingDate: p.expectedCalvingDate,
      performedBy: p.performedBy,
    }));
  },
});

export const logPregnancyDiagnosis = mutation({
  args: {
    livestockId: v.id("livestock"),
    date: v.number(),
    result: v.union(v.literal("pregnant"), v.literal("open"), v.literal("uncertain")),
    expectedCalvingDate: v.union(v.number(), v.null()),
    performedBy: v.id("users"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("pregnancyChecks", {
      livestockId: args.livestockId,
      date: args.date,
      result: args.result,
      expectedCalvingDate: args.expectedCalvingDate,
      performedBy: args.performedBy,
    });
  },
});

// --- New Generalized Animal & Soil Quality Actions ---
export const registerLivestock = mutation({
  args: {
    tagNumber: v.string(),
    name: v.string(),
    species: v.union(v.literal("cattle"), v.literal("goat"), v.literal("sheep"), v.literal("pig"), v.literal("other")),
    breed: v.string(),
    dateOfBirth: v.number(),
    sex: v.union(v.literal("M"), v.literal("F")),
    status: v.union(v.literal("milking"), v.literal("dry"), v.literal("treatment"), v.literal("young"), v.literal("sold"), v.literal("deceased")),
    currentLactationNumber: v.number(),
    lastBirthDate: v.union(v.number(), v.null()),
    sireInfo: v.string(),
    damTagNumber: v.string(),
    notes: v.string(),
  },
  handler: async (ctx, args) => {
    await enforceRole(ctx, ["worker", "manager"]);
    const existing = await ctx.db
      .query("livestock")
      .withIndex("by_tag", (q) => q.eq("tagNumber", args.tagNumber))
      .unique();
    if (existing) {
      throw new Error(`Livestock with tag number ${args.tagNumber} already exists`);
    }
    return await ctx.db.insert("livestock", args);
  },
});

export const registerLivestockGroup = mutation({
  args: {
    groupCode: v.string(),
    name: v.string(),
    species: v.union(v.literal("poultry"), v.literal("bees"), v.literal("other")),
    breed: v.string(),
    status: v.union(v.literal("active"), v.literal("sold"), v.literal("deceased")),
    count: v.number(),
    dateAcquiredOrHatched: v.number(),
    notes: v.string(),
  },
  handler: async (ctx, args) => {
    await enforceRole(ctx, ["worker", "manager"]);
    const existing = await ctx.db
      .query("livestockGroups")
      .withIndex("by_group_code", (q) => q.eq("groupCode", args.groupCode))
      .unique();
    if (existing) {
      throw new Error(`Livestock group with code ${args.groupCode} already exists`);
    }
    return await ctx.db.insert("livestockGroups", args);
  },
});

export const promoteOffspring = mutation({
  args: {
    offspringId: v.id("offspring"),
    status: v.union(v.literal("milking"), v.literal("dry"), v.literal("treatment")),
    newTagNumber: v.string(),
  },
  handler: async (ctx, args) => {
    await enforceRole(ctx, ["manager"]);
    const off = await ctx.db.get(args.offspringId);
    if (!off) throw new Error("Offspring not found");
    if (off.status === "promoted") throw new Error("Offspring already promoted");

    await ctx.db.patch(args.offspringId, {
      status: "promoted",
    });

    return await ctx.db.insert("livestock", {
      tagNumber: args.newTagNumber,
      name: off.name,
      species: off.species as any,
      breed: "Crossbred",
      dateOfBirth: off.dateOfBirth,
      sex: off.sex === "unknown" ? "F" : off.sex as any,
      status: args.status,
      currentLactationNumber: 0,
      lastBirthDate: null,
      sireInfo: off.sireInfo,
      damTagNumber: off.damTagNumber,
      notes: `Promoted from offspring registry. Initial weaning: ${off.weaningDate ? new Date(off.weaningDate).toLocaleDateString() : 'N/A'}.`,
    });
  },
});

export const logSoilTest = mutation({
  args: {
    fieldId: v.id("fields"),
    date: v.number(),
    ph: v.number(),
    nitrogen: v.union(v.literal("low"), v.literal("medium"), v.literal("high")),
    phosphorus: v.union(v.literal("low"), v.literal("medium"), v.literal("high")),
    potassium: v.union(v.literal("low"), v.literal("medium"), v.literal("high")),
    recommendations: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await enforceRole(ctx, ["worker", "manager"]);
    return await ctx.db.insert("soilTests", {
      ...args,
      testedBy: user._id,
    });
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
    cowId: v.optional(v.id("livestock" as any)),
    livestockId: v.optional(v.id("livestock")),
    description: v.string(),
    reportedBy: v.id("users"),
    severity: v.union(v.literal("low"), v.literal("medium"), v.literal("critical")),
    notes: v.string(),
  },
  handler: async (ctx, args) => {
    const { cowId, livestockId, ...rest } = args;
    const targetLivestockId = livestockId || cowId;
    return await ctx.db.insert("incidents", {
      ...rest,
      livestockId: targetLivestockId as any,
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
    await enforceRole(ctx, ["supervisor", "manager"]);
    const tables = [
      "fields",
      "fieldApplications",
      "harvestRecords",
      "contracts",
      "deliveries",
      "feedInventory",
      "vetInventory",
      "tasks",
      "inventoryMovementsLegacy",
      "livestock",
      "livestockGroups",
      "productionRecords",
      "treatments",
      "breedingServices",
      "pregnancyChecks",
      "birthEvents",
      "offspring",
      "soilTests",
      "incidents",
      "machinery",
      "machineryMaintenance",
      "rainfall",
      "financialTransactions",
      "requests",
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

export const healCow = mutation({
  args: {
    livestockId: v.id("livestock"),
    incidentId: v.optional(v.id("incidents")),
    notes: v.string(),
  },
  handler: async (ctx, args) => {
    await enforceRole(ctx, ["manager"]);
    const animal = await ctx.db.get(args.livestockId);
    if (!animal) throw new Error("Livestock not found");
    const newStatus = (animal.species === "cattle" || animal.species === "goat") ? "milking" : "dry";
    await ctx.db.patch(args.livestockId, {
      status: newStatus as any,
    });
    if (args.incidentId) {
      await ctx.db.patch(args.incidentId, {
        status: "resolved",
        resolvedAt: Date.now(),
        notes: args.notes || "Animal verified healed.",
      });
    } else {
      const incidents = await ctx.db.query("incidents").collect();
      const animalIncidents = incidents.filter(i => i.livestockId === args.livestockId && i.status !== "resolved");
      for (const inc of animalIncidents) {
        await ctx.db.patch(inc._id, {
          status: "resolved",
          resolvedAt: Date.now(),
          notes: args.notes || "Animal verified healed.",
        });
      }
    }
    return { success: true };
  },
});

export const healLivestock = healCow;

