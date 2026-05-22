import { Password } from "@convex-dev/auth/providers/Password";
import { convexAuth } from "@convex-dev/auth/server";

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [
    Password({
      profile(params) {
        return {
          email: params.email as string,
          name: (params.name as string) || "",
          role: (params.role as string) || "worker",
        };
      },
      validatePasswordRequirements(password) {
        if (!password || password.length < 4) {
          throw new Error("Password must be at least 4 characters long.");
        }
      },
    }),
  ],
  callbacks: {
    async createOrUpdateUser(ctx, args) {
      if (args.existingUserId) {
        const user = await ctx.db.get(args.existingUserId);
        if (user !== null) {
          return args.existingUserId;
        }
      }
      if (args.profile.email) {
        const existingUser = await (ctx.db
          .query("users") as any)
          .withIndex("by_email", (q: any) => q.eq("email", args.profile.email))
          .unique();
        if (existingUser) {
          return existingUser._id;
        }
      }
      return await ctx.db.insert("users", {
        email: args.profile.email,
        name: args.profile.name,
        role: (args.profile.role as any) || "worker",
        joinedAt: Date.now(),
      });
    },
  },
});

export async function enforceRole(ctx: any, allowedRoles: ("supervisor" | "manager" | "worker")[]) {
  const userId = await auth.getUserId(ctx);
  if (userId === null) {
    throw new Error("[Auth] Access denied: Unauthenticated session");
  }
  const user = await ctx.db.get(userId);
  if (!user || !user.role || !allowedRoles.includes(user.role)) {
    throw new Error(`[Auth] Access denied: Required role: ${allowedRoles.join(" or ")}, found: ${user?.role || "none"}`);
  }
  return user;
}
