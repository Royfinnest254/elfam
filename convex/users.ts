import { query, mutation } from "./_generated/server";
import { auth, enforceRole } from "./auth";
import { v } from "convex/values";

// Get the current logged-in user profile
export const viewer = query({
  args: {},
  handler: async (ctx) => {
    const userId = await auth.getUserId(ctx);
    if (userId === null) {
      return null;
    }
    return await ctx.db.get(userId);
  },
});

// A query to list all users (e.g. for selection or logging purposes) - Manager only
export const list = query({
  args: {},
  handler: async (ctx) => {
    await enforceRole(ctx, ["manager"]);
    return await ctx.db.query("users").collect();
  },
});

import { modifyAccountCredentials } from "@convex-dev/auth/server";

// A mutation to update the user's password securely
export const changePassword = mutation({
  args: {
    password: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (userId === null) {
      throw new Error("[Auth] changePassword failed: Unauthenticated session");
    }
    const userDoc = await ctx.db.get(userId);
    if (!userDoc || !userDoc.email) {
      throw new Error("[Auth] changePassword failed: User email not found");
    }
    
    if (args.password.length < 6) {
      throw new Error("[Auth] changePassword failed: password must be at least 6 characters long");
    }

    await modifyAccountCredentials(ctx as any, {
      provider: "password",
      account: {
        id: userDoc.email,
        secret: args.password,
      },
    });
  },
});
