"use client";

import React, { useState } from "react";
import { useAuthActions } from "@convex-dev/auth/react";
import { useRouter } from "next/navigation";
import Wordmark from "@/components/Wordmark";

export default function SignInPage() {
  const { signIn } = useAuthActions();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [flow, setFlow] = useState<"signIn" | "signUp">("signIn");
  const [role, setRole] = useState("worker");
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


  return (
    <div className="min-h-screen w-screen bg-[#F8F9FA] flex flex-col md:flex-row font-sans text-[#202124] selection:bg-primary-subtle overflow-hidden">
      {/* Left side: primary background, wordmark centered */}
      <div className="hidden md:flex md:w-1/2 bg-primary items-center justify-center p-12">
        <div className="text-center space-y-4">
          <Wordmark size={36} tone="white" />
          <div className="h-[2px] w-12 bg-white/20 mx-auto" />
        </div>
      </div>

      {/* Right side: paper background, sign-in form centered in 360px max-width column */}
      <div className="flex-1 bg-[#FFFFFF] flex items-center justify-center p-6 md:p-12">
        <div className="w-full max-w-[360px] space-y-6">
          <div className="md:hidden text-center pb-4">
            <Wordmark size={32} tone="blue" />
          </div>

          <h2>
            {flow === "signIn" ? "Sign In" : "Register Account"}
          </h2>

          {error && (
            <div className="text-[#D93025] body-small font-medium" id="signin-error">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label 
                htmlFor="email-input" 
                className="label text-muted"
              >
                Email
              </label>
              <input
                type="email"
                id="email-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="input-field"
                placeholder="you@example.com"
              />
            </div>

            <div className="space-y-1 relative">
              <label 
                htmlFor="password-input" 
                className="label text-muted"
              >
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="input-field pr-14"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 label text-muted hover:text-[#202124] px-2 py-1 cursor-pointer bg-transparent border-none"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            {flow === "signUp" && (
              <div className="space-y-1">
                <label 
                  htmlFor="role-select" 
                  className="label text-muted"
                >
                  Choose Role
                </label>
                <select
                  id="role-select"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="input-field cursor-pointer bg-white"
                >
                  <option value="manager">Manager (Operations & Reports)</option>
                  <option value="worker">Worker (Field Logging Portal)</option>
                </select>
              </div>
            )}

            <button
              type="submit"
              id="submit-btn"
              disabled={loading}
              className="btn-primary w-full disabled:opacity-50"
            >
              {loading ? "Verifying..." : flow === "signIn" ? "Sign in" : "Register"}
            </button>
          </form>



          <div className="text-center">
            <button
              type="button"
              id="toggle-flow-btn"
              onClick={() => {
                setFlow(flow === "signIn" ? "signUp" : "signIn");
                setError(null);
              }}
              className="label text-primary hover:underline cursor-pointer bg-transparent border-none p-0"
            >
              {flow === "signIn" ? "Create an account" : "Return to sign in"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
