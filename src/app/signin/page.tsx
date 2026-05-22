"use client";

import React, { useState } from "react";
import { useAuthActions } from "@convex-dev/auth/react";
import { useRouter } from "next/navigation";
import Wordmark from "@/components/Wordmark";
import { KeyRound, Mail, UserCheck } from "lucide-react";

export default function SignInPage() {
  const { signIn } = useAuthActions();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [flow, setFlow] = useState<"signIn" | "signUp">("signIn");
  const [role, setRole] = useState<"supervisor" | "manager" | "worker">("worker");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await signIn("password", { email, password, flow, role });
      router.push("/");
    } catch (err: any) {
      console.error(err);
      setError("Those credentials didn't match. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const handlePrefill = (prefillEmail: string, prefillRole: "supervisor" | "manager" | "worker") => {
    setEmail(prefillEmail);
    setPassword("password"); // default seeded password or password input
    setRole(prefillRole);
    setFlow("signIn");
    setError(null);
  };

  return (
    <div className="min-h-screen w-screen bg-paper flex flex-col md:flex-row font-sans text-ink selection:bg-cream overflow-y-auto">
      {/* Left side: editorial branding, heritage cream background */}
      <div className="hidden md:flex md:w-1/2 bg-cream items-center justify-center p-12 border-r border-rule">
        <div className="max-w-[400px] space-y-6">
          <Wordmark size={42} tone="moss" />
          <div className="h-[1px] w-16 bg-moss" />
          <h2 className="text-moss font-display text-3xl font-medium tracking-tight">
            The Highland Green & Cream Heritage Portal
          </h2>
          <p className="text-ink/80 text-sm leading-relaxed font-sans">
            Elfam is the operational nerve centre and production ledger for agriculture managers, supervisors, and field workers tracking multi-species livestock, crop yields, and soil quality.
          </p>
        </div>
      </div>

      {/* Right side: sign-in form */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-12 bg-paper">
        <div className="w-full max-w-[380px] space-y-8">
          <div className="md:hidden text-center pb-2">
            <Wordmark size={36} tone="moss" />
          </div>

          <div className="space-y-2 text-center md:text-left">
            <h1 className="text-2xl font-display font-medium text-ink">
              {flow === "signIn" ? "Portal Access" : "Register Account"}
            </h1>
            <p className="text-xs text-muted">
              {flow === "signIn" 
                ? "Enter your credentials to access the Elfam database." 
                : "Create a new profile on the Elfam platform."}
            </p>
          </div>

          {error && (
            <div className="border border-alert bg-[#fdf2f0] text-alert text-xs p-3 font-mono" id="signin-error">
              [Access Denied] {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label 
                htmlFor="email-input" 
                className="label text-xs-label block"
              >
                Email Address
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted">
                  <Mail className="h-4 w-4" />
                </span>
                <input
                  type="email"
                  id="email-input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="input-field pl-10"
                  placeholder="you@elfam.com"
                />
              </div>
            </div>

            <div className="space-y-1 relative">
              <label 
                htmlFor="password-input" 
                className="label text-xs-label block"
              >
                Security Password
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted">
                  <KeyRound className="h-4 w-4" />
                </span>
                <input
                  type={showPassword ? "text" : "password"}
                  id="password-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="input-field pl-10 pr-14"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 label text-xs text-muted hover:text-ink px-2 py-1 cursor-pointer bg-transparent border-none"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            {flow === "signUp" && (
              <div className="space-y-1">
                <label 
                  htmlFor="role-select" 
                  className="label text-xs-label block"
                >
                  Assigned Operational Role
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted">
                    <UserCheck className="h-4 w-4" />
                  </span>
                  <select
                    id="role-select"
                    value={role}
                    onChange={(e) => setRole(e.target.value as any)}
                    className="input-field pl-10 cursor-pointer bg-paper"
                  >
                    <option value="worker">Worker (Field Logging Portal)</option>
                    <option value="manager">Manager (Operations Surface)</option>
                    <option value="supervisor">Supervisor (Executive Ledger)</option>
                  </select>
                </div>
              </div>
            )}

            <button
              type="submit"
              id="submit-btn"
              disabled={loading}
              className="btn-primary w-full disabled:opacity-50"
            >
              {loading ? "Authorising..." : flow === "signIn" ? "Access Portal" : "Complete Registration"}
            </button>
          </form>

          {/* Quick Prefill Links for Testing */}
          <div className="bg-paper-2 p-4 border border-rule space-y-3">
            <span className="text-xs-label block text-center font-bold text-ink">
              Quick Authorization Prefills
            </span>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handlePrefill("supervisor@elfam.com", "supervisor")}
                className="btn-secondary h-8 px-2 text-[11px] uppercase tracking-tighter"
              >
                Supervisor
              </button>
              <button
                type="button"
                onClick={() => handlePrefill("manager@elfam.com", "manager")}
                className="btn-secondary h-8 px-2 text-[11px] uppercase tracking-tighter"
              >
                Manager
              </button>
              <button
                type="button"
                onClick={() => handlePrefill("worker@elfam.com", "worker")}
                className="btn-secondary h-8 px-2 text-[11px] uppercase tracking-tighter"
              >
                Worker
              </button>
            </div>
            <p className="text-[10px] text-center text-muted font-mono leading-none mt-1">
              * Seeded test password is "password"
            </p>
          </div>

          <div className="text-center">
            <button
              type="button"
              id="toggle-flow-btn"
              onClick={() => {
                setFlow(flow === "signIn" ? "signUp" : "signIn");
                setError(null);
              }}
              className="label text-moss hover:underline cursor-pointer bg-transparent border-none p-0"
            >
              {flow === "signIn" ? "Register new account" : "Already registered? Sign in"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
