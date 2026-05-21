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
    const user = await ctx.db.get(userId);
    if (!user) {
      return null;
    }
    let imageUrl: string | undefined = undefined;
    if (user.image) {
      try {
        const url = await ctx.storage.getUrl(user.image);
        if (url) {
          imageUrl = url;
        }
      } catch (err) {
        console.error("Failed to get storage URL for user image", err);
      }
    }
    return { ...user, imageUrl };
  },
});

// Generate an upload URL for PFP
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await auth.getUserId(ctx);
    if (userId === null) {
      throw new Error("[Auth] generateUploadUrl failed: Unauthenticated session");
    }
    return await ctx.storage.generateUploadUrl();
  },
});

// Update the user's profile details
export const updateProfile = mutation({
  args: {
    name: v.string(),
    phone: v.string(),
    image: v.optional(v.string()), // storageId
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (userId === null) {
      throw new Error("[Auth] updateProfile failed: Unauthenticated session");
    }
    const updateData: any = {
      name: args.name,
      phone: args.phone,
      profileSetupComplete: true,
    };
    if (args.image !== undefined) {
      updateData.image = args.image;
    }
    await ctx.db.patch(userId, updateData);
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
