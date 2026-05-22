import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

export default defineSchema({
  ...authTables,
  users: defineTable({
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    image: v.optional(v.string()),
    role: v.optional(v.union(v.literal("supervisor"), v.literal("manager"), v.literal("worker"))),
    phone: v.optional(v.string()),
    joinedAt: v.optional(v.number()),
    profileSetupComplete: v.optional(v.boolean()),
  }).index("by_email", ["email"]),

  livestock: defineTable({
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
  })
    .index("by_status", ["status"])
    .index("by_tag", ["tagNumber"]),

  livestockGroups: defineTable({
    groupCode: v.string(),
    name: v.string(),
    species: v.union(v.literal("poultry"), v.literal("bees"), v.literal("other")),
    breed: v.string(),
    status: v.union(v.literal("active"), v.literal("sold"), v.literal("deceased")),
    count: v.number(),
    dateAcquiredOrHatched: v.number(),
    notes: v.string(),
  }).index("by_group_code", ["groupCode"]),

  productionRecords: defineTable({
    livestockId: v.optional(v.id("livestock")),
    groupId: v.optional(v.id("livestockGroups")),
    type: v.union(v.literal("milk"), v.literal("eggs"), v.literal("wool"), v.literal("honey"), v.literal("weight")),
    amount: v.number(),
    session: v.optional(v.union(v.literal("AM"), v.literal("PM"))),
    date: v.string(), // YYYY-MM-DD
    loggedBy: v.id("users"),
    loggedAt: v.number(),
    flagged: v.boolean(),
  })
    .index("by_livestock_and_date", ["livestockId", "date"])
    .index("by_group_and_date", ["groupId", "date"])
    .index("by_date", ["date"]),

  treatments: defineTable({
    livestockId: v.optional(v.id("livestock")),
    groupId: v.optional(v.id("livestockGroups")),
    incidentId: v.optional(v.id("incidents")),
    date: v.number(),
    condition: v.string(),
    drugAdministered: v.string(),
    dosage: v.string(),
    withholdingDays: v.number(),
    withholdingUntil: v.number(),
    administeredBy: v.id("users"),
    notes: v.string(),
  })
    .index("by_livestock", ["livestockId"])
    .index("by_group", ["groupId"])
    .index("by_withholding_until", ["withholdingUntil"]),

  breedingServices: defineTable({
    livestockId: v.id("livestock"),
    date: v.number(),
    type: v.union(v.literal("AI"), v.literal("natural")),
    bullOrSemenCode: v.string(),
    performedBy: v.id("users"),
    notes: v.string(),
  }).index("by_livestock", ["livestockId"]),

  pregnancyChecks: defineTable({
    livestockId: v.id("livestock"),
    date: v.number(),
    result: v.union(v.literal("pregnant"), v.literal("open"), v.literal("uncertain")),
    expectedCalvingDate: v.union(v.number(), v.null()),
    performedBy: v.id("users"),
  }).index("by_livestock", ["livestockId"]),

  birthEvents: defineTable({
    parentId: v.union(v.id("livestock"), v.id("livestockGroups")),
    date: v.number(),
    offspringCount: v.number(),
    offspringSex: v.union(v.literal("M"), v.literal("F"), v.literal("mixed"), v.literal("unknown")),
    complications: v.string(),
    notes: v.string(),
  }).index("by_parent", ["parentId"]),

  offspring: defineTable({
    tagNumber: v.string(),
    species: v.string(),
    name: v.string(),
    dateOfBirth: v.number(),
    sex: v.union(v.literal("M"), v.literal("F"), v.literal("unknown")),
    damTagNumber: v.string(),
    sireInfo: v.string(),
    weaningDate: v.union(v.number(), v.null()),
    currentWeight: v.number(),
    status: v.string(), // "young" | "promoted" | "sold" | "deceased"
  }).index("by_tag", ["tagNumber"]),

  fields: defineTable({
    name: v.string(),
    crop: v.union(v.literal("wheat"), v.literal("barley"), v.literal("maize"), v.literal("lucerne"), v.literal("fallow")),
    acres: v.number(),
    plantedDate: v.union(v.number(), v.null()),
    expectedHarvestDate: v.union(v.number(), v.null()),
    notes: v.string(),
  }),

  soilTests: defineTable({
    fieldId: v.id("fields"),
    date: v.number(),
    ph: v.number(),
    nitrogen: v.union(v.literal("low"), v.literal("medium"), v.literal("high")),
    phosphorus: v.union(v.literal("low"), v.literal("medium"), v.literal("high")),
    potassium: v.union(v.literal("low"), v.literal("medium"), v.literal("high")),
    recommendations: v.string(),
    testedBy: v.id("users"),
  }).index("by_field", ["fieldId"]),

  fieldApplications: defineTable({
    fieldId: v.id("fields"),
    date: v.number(),
    type: v.union(v.literal("fertilizer"), v.literal("herbicide"), v.literal("pesticide"), v.literal("seed")),
    product: v.string(),
    rate: v.string(),
    appliedBy: v.id("users"),
  }).index("by_field", ["fieldId"]),

  harvestRecords: defineTable({
    fieldId: v.id("fields"),
    date: v.number(),
    crop: v.string(),
    bags: v.number(),
    bagWeightKg: v.number(),
    notes: v.string(),
  }).index("by_field", ["fieldId"]),

  contracts: defineTable({
    buyer: v.string(),
    crop: v.union(v.literal("barley"), v.literal("wheat")),
    contractedBags: v.number(),
    pricePerBag: v.number(),
    season: v.string(),
    status: v.union(v.literal("active"), v.literal("fulfilled"), v.literal("cancelled")),
    signedDate: v.number(),
  }),

  deliveries: defineTable({
    contractId: v.id("contracts"),
    date: v.number(),
    bags: v.number(),
    vehicleRef: v.string(),
    notes: v.string(),
  }).index("by_contract", ["contractId"]),

  feedInventory: defineTable({
    type: v.union(v.literal("silage"), v.literal("concentrate"), v.literal("minerals"), v.literal("hay")),
    product: v.string(),
    quantity: v.number(),
    unit: v.union(v.literal("tonnes"), v.literal("bags"), v.literal("kg")),
    updatedAt: v.number(),
  }),

  vetInventory: defineTable({
    product: v.string(),
    category: v.union(v.literal("antibiotic"), v.literal("vaccine"), v.literal("dewormer"), v.literal("minerals"), v.literal("semen")),
    quantity: v.number(),
    unit: v.string(),
    lowStockThreshold: v.number(),
  }),

  tasks: defineTable({
    title: v.string(),
    description: v.string(),
    assignedTo: v.id("users"),
    assignedBy: v.id("users"),
    status: v.union(v.literal("pending"), v.literal("in_progress"), v.literal("done")),
    dueDate: v.number(),
    completedAt: v.union(v.number(), v.null()),
  }).index("by_assigned_to", ["assignedTo"]),

  inventoryMovementsLegacy: defineTable({
    itemId: v.string(),
    itemType: v.union(v.literal("feed"), v.literal("vet"), v.literal("machinery"), v.literal("general")),
    productName: v.string(),
    type: v.union(v.literal("restock"), v.literal("withdrawal")),
    quantity: v.number(),
    unit: v.string(),
    performedBy: v.id("users"),
    timestamp: v.number(),
    notes: v.string(),
  }).index("by_timestamp", ["timestamp"]),

  incidents: defineTable({
    title: v.string(),
    department: v.union(v.literal("dairy"), v.literal("cereal"), v.literal("machinery"), v.literal("infrastructure"), v.literal("general")),
    livestockId: v.optional(v.id("livestock")),
    description: v.string(),
    reportedBy: v.id("users"),
    reportedAt: v.number(),
    status: v.union(v.literal("open"), v.literal("investigating"), v.literal("resolved")),
    severity: v.union(v.literal("low"), v.literal("medium"), v.literal("critical")),
    resolvedAt: v.union(v.number(), v.null()),
    notes: v.string(),
  }).index("by_reported_at", ["reportedAt"]),

  machinery: defineTable({
    name: v.string(),
    type: v.union(v.literal("tractor"), v.literal("harvester"), v.literal("milking_pump"), v.literal("vehicle"), v.literal("tool"), v.literal("supply"), v.literal("other")),
    plateNumber: v.string(),
    status: v.union(v.literal("operational"), v.literal("maintenance"), v.literal("broken")),
    fuelType: v.union(v.literal("diesel"), v.literal("petrol"), v.literal("electric")),
    nextServiceDate: v.number(),
    notes: v.string(),
  }).index("by_status", ["status"]),

  machineryMaintenance: defineTable({
    machineryId: v.id("machinery"),
    date: v.number(),
    type: v.union(v.literal("routine"), v.literal("repair"), v.literal("overhaul")),
    description: v.string(),
    cost: v.number(),
    performedBy: v.string(),
    notes: v.string(),
  }).index("by_machinery", ["machineryId"]),

  rainfall: defineTable({
    date: v.string(), // YYYY-MM-DD
    amountMm: v.number(),
    recordedBy: v.id("users"),
    notes: v.string(),
  }).index("by_date", ["date"]),

  financialTransactions: defineTable({
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
  }).index("by_date", ["date"]),

  requests: defineTable({
    title: v.string(),
    category: v.union(v.literal("supplies"), v.literal("maintenance"), v.literal("other")),
    details: v.string(),
    requestedBy: v.id("users"),
    requestedByName: v.string(),
    requestedAt: v.number(),
    status: v.union(v.literal("pending"), v.literal("approved"), v.literal("rejected")),
    notes: v.optional(v.string()),
  }).index("by_status", ["status"]),
});
