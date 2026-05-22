import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// List all individual livestock, optionally filtering by status and species
export const list = query({
  args: {
    status: v.optional(
      v.union(
        v.literal("milking"),
        v.literal("dry"),
        v.literal("treatment"),
        v.literal("young"),
        v.literal("sold"),
        v.literal("deceased")
      )
    ),
    species: v.optional(
      v.union(v.literal("cattle"), v.literal("goat"), v.literal("sheep"), v.literal("pig"), v.literal("other"))
    ),
  },
  handler: async (ctx, args) => {
    let query = ctx.db.query("livestock");
    if (args.status !== undefined && args.species !== undefined) {
      // Filter by both
      const all = await query.withIndex("by_status", (q) => q.eq("status", args.status!)).collect();
      return all.filter((item) => item.species === args.species);
    } else if (args.status !== undefined) {
      return await query.withIndex("by_status", (q) => q.eq("status", args.status!)).collect();
    } else if (args.species !== undefined) {
      const all = await query.collect();
      return all.filter((item) => item.species === args.species);
    }
    return await query.collect();
  },
});

// List all group livestock (poultry, bees, etc.)
export const listGroups = query({
  args: {
    species: v.optional(v.union(v.literal("poultry"), v.literal("bees"), v.literal("other"))),
  },
  handler: async (ctx, args) => {
    let query = ctx.db.query("livestockGroups");
    if (args.species !== undefined) {
      const all = await query.collect();
      return all.filter((item) => item.species === args.species);
    }
    return await query.collect();
  },
});

// Get a single animal profile by tag number (checks both livestock and offspring)
export const getByTag = query({
  args: {
    tagNumber: v.string(),
  },
  handler: async (ctx, args) => {
    const animal = await ctx.db
      .query("livestock")
      .withIndex("by_tag", (q) => q.eq("tagNumber", args.tagNumber))
      .unique();
    if (animal) {
      return { ...animal, isOffspring: false };
    }
    const off = await ctx.db
      .query("offspring")
      .withIndex("by_tag", (q) => q.eq("tagNumber", args.tagNumber))
      .unique();
    if (off) {
      return {
        _id: off._id,
        _creationTime: off._creationTime,
        tagNumber: off.tagNumber,
        name: off.name,
        species: off.species,
        breed: "Young Cohort",
        dateOfBirth: off.dateOfBirth,
        sex: off.sex === "unknown" ? "F" : off.sex,
        status: off.status,
        currentLactationNumber: 0,
        lastBirthDate: null,
        sireInfo: off.sireInfo,
        damTagNumber: off.damTagNumber,
        notes: `Weaning: ${off.weaningDate ? new Date(off.weaningDate).toLocaleDateString("en-GB") : "N/A"}. Current weight: ${off.currentWeight} kg.`,
        weaningDate: off.weaningDate,
        currentWeight: off.currentWeight,
        isOffspring: true,
      };
    }
    return null;
  },
});

// Get a single group profile by code
export const getGroupByCode = query({
  args: {
    groupCode: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("livestockGroups")
      .withIndex("by_group_code", (q) => q.eq("groupCode", args.groupCode))
      .unique();
  },
});

// Get recent production records for an individual animal or group
export const getProductionHistory = query({
  args: {
    livestockId: v.optional(v.id("livestock")),
    groupId: v.optional(v.id("livestockGroups")),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 30;
    if (args.livestockId) {
      return await ctx.db
        .query("productionRecords")
        .withIndex("by_livestock_and_date", (q) => q.eq("livestockId", args.livestockId))
        .order("desc")
        .take(limit);
    } else if (args.groupId) {
      return await ctx.db
        .query("productionRecords")
        .withIndex("by_group_and_date", (q) => q.eq("groupId", args.groupId))
        .order("desc")
        .take(limit);
    }
    return [];
  },
});

