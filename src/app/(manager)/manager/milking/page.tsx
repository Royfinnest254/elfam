"use client";

import React, { useState, useMemo } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import Link from "next/link";
import { ArrowRight, Check, AlertTriangle } from "lucide-react";
import { getFarmClock } from "@/lib/farmClock";

export default function ProductionLoggingPage() {
  const { now } = getFarmClock();
  
  const dashboardData = useQuery(api.livestock.getLivestockDashboard, { now, yesterdayDateStr: "" });
  const users = useQuery(api.users.list);
  const logProductionMutation = useMutation(api.records.logProductionRecord);

  const [logTarget, setLogTarget] = useState<"individual" | "group">("individual");
  
  // Selection states
  const [livestockId, setLivestockId] = useState("");
  const [groupId, setGroupId] = useState("");
  
  // Yield details
  const [prodType, setProdType] = useState<"milk" | "eggs" | "wool" | "honey" | "weight">("milk");
  const [amount, setAmount] = useState("");
  const [session, setSession] = useState<"AM" | "PM">("AM");
  const [dateStr, setDateStr] = useState(new Date().toISOString().split("T")[0]); // YYYY-MM-DD
  const [loggedBy, setLoggedBy] = useState("");

  const [success, setSuccess] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (dashboardData === undefined || users === undefined) {
    return <div className="text-xs text-muted uppercase font-mono tracking-widest p-8 font-sans">Loading registry ledger...</div>;
  }

  const { individual = [], groups = [] } = dashboardData;
  const staff = users.filter((u: any) => u.role === "worker" || u.role === "manager");

  // Get active selected individual or group
  const selectedIndividual = individual.find((i: any) => i._id === livestockId);
  const selectedGroup = groups.find((g: any) => g._id === groupId);

  // Auto-set the production type depending on selected animal's species
  const handleIndividualChange = (id: string) => {
    setLivestockId(id);
    const animal = individual.find((i: any) => i._id === id);
    if (animal) {
      if (animal.species === "cattle" || animal.species === "goat") {
        setProdType("milk");
      } else if (animal.species === "sheep") {
        setProdType("wool");
      } else if (animal.species === "pig") {
        setProdType("weight");
      } else {
        setProdType("weight");
      }
    }
  };

  const handleGroupChange = (id: string) => {
    setGroupId(id);
    const group = groups.find((g: any) => g._id === id);
    if (group) {
      if (group.species === "poultry") {
        setProdType("eggs");
      } else if (group.species === "bees") {
        setProdType("honey");
      } else {
        setProdType("weight");
      }
    }
  };

  const handleLogSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (logTarget === "individual" && !livestockId) {
      setError("Please select an individual animal.");
      return;
    }
    if (logTarget === "group" && !groupId) {
      setError("Please select a livestock group.");
      return;
    }
    if (!amount || !loggedBy) {
      setError("Please enter the amount and select the recording staff member.");
      return;
    }

    const amtNum = parseFloat(amount);
    if (isNaN(amtNum) || amtNum < 0) {
      setError("Amount must be a non-negative number.");
      return;
    }

    setSubmitting(true);
    try {
      const payload: any = {
        type: prodType,
        amount: amtNum,
        date: dateStr,
        loggedBy: loggedBy as any,
        flagged: false, // Convex backend checks treatments and flags internally
      };

      if (prodType === "milk" || prodType === "eggs") {
        payload.session = session;
      }

      if (logTarget === "individual") {
        payload.livestockId = livestockId as any;
      } else {
        payload.groupId = groupId as any;
      }

      const result = await logProductionMutation(payload);

      if (result.flagged) {
        setError(result.message || "Withholding warning: yield flagged due to active medication.");
        setSuccess(false);
      } else {
        setSuccess(true);
        setSuccessMsg("Yield entry successfully logged into the agribusiness ledger.");
        setError(null);
        setTimeout(() => setSuccess(false), 4000);
      }

      // Reset entry field
      setAmount("");
    } catch (err: any) {
      setError(err.message || "Failed to commit production record.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 font-sans text-ink pb-12">
      <header className="border-b border-rule pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <span className="text-[10px] font-mono uppercase text-muted tracking-[0.2em] block mb-2">
            Agribusiness Yields
          </span>
          <h1 className="font-display text-display uppercase text-ink">
            Production Ledger
          </h1>
        </div>
        <Link
          href="/manager/production/history"
          className="btn-primary h-10 px-5 text-[10px] font-mono tracking-wider uppercase rounded-none flex items-center gap-1.5"
        >
          <span>Yield Audit Logs</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Entry Form (Col 1) */}
        <div className="lg:col-span-6 bg-paper border border-rule p-6 space-y-6">
          <h3 className="text-base font-display italic uppercase text-moss border-b border-rule pb-4">
            Yield Log Form
          </h3>

          {success && (
            <div className="bg-moss/5 border border-moss/20 text-moss text-xs font-semibold p-4 rounded-none flex items-center gap-2">
              <Check className="h-4 w-4 text-moss" />
              <span>{successMsg}</span>
            </div>
          )}

          {error && (
            <div className="bg-alert/5 border border-alert/20 text-alert text-xs font-semibold p-4 rounded-none">
              [WARNING] {error}
            </div>
          )}

          <div className="flex gap-4 border-b border-rule pb-4">
            <button
              type="button"
              onClick={() => { setLogTarget("individual"); setAmount(""); }}
              className={`px-4 py-2 text-xs font-mono font-bold uppercase border rounded-none ${
                logTarget === "individual" ? "bg-moss text-cream border-moss" : "bg-paper-2 text-muted border-rule"
              }`}
            >
              Individual Animal
            </button>
            <button
              type="button"
              onClick={() => { setLogTarget("group"); setAmount(""); }}
              className={`px-4 py-2 text-xs font-mono font-bold uppercase border rounded-none ${
                logTarget === "group" ? "bg-moss text-cream border-moss" : "bg-paper-2 text-muted border-rule"
              }`}
            >
              Group Cohort (Poultry/Bees)
            </button>
          </div>

          <form onSubmit={handleLogSubmit} className="space-y-4">
            
            {logTarget === "individual" ? (
              <div>
                <label className="block text-[9px] font-mono font-bold text-ink uppercase tracking-wider mb-1.5">
                  Select Animal Tag *
                </label>
                <select
                  value={livestockId}
                  onChange={(e) => handleIndividualChange(e.target.value)}
                  className="input-field"
                >
                  <option value="">-- Choose Individual Animal --</option>
                  {individual.map((i: any) => (
                    <option key={i._id} value={i._id}>
                      {i.tagNumber} ({i.name} - {i.species}) {i.isWithholding ? "[WITHHOLDING LOCKED]" : ""}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div>
                <label className="block text-[9px] font-mono font-bold text-ink uppercase tracking-wider mb-1.5">
                  Select Group Cohort *
                </label>
                <select
                  value={groupId}
                  onChange={(e) => handleGroupChange(e.target.value)}
                  className="input-field"
                >
                  <option value="">-- Choose Group Cohort --</option>
                  {groups.map((g: any) => (
                    <option key={g._id} value={g._id}>
                      {g.groupCode} ({g.name} - {g.species}) {g.isWithholding ? "[WITHHOLDING LOCKED]" : ""}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[9px] font-mono font-bold text-ink uppercase tracking-wider mb-1.5">
                  Production Type
                </label>
                <select
                  value={prodType}
                  onChange={(e) => setProdType(e.target.value as any)}
                  className="input-field bg-paper-2 text-muted cursor-not-allowed"
                  disabled
                >
                  <option value="milk">Milk (Litres)</option>
                  <option value="eggs">Eggs (Count)</option>
                  <option value="wool">Wool Fleece (kg)</option>
                  <option value="honey">Honey Honeycomb (kg)</option>
                  <option value="weight">Animal weight (kg)</option>
                </select>
              </div>
              <div>
                <label className="block text-[9px] font-mono font-bold text-ink uppercase tracking-wider mb-1.5">
                  Yield Date
                </label>
                <input
                  type="date"
                  value={dateStr}
                  onChange={(e) => setDateStr(e.target.value)}
                  className="input-field"
                />
              </div>
            </div>

            {/* Session field (Milk and Eggs only) */}
            {(prodType === "milk" || prodType === "eggs") && (
              <div>
                <label className="block text-[9px] font-mono font-bold text-ink uppercase tracking-wider mb-1.5">
                  Session
                </label>
                <select
                  value={session}
                  onChange={(e) => setSession(e.target.value as any)}
                  className="input-field"
                >
                  <option value="AM">AM (Morning Collection)</option>
                  <option value="PM">PM (Evening Collection)</option>
                </select>
              </div>
            )}

            <div>
              <label className="block text-[9px] font-mono font-bold text-ink uppercase tracking-wider mb-1.5">
                Recorded Yield Amount ({
                  prodType === "milk" ? "Litres" :
                  prodType === "eggs" ? "Units Count" :
                  "Kilograms (kg)"
                }) *
              </label>
              <input
                type="number"
                step="0.1"
                placeholder={prodType === "eggs" ? "e.g. 210" : "e.g. 15.5"}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="input-field font-mono"
              />
            </div>

            <div>
              <label className="block text-[9px] font-mono font-bold text-ink uppercase tracking-wider mb-1.5">
                Recorded By (Staff) *
              </label>
              <select
                value={loggedBy}
                onChange={(e) => setLoggedBy(e.target.value)}
                className="input-field"
              >
                <option value="">-- Select Team Member --</option>
                {staff.map((w: any) => (
                  <option key={w._id} value={w._id}>{w.name}</option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full btn-primary h-12 uppercase font-mono tracking-wider rounded-none mt-4"
            >
              {submitting ? "Writing to database..." : "Commit Yield Record"}
            </button>
          </form>
        </div>

        {/* Informational Guidance (Col 2) */}
        <div className="lg:col-span-6 bg-paper border border-rule p-6 space-y-6">
          <h3 className="text-base font-display italic uppercase text-moss border-b border-rule pb-4">
            Agribusiness Safeguards
          </h3>
          <div className="space-y-4 text-xs font-medium text-ink/80 leading-relaxed">
            <p>
              <strong className="text-ink font-bold block mb-1">Medication Withholding Block:</strong> 
              If an individual animal or flock is currently under a medication withholding window, any logged yield is automatically marked as <strong className="text-alert uppercase">Withheld</strong>.
            </p>
            <p>
              Contaminated milk or chemical residues in eggs/honey must be kept completely separate from commercial deliveries to prevent buyer rejection and penalty fees.
            </p>
            
            {/* Live selected info */}
            {logTarget === "individual" && selectedIndividual && (
              <div className="border border-rule p-4 bg-paper-2 space-y-2 text-xs">
                <span className="text-[9px] font-mono font-bold text-ink block uppercase tracking-wider">
                  Target Telemetry: {selectedIndividual.tagNumber}
                </span>
                <p>Name: <span className="font-bold text-ink">{selectedIndividual.name}</span></p>
                <p>Species: <span className="font-bold text-ink capitalize">{selectedIndividual.species}</span></p>
                <p>Breed: <span className="font-bold text-ink">{selectedIndividual.breed}</span></p>
                {selectedIndividual.isWithholding && (
                  <div className="bg-alert/5 border border-alert/20 text-alert p-2.5 font-mono text-[9px] uppercase tracking-wider font-bold">
                    [WARNING] Medication active until {new Date(selectedIndividual.withholdingUntil!).toLocaleDateString("en-GB")}. Output is withheld!
                  </div>
                )}
              </div>
            )}

            {logTarget === "group" && selectedGroup && (
              <div className="border border-rule p-4 bg-paper-2 space-y-2 text-xs">
                <span className="text-[9px] font-mono font-bold text-ink block uppercase tracking-wider">
                  Target Telemetry: {selectedGroup.groupCode}
                </span>
                <p>Name: <span className="font-bold text-ink">{selectedGroup.name}</span></p>
                <p>Species: <span className="font-bold text-ink capitalize">{selectedGroup.species}</span></p>
                <p>Head count: <span className="font-bold text-ink">{selectedGroup.count} head</span></p>
                {selectedGroup.isWithholding && (
                  <div className="bg-alert/5 border border-alert/20 text-alert p-2.5 font-mono text-[9px] uppercase tracking-wider font-bold">
                    [WARNING] Active flock/hive treatments logged. Output is withheld!
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
