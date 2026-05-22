import { query } from "./_generated/server";
import { v } from "convex/values";

// List all cows (livestock of species cattle), optionally filtering by status
export const list = query({
  args: {
    status: v.optional(
      v.union(
        v.literal("milking"),
        v.literal("dry"),
        v.literal("treatment"),
        v.literal("calf"),
        v.literal("sold"),
        v.literal("deceased")
      )
    ),
  },
  handler: async (ctx, args) => {
    let query = ctx.db.query("livestock");
    let results = await query.collect();
    
    // Filter to only cattle
    results = results.filter(item => item.species === "cattle");

    if (args.status !== undefined) {
      // Map legacy "calf" status to "young" in the new generalized table
      const newStatus = args.status === "calf" ? "young" : args.status;
      results = results.filter(item => item.status === newStatus);
    }
    
    return results;
  },
});

// Get a single cow profile by tag number
export const getByTag = query({
  args: {
    tagNumber: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("livestock")
      .withIndex("by_tag", (q) => q.eq("tagNumber", args.tagNumber))
      .unique();
  },
});

// Get recent milking sessions for a cow
export const getMilkingHistory = query({
  args: {
    cowId: v.id("livestock" as any),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 30;
    return await ctx.db
      .query("productionRecords")
      .withIndex("by_livestock_and_date", (q) => q.eq("livestockId", args.cowId as any))
      .order("desc")
      .take(limit);
  },
});

// Get calving history for a cow
export const getCalvings = query({
  args: {
    cowId: v.id("livestock" as any),
  },
  handler: async (ctx, args) => {
    const events = await ctx.db
      .query("birthEvents")
      .withIndex("by_parent", (q) => q.eq("parentId", args.cowId as any))
      .order("desc")
      .collect();

    // Map to legacy calvings output type
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

// Get treatment history for a cow
export const getTreatments = query({
  args: {
    cowId: v.id("livestock" as any),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("treatments")
      .withIndex("by_livestock", (q) => q.eq("livestockId", args.cowId as any))
      .order("desc")
      .collect();
  },
});

// Get active withholdings list (cows with withholdingUntil > now)
export const getActiveWithholdings = query({
  args: {
    now: v.number(),
  },
  handler: async (ctx, args) => {
    const activeTreatments = await ctx.db
      .query("treatments")
      .withIndex("by_withholding_until", (q) => q.gt("withholdingUntil", args.now))
      .collect();

    const result = [];
    for (const t of activeTreatments) {
      if (t.livestockId) {
        const animal = await ctx.db.get(t.livestockId);
        if (animal && animal.species === "cattle" && animal.status === "treatment") {
          result.push({
            treatment: t,
            cow: animal,
          });
        }
      }
    }
    return result;
  },
});

// Optimized dashboard query returning cows with their active withholding status and yesterday's yield
export const getHerdDashboard = query({
  args: {
    now: v.number(),
    yesterdayDateStr: v.string(), // YYYY-MM-DD format
  },
  handler: async (ctx, args) => {
    // 1. Fetch all livestock of species cattle
    let livestock = await ctx.db.query("livestock").collect();
    const cows = livestock.filter(item => item.species === "cattle");

    // 2. Fetch all active withholdings
    const activeTreatments = await ctx.db
      .query("treatments")
      .withIndex("by_withholding_until", (q) => q.gt("withholdingUntil", args.now))
      .collect();

    const withholdingMap = new Map<string, number>();
    for (const t of activeTreatments) {
      if (t.livestockId) {
        const current = withholdingMap.get(t.livestockId) ?? 0;
        if (t.withholdingUntil > current) {
          withholdingMap.set(t.livestockId, t.withholdingUntil);
        }
      }
    }

    // 3. Fetch yesterday's production records
    const sessions = await ctx.db
      .query("productionRecords")
      .withIndex("by_date", (q) => q.eq("date", args.yesterdayDateStr))
      .collect();

    const yieldMap = new Map<string, number>();
    for (const s of sessions) {
      if (s.livestockId) {
        const current = yieldMap.get(s.livestockId) ?? 0;
        yieldMap.set(s.livestockId, current + s.amount);
      }
    }

    // 4. Map them together
    return cows.map((cow) => {
      const withholdingUntil = withholdingMap.get(cow._id) ?? null;
      const yesterdayYield = yieldMap.get(cow._id) ?? 0;
      return {
        ...cow,
        isWithholding: withholdingUntil !== null,
        withholdingUntil,
        yesterdayYield,
      };
    });
  },
});