// Get birth events for parent
export const getBirthEvents = query({
  args: {
    parentId: v.union(v.id("livestock"), v.id("livestockGroups")),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("birthEvents")
      .withIndex("by_parent", (q) => q.eq("parentId", args.parentId))
      .order("desc")
      .collect();
  },
});

// Get treatment history for an animal or group
export const getTreatments = query({
  args: {
    livestockId: v.optional(v.id("livestock")),
    groupId: v.optional(v.id("livestockGroups")),
  },
  handler: async (ctx, args) => {
    if (args.livestockId) {
      return await ctx.db
        .query("treatments")
        .withIndex("by_livestock", (q) => q.eq("livestockId", args.livestockId))
        .order("desc")
        .collect();
    } else if (args.groupId) {
      return await ctx.db
        .query("treatments")
        .withIndex("by_group", (q) => q.eq("groupId", args.groupId))
        .order("desc")
        .collect();
    }
    return [];
  },
});

// Get active withholdings list
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
        if (animal && animal.status === "treatment") {
          result.push({
            treatment: t,
            livestock: animal,
            type: "individual",
          });
        }
      } else if (t.groupId) {
        const group = await ctx.db.get(t.groupId);
        result.push({
          treatment: t,
          group,
          type: "group",
        });
      }
    }
    return result;
  },
});

// Optimized dashboard query returning livestock with active withholding status and yesterday's yield
export const getLivestockDashboard = query({
  args: {
    now: v.number(),
    yesterdayDateStr: v.string(), // YYYY-MM-DD format
  },
  handler: async (ctx, args) => {
    const livestock = await ctx.db.query("livestock").collect();
    const groups = await ctx.db.query("livestockGroups").collect();

    // Active treatments for withholdings
    const activeTreatments = await ctx.db
      .query("treatments")
      .withIndex("by_withholding_until", (q) => q.gt("withholdingUntil", args.now))
      .collect();

    const withholdingMap = new Map<string, number>();
    const groupWithholdingMap = new Map<string, number>();
    for (const t of activeTreatments) {
      if (t.livestockId) {
        const current = withholdingMap.get(t.livestockId) ?? 0;
        if (t.withholdingUntil > current) withholdingMap.set(t.livestockId, t.withholdingUntil);
      } else if (t.groupId) {
        const current = groupWithholdingMap.get(t.groupId) ?? 0;
        if (t.withholdingUntil > current) groupWithholdingMap.set(t.groupId, t.withholdingUntil);
      }
    }

    // Yesterday's production records
    const production = await ctx.db
      .query("productionRecords")
      .withIndex("by_date", (q) => q.eq("date", args.yesterdayDateStr))
      .collect();

    const individualYieldMap = new Map<string, number>();
    const groupYieldMap = new Map<string, number>();
    for (const p of production) {
      if (p.livestockId) {
        const current = individualYieldMap.get(p.livestockId) ?? 0;
        individualYieldMap.set(p.livestockId, current + p.amount);
      } else if (p.groupId) {
        const current = groupYieldMap.get(p.groupId) ?? 0;
        groupYieldMap.set(p.groupId, current + p.amount);
      }
    }

    const mappedIndividual = livestock.map((animal) => {
      const withholdingUntil = withholdingMap.get(animal._id) ?? null;
      const yesterdayYield = individualYieldMap.get(animal._id) ?? 0;
      return {
        ...animal,
        isWithholding: withholdingUntil !== null,
        withholdingUntil,
        yesterdayYield,
      };
    });

    const mappedGroups = groups.map((group) => {
      const withholdingUntil = groupWithholdingMap.get(group._id) ?? null;
      const yesterdayYield = groupYieldMap.get(group._id) ?? 0;
      return {
        ...group,
        isWithholding: withholdingUntil !== null,
        withholdingUntil,
        yesterdayYield,
      };
    });

    return {
      individual: mappedIndividual,
      groups: mappedGroups,
    };
  },
});
