"use client";

import React, { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { Check } from "lucide-react";

export default function WorkerMilkEntryPage() {
  const user = useQuery(api.users.viewer);
  const cows = useQuery(api.cows.list, {});
  const logMilkingMutation = useMutation(api.records.logMilkingSession);

  const [cowId, setCowId] = useState("");
  const [session, setSession] = useState<"AM" | "PM">("AM");
  const [litres, setLitres] = useState("");

  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const activeCows = cows?.filter((c: any) => c.status === "milking" || c.status === "treatment") ?? [];

  const handleLog = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!cowId || !litres || !user) {
      setError("Please select a cow and input the yield litres.");
      return;
    }

    const cow = cows?.find((c: any) => c._id === cowId);
    if (!cow) return;

    setSubmitting(true);
    try {
      const flagged = cow.status === "treatment";
      const result = await logMilkingMutation({
        cowId: cowId as any,
        session,
        date: new Date().toISOString().split("T")[0],
        litres: parseFloat(litres),
        loggedBy: user._id,
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
      setCowId("");
    } catch (e: any) {
      setError(e.message || "Failed to submit yield record.");
    } finally {
      setSubmitting(false);
    }
  };

  if (cows === undefined || user === undefined) {
    return <div className="text-xs text-[#5E6C84] uppercase font-black tracking-widest p-8 font-sans">Loading data registry...</div>;
  }

  return (
    <div className="space-y-8 font-sans text-[#091E42] pb-12">
      <header className="border-b border-[#DFE1E6] pb-6">
        <span className="text-[10px] font-black uppercase text-[#5E6C84] tracking-[0.2em] block mb-2">
          Daily Log Portal
        </span>
        <h1 className="font-sans text-2xl font-black uppercase text-[#091E42]">
          Enter Daily Milk
        </h1>
        <p className="text-xs text-[#5E6C84] font-semibold mt-1 uppercase tracking-wider">Mobile session entries for AM and PM yields</p>
      </header>

      <div className="max-w-xl system-card p-6 space-y-6">
        {success && (
          <div className="bg-[#E3FCEF] border border-[#ABF5D1] text-[#006644] text-xs font-semibold p-4 rounded-xl flex items-center gap-2">
            <Check className="h-4 w-4 text-[#006644]" />
            <span>Yield saved successfully.</span>
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
              <option value="">-- Choose Cow Tag --</option>
              {activeCows.map((c: any) => (
                <option key={c._id} value={c._id}>
                  {c.tagNumber} ({c.name}) {c.status === "treatment" ? "[Medicated]" : ""}
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
                <option value="AM">AM (Morning)</option>
                <option value="PM">PM (Evening)</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-black text-[#5E6C84] mb-1.5 uppercase tracking-wider">Yield Litres</label>
              <input
                type="number"
                step="0.1"
                placeholder="e.g. 12.4"
                value={litres}
                onChange={(e) => setLitres(e.target.value)}
                className="w-full h-11 bg-[#F4F5F7] border border-[#DFE1E6] px-4 text-xs font-semibold text-[#091E42] focus:outline-none focus:border-primary rounded-[14px] transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full btn-primary h-12 text-[11px] rounded-[18px] mt-4 uppercase tracking-wider"
          >
            {submitting ? "Writing to database..." : "Commit Milk Yield"}
          </button>
        </form>
      </div>
    </div>
  );
}

