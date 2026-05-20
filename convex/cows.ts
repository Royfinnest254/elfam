import { query } from "./_generated/server";
import { v } from "convex/values";

// List all cows, optionally filtering by status
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
    let query = ctx.db.query("cows");
    if (args.status !== undefined) {
      return await query
        .withIndex("by_status", (q) => q.eq("status", args.status!))
        .collect();
    }
    return await query.collect();
  },
});

// Get a single cow profile by tag number
export const getByTag = query({
  args: {
    tagNumber: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("cows")
      .withIndex("by_tag", (q) => q.eq("tagNumber", args.tagNumber))
      .unique();
  },
});

// Get recent milking sessions for a cow
export const getMilkingHistory = query({
  args: {
    cowId: v.id("cows"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 30;
    return await ctx.db
      .query("milkingSessions")
      .withIndex("by_cow_and_date", (q) => q.eq("cowId", args.cowId))
      .order("desc")
      .take(limit);
  },
});

// Get calving history for a cow
export const getCalvings = query({
  args: {
    cowId: v.id("cows"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("calvings")
      .withIndex("by_cow", (q) => q.eq("cowId", args.cowId))
      .order("desc")
      .collect();
  },
});

// Get treatment history for a cow
export const getTreatments = query({
  args: {
    cowId: v.id("cows"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("treatments")
      .withIndex("by_cow", (q) => q.eq("cowId", args.cowId))
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

    // Map treatments to cow details in batch
    const cowIds = Array.from(new Set(activeTreatments.map((t) => t.cowId)));
    const cows = await Promise.all(cowIds.map((id) => ctx.db.get(id)));
    const cowMap = new Map(cows.filter(Boolean).map((c) => [c!._id, c!]));

    const result = [];
    for (const t of activeTreatments) {
      const cow = cowMap.get(t.cowId);
      if (cow && cow.status === "treatment") {
        result.push({
          treatment: t,
          cow,
        });
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
    // 1. Fetch all cows
    const cows = await ctx.db.query("cows").collect();

    // 2. Fetch all active withholdings in a single query
    const activeTreatments = await ctx.db
      .query("treatments")
      .withIndex("by_withholding_until", (q) => q.gt("withholdingUntil", args.now))
      .collect();

    const withholdingMap = new Map<string, number>();
    for (const t of activeTreatments) {
      const current = withholdingMap.get(t.cowId) ?? 0;
      if (t.withholdingUntil > current) {
        withholdingMap.set(t.cowId, t.withholdingUntil);
      }
    }

    // 3. Fetch yesterday's milking sessions in a single query
    const sessions = await ctx.db
      .query("milkingSessions")
      .withIndex("by_date", (q) => q.eq("date", args.yesterdayDateStr))
      .collect();

    const yieldMap = new Map<string, number>();
    for (const s of sessions) {
      const current = yieldMap.get(s.cowId) ?? 0;
      yieldMap.set(s.cowId, current + s.litres);
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
