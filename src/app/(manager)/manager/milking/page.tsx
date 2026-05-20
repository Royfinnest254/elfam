"use client";

import React, { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";

export default function ManagerMilkingPage() {
  const cows = useQuery(api.cows.list, {});
  const users = useQuery(api.users.list);
  const logMilkingMutation = useMutation(api.records.logMilkingSession);

  const [cowId, setCowId] = useState("");
  const [session, setSession] = useState<"AM" | "PM">("AM");
  const [dateStr, setDateStr] = useState(new Date().toISOString().split("T")[0]); // YYYY-MM-DD
  const [litres, setLitres] = useState("");
  const [loggedBy, setLoggedBy] = useState("");
  
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const activeCows = cows?.filter((c: any) => c.status === "milking" || c.status === "treatment") ?? [];
  const workers = users?.filter((u: any) => u.role === "worker" || u.role === "manager") ?? [];

  const handleLog = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!cowId || !litres || !loggedBy) {
      setError("Please select a cow, enter litres, and select staff.");
      return;
    }

    const cow = cows?.find((c: any) => c._id === cowId);
    if (!cow) return;

    setSubmitting(true);
    try {
      // Flag if the cow is in treatment
      const flagged = cow.status === "treatment";
      
      const result = await logMilkingMutation({
        cowId: cowId as any,
        session,
        date: dateStr,
        litres: parseFloat(litres),
        loggedBy: loggedBy as any,
        flagged,
      });

      if (result.flagged) {
        setError(result.message || "Withholding warning: yield flagged due to active medication.");
        setSuccess(false);
      } else {
        setSuccess(true);
        setError(null);
        // Clear success banner after 3 seconds
        setTimeout(() => setSuccess(false), 3000);
      }
      setLitres("");
    } catch (e: any) {
      setError(e.message || "Failed to log milking session.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 font-sans text-[#091E42] pb-12">
      <header className="border-b border-[#DFE1E6] pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <span className="text-[10px] font-black uppercase text-[#5E6C84] tracking-[0.2em] block mb-2">
            Dairy Operations
          </span>
          <h1 className="font-sans text-2xl font-black uppercase text-[#091E42]">
            Milking Session Yields
          </h1>
        </div>
        <Link href="/manager/milking/history" className="btn-secondary h-10 px-5 text-[10px] rounded-[14px] flex items-center gap-1">
          <span>Yield Audit Logs</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Entry Form */}
        <div className="lg:col-span-6 system-card p-6 space-y-6">
          <h3 className="text-base font-black uppercase tracking-tight text-[#091E42] border-b border-[#DFE1E6] pb-4">Session Log Form</h3>

          {success && (
            <div className="bg-[#E3FCEF] border border-[#ABF5D1] text-[#006644] text-xs font-semibold p-4 rounded-xl flex items-center gap-2">
              <Check className="h-4 w-4 text-[#006644]" />
              <span>Yield entry successfully logged into the database.</span>
            </div>
          )}

          {error && (
            <div className="bg-[#FFEBE6] border border-[#FFBDAD] text-[#BF2600] text-xs font-semibold p-4 rounded-xl">
              [Error] {error}
            </div>
          )}

          <form onSubmit={handleLog} className="space-y-4">
            <div>
              <label className="block text-[10px] font-black text-[#5E6C84] mb-1.5 uppercase tracking-wider">Select Cow</label>
              <select
                value={cowId}
                onChange={(e) => setCowId(e.target.value)}
                className="w-full h-11 bg-[#F4F5F7] border border-[#DFE1E6] px-4 text-xs font-semibold text-[#091E42] focus:outline-none focus:border-primary rounded-[14px] transition-colors"
              >
                <option value="">-- Choose Cow tag --</option>
                {activeCows.map((c: any) => (
                  <option key={c._id} value={c._id}>
                    {c.tagNumber} ({c.name}) {c.status === "treatment" ? "[TREATMENT LOCKED]" : ""}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-black text-[#5E6C84] mb-1.5 uppercase tracking-wider">Session</label>
                <select
                  value={session}
                  onChange={(e) => setSession(e.target.value as any)}
                  className="w-full h-11 bg-[#F4F5F7] border border-[#DFE1E6] px-4 text-xs font-semibold text-[#091E42] focus:outline-none focus:border-primary rounded-[14px] transition-colors"
                >
                  <option value="AM">AM Session</option>
                  <option value="PM">PM Session</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-black text-[#5E6C84] mb-1.5 uppercase tracking-wider">Date</label>
                <input
                  type="date"
                  value={dateStr}
                  onChange={(e) => setDateStr(e.target.value)}
                  className="w-full h-11 bg-[#F4F5F7] border border-[#DFE1E6] px-4 text-xs font-semibold text-[#091E42] focus:outline-none focus:border-primary rounded-[14px] transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black text-[#5E6C84] mb-1.5 uppercase tracking-wider">Yield (Litres)</label>
              <input
                type="number"
                step="0.1"
                placeholder="e.g. 14.5"
                value={litres}
                onChange={(e) => setLitres(e.target.value)}
                className="w-full h-11 bg-[#F4F5F7] border border-[#DFE1E6] px-4 text-xs font-semibold text-[#091E42] focus:outline-none focus:border-primary rounded-[14px] transition-colors"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black text-[#5E6C84] mb-1.5 uppercase tracking-wider">Recorded By (Staff)</label>
              <select
                value={loggedBy}
                onChange={(e) => setLoggedBy(e.target.value)}
                className="w-full h-11 bg-[#F4F5F7] border border-[#DFE1E6] px-4 text-xs font-semibold text-[#091E42] focus:outline-none focus:border-primary rounded-[14px] transition-colors"
              >
                <option value="">-- Select Team Member --</option>
                {workers.map((w: any) => (
                  <option key={w._id} value={w._id}>{w.name}</option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full btn-primary h-12 text-[11px] rounded-[18px] mt-4 uppercase tracking-wider"
            >
              {submitting ? "Writing ledger entry..." : "Commit Yield Record"}
            </button>
          </form>
        </div>

        {/* Informational Guidance Panel */}
        <div className="lg:col-span-6 system-card p-6 space-y-6">
          <h3 className="text-base font-black uppercase tracking-tight text-[#091E42] border-b border-[#DFE1E6] pb-4">Operational Safeguards</h3>
          <div className="space-y-4 text-xs font-semibold text-[#5E6C84] leading-relaxed">
            <p>
              <strong className="text-[#091E42]">Withholding Safeguard:</strong> Cows currently flagged under medical treatment will automatically have their yield records marked as <strong className="text-[#BF2600] uppercase">Locked</strong>.
            </p>
            <p>
              These lockouts protect the bulk storage tank. Contaminated yield cannot be combined with clean dispatches.
            </p>
            <div className="border border-[#DFE1E6] p-5 bg-[#F4F5F7] rounded-[18px] space-y-2 text-xs font-semibold text-[#5E6C84]">
              <span className="text-[10px] font-black text-[#091E42] block uppercase tracking-wider">Verification Thresholds</span>
              <p>Daily AM Yield Average target: <span className="text-[#091E42] font-bold">12.0 L</span></p>
              <p>Daily PM Yield Average target: <span className="text-[#091E42] font-bold">10.0 L</span></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


