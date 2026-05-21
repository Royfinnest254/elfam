"use client";

import React, { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { useAuthActions } from "@convex-dev/auth/react";
import { useRouter } from "next/navigation";

export default function WorkerSettingsPage() {
  const user = useQuery(api.users.viewer);
  const changePasswordMutation = useMutation(api.users.changePassword);
  const { signOut } = useAuthActions();
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!user?.email) {
      setError("User profile email not found.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    setLoading(true);
    try {
      await changePasswordMutation({ password });
      setSuccess("PASSWORD UPDATED SUCCESSFULLY");
      setPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to update password.");
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push("/signin");
    } catch (err) {
      console.error("[Auth] signOut failed:", err);
    }
  };

  if (user === undefined) {
    return (
      <div className="body-small text-muted italic p-4">
        Loading user settings...
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      <header className="border-b border-[#DADCE0] pb-4">
        <span className="label text-muted block mb-1">
          System Config
        </span>
        <h2>
          User Settings
        </h2>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        {/* Profile Card */}
        <div className="card space-y-4">
          <h3 className="border-b border-[#DADCE0] pb-2">
            Ledger Profile File
          </h3>

          <div className="space-y-3 body-small text-muted">
            <div className="flex justify-between border-b border-[#DADCE0] pb-2">
              <span className="label">Full Name</span>
              <span className="text-[#202124] font-medium">
                {user?.name ?? "Registry User"}
              </span>
            </div>
            <div className="flex justify-between border-b border-[#DADCE0] pb-2">
              <span className="label">Email Address</span>
              <span className="mono text-[#202124]">{user?.email ?? "—"}</span>
            </div>
            <div className="flex justify-between border-b border-[#DADCE0] pb-2">
              <span className="label">System Role</span>
              <span className="badge border-primary text-primary font-medium">
                {user?.role ?? "—"}
              </span>
            </div>
            <div className="flex justify-between pb-1">
              <span className="label">Staff Phone</span>
              <span className="mono text-[#202124]">{user?.phone ?? "—"}</span>
            </div>
          </div>
        </div>

        {/* Password Reset Card */}
        <div className="card space-y-4">
          <h3 className="border-b border-[#DADCE0] pb-2">
            Change Access Password
          </h3>

          {error && (
            <div className="border border-[#FFBDAD] text-[#D93025] text-xs p-3 rounded-[4px]">
              [Error] {error}
            </div>
          )}

          {success && (
            <div className="border border-[#ABF5D1] text-[#1E8E3E] text-[11px] uppercase tracking-wider font-semibold p-3 rounded-[4px]">
              {success}
            </div>
          )}

          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div className="space-y-1">
              <label
                htmlFor="new-password"
                className="label text-muted"
              >
                New Password
              </label>
              <input
                type="password"
                id="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="input-field"
                placeholder="Minimum 6 characters"
              />
            </div>

            <div className="space-y-1">
              <label
                htmlFor="confirm-password"
                className="label text-muted"
              >
                Confirm New Password
              </label>
              <input
                type="password"
                id="confirm-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="input-field"
                placeholder="Confirm password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full disabled:opacity-50"
            >
              {loading ? "Updating Credentials..." : "Update Password"}
            </button>
          </form>
        </div>
      </div>

      {/* Danger/Action Zone */}
      <div className="border-t border-[#DADCE0] pt-4">
        <h3 className="label text-muted mb-3">
          Session Terminate
        </h3>
        <button
          type="button"
          onClick={handleSignOut}
          className="btn-secondary border-[#FFBDAD] hover:bg-[#FFEBE6] text-[#D93025]"
        >
          Sign Out of System
        </button>
      </div>
    </div>
  );
}
