import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

export default defineSchema({
  ...authTables,
  users: defineTable({
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    image: v.optional(v.string()),
    role: v.optional(v.union(v.literal("owner"), v.literal("manager"), v.literal("worker"))), // Keep owner for transitional read compatibility
    phone: v.optional(v.string()),
    joinedAt: v.optional(v.number()),
    profileSetupComplete: v.optional(v.boolean()),
  }).index("by_email", ["email"]),
  

  cows: defineTable({
    tagNumber: v.string(),
    name: v.string(),
    breed: v.string(),
    dateOfBirth: v.number(),
    status: v.union(v.literal("milking"), v.literal("dry"), v.literal("treatment"), v.literal("calf"), v.literal("sold"), v.literal("deceased")),
    currentLactationNumber: v.number(),
    lastCalvingDate: v.union(v.number(), v.null()),
    sireInfo: v.string(),
    damTagNumber: v.string(),
    notes: v.string(),
  })
    .index("by_status", ["status"])
    .index("by_tag", ["tagNumber"]),

  milkingSessions: defineTable({
    cowId: v.id("cows"),
    session: v.union(v.literal("AM"), v.literal("PM")),
    date: v.string(), // YYYY-MM-DD
    litres: v.number(),
    loggedBy: v.id("users"),
    loggedAt: v.number(),
    flagged: v.boolean(),
  })
    .index("by_cow_and_date", ["cowId", "date"])
    .index("by_date", ["date"]),

  treatments: defineTable({
    cowId: v.id("cows"),
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
    .index("by_cow", ["cowId"])
    .index("by_withholding_until", ["withholdingUntil"]),

  services: defineTable({
    cowId: v.id("cows"),
    date: v.number(),
    type: v.union(v.literal("AI"), v.literal("natural")),
    bullOrSemenCode: v.string(),
    performedBy: v.id("users"),
    notes: v.string(),
  }).index("by_cow", ["cowId"]),

  pregnancyDiagnoses: defineTable({
    cowId: v.id("cows"),
    date: v.number(),
    result: v.union(v.literal("pregnant"), v.literal("open"), v.literal("uncertain")),
    expectedCalvingDate: v.union(v.number(), v.null()),
    performedBy: v.id("users"),
  }).index("by_cow", ["cowId"]),

  calvings: defineTable({
    cowId: v.id("cows"),
    date: v.number(),
    calfSex: v.union(v.literal("M"), v.literal("F")),
    calfTagNumber: v.union(v.string(), v.null()),
    sireInfo: v.string(),
    complications: v.string(),
    notes: v.string(),
  }).index("by_cow", ["cowId"]),

  calves: defineTable({
    tagNumber: v.string(),
    name: v.string(),
    dateOfBirth: v.number(),
    sex: v.union(v.literal("M"), v.literal("F")),
    damTagNumber: v.string(),
    sireInfo: v.string(),
    weaningDate: v.union(v.number(), v.null()),
    currentWeight: v.number(),
    status: v.string(),
  }).index("by_tag", ["tagNumber"]),

  fields: defineTable({
    name: v.string(),
    crop: v.union(v.literal("wheat"), v.literal("barley"), v.literal("maize"), v.literal("lucerne"), v.literal("fallow")),
    acres: v.number(),
    plantedDate: v.union(v.number(), v.null()),
    expectedHarvestDate: v.union(v.number(), v.null()),
    notes: v.string(),
  }),

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
    cowId: v.optional(v.id("cows")),
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
    performedBy: v.string(), // Legacy format
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
