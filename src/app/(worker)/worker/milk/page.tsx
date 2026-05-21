"use client";

import React, { useState, useMemo } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { Check, AlertTriangle, Delete } from "lucide-react";

/* ── Custom Numpad ─────────────────────────────────────────────────────── */
function Numpad({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const press = (key: string) => {
    if (key === "DEL") {
      onChange(value.slice(0, -1));
      return;
    }
    if (key === "CLR") {
      onChange("");
      return;
    }
    // Only allow one decimal point
    if (key === "." && value.includes(".")) return;
    // Max one decimal place
    if (value.includes(".") && value.split(".")[1]?.length >= 1) return;
    // Prevent leading zero issues
    if (value === "0" && key !== ".") {
      onChange(key);
      return;
    }
    if (value.length >= 5) return; // cap at 5 chars e.g. "999.9"
    onChange(value + key);
  };

  const keys = [
    ["7", "8", "9"],
    ["4", "5", "6"],
    ["1", "2", "3"],
    ["CLR", "0", "."],
  ];

  return (
    <div className="space-y-1">
      {keys.map((row, ri) => (
        <div key={ri} className="grid grid-cols-3 gap-1">
          {row.map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => press(k)}
              className={`h-14 rounded-none border font-mono text-base font-black transition-colors cursor-pointer select-none
                ${
                  k === "CLR"
                    ? "border-[#DADCE0] bg-[#F8F9FA] text-[#D93025] hover:bg-[#FFEBE6] text-xs tracking-widest"
                    : "border-[#DADCE0] bg-white text-[#202124] hover:bg-[#E8F0FE]/50 hover:border-[#1A56DB]/30"
                }`}
            >
              {k}
            </button>
          ))}
        </div>
      ))}
      {/* Delete button full-width */}
      <button
        type="button"
        onClick={() => press("DEL")}
        className="w-full h-11 border border-[#DADCE0] bg-[#F8F9FA] text-[#5F6368] hover:bg-[#DADCE0]/50 rounded-none flex items-center justify-center gap-2 transition-colors cursor-pointer"
      >
        <Delete className="h-4 w-4" />
        <span className="text-[10px] font-black uppercase tracking-widest">Backspace</span>
      </button>
    </div>
  );
}

/* ── Withholding Banner ─────────────────────────────────────────────────── */
function WithholdingBanner({ message }: { message: string }) {
  return (
    <div className="bg-[#FFEBE6] border-l-4 border-[#D93025] p-4 flex gap-3 items-start">
      <AlertTriangle className="h-5 w-5 text-[#D93025] shrink-0 mt-0.5" />
      <div>
        <p className="text-[11px] font-black uppercase tracking-wider text-[#D93025] mb-0.5">
          Milk Withholding Active
        </p>
        <p className="text-xs font-semibold text-[#D93025]">{message}</p>
        <p className="text-[10px] font-bold text-[#D93025] mt-1 uppercase tracking-wider">
          Do NOT add to bulk tank. Discard separately.
        </p>
      </div>
    </div>
  );
}

/* ── Main Page ──────────────────────────────────────────────────────────── */
export default function WorkerMilkEntryPage() {
  const user = useQuery(api.users.viewer);
  const cows = useQuery(api.cows.list, {});
  const now = Date.now();
  const activeWithholdings = useQuery(api.cows.getActiveWithholdings, { now });
  const logMilkingMutation = useMutation(api.records.logMilkingSession);

  const [cowId, setCowId] = useState("");
  const [session, setSession] = useState<"AM" | "PM">("AM");
  const [litres, setLitres] = useState("");
  const [tagSearch, setTagSearch] = useState("");

  const [success, setSuccess] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [withholdingAlert, setWithholdingAlert] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const activeCows = useMemo(
    () => cows?.filter((c: any) => c.status === "milking" || c.status === "treatment") ?? [],
    [cows]
  );

  // Build withholding map keyed by cowId
  const withholdingMap = useMemo(() => {
    const map = new Map<string, any>();
    activeWithholdings?.forEach((w: any) => {
      map.set(w.cow._id, w);
    });
    return map;
  }, [activeWithholdings]);

  // Filtered cows for tag search
  const filteredCows = useMemo(() => {
    if (!tagSearch.trim()) return activeCows;
    const q = tagSearch.toUpperCase();
    return activeCows.filter(
      (c: any) =>
        c.tagNumber.toUpperCase().includes(q) ||
        c.name.toUpperCase().includes(q)
    );
  }, [activeCows, tagSearch]);

  const selectedCow = useMemo(
    () => cows?.find((c: any) => c._id === cowId) ?? null,
    [cows, cowId]
  );

  // Check if selected cow is under withholding
  const selectedWithholding = cowId ? withholdingMap.get(cowId) : null;

  const handleSelectCow = (id: string) => {
    setCowId(id);
    setWithholdingAlert(null);
    setError(null);
    setSuccess(false);
    setLitres("");
    // Check withholding immediately on cow selection
    const wh = withholdingMap.get(id);
    if (wh) {
      const cow = cows?.find((c: any) => c._id === id);
      const d = new Date(wh.treatment.withholdingUntil);
      const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
      const dateStr = `${d.getDate()} ${months[d.getMonth()]}`;
      setWithholdingAlert(
        `${cow?.tagNumber ?? "EL-?"} ${cow?.name ?? ""} — milk withheld until ${dateStr}. Do not add to bulk tank.`
      );
    }
  };

  const handleLog = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!cowId || !litres || !user || user === null) {
      setError("Please select a cow and enter the yield amount.");
      return;
    }

    const litresNum = parseFloat(litres);
    if (isNaN(litresNum) || litresNum <= 0) {
      setError("Yield must be a positive number (e.g. 12.5).");
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
        litres: litresNum,
        loggedBy: user._id,
        flagged,
      });

      if (result.flagged && result.message) {
        setWithholdingAlert(result.message);
        setSuccess(false);
      } else {
        setSuccess(true);
        setSuccessMsg(
          `VERIFIED: ${cow.tagNumber} (${cow.name}) — ${session} yield of ${litresNum}L committed to bulk tank ledger.`
        );
        setTimeout(() => setSuccess(false), 4000);
      }
      setLitres("");
      setCowId("");
      setTagSearch("");
      setWithholdingAlert(null);
    } catch (e: any) {
      setError(e.message || "Failed to submit yield record.");
    } finally {
      setSubmitting(false);
    }
  };

  if (cows === undefined || user === undefined || user === null || activeWithholdings === undefined) {
    return (
      <div className="text-xs text-[#5F6368] uppercase font-black tracking-widest p-8 font-sans">
        Loading data registry...
      </div>
    );
  }

  return (
    <div className="space-y-8 font-sans text-[#202124] pb-12">
      <header className="border-b border-[#DADCE0] pb-6">
        <span className="text-[10px] font-black uppercase text-[#5F6368] tracking-[0.2em] block mb-2">
          Daily Log Portal
        </span>
        <h1 className="font-sans text-2xl font-black uppercase text-[#202124]">
          Commit Milk Yield
        </h1>
        <p className="text-xs text-[#5F6368] font-semibold mt-1 uppercase tracking-wider">
          AM & PM session entries · Withholding auto-enforced
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Left: Cow Selector */}
        <div className="system-card p-5 space-y-4">
          <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#5F6368] border-b border-[#DADCE0] pb-3">
            1 — Select Cow
          </h2>

          {/* Tag Search */}
          <div>
            <label className="block text-[10px] font-black text-[#5F6368] mb-1.5 uppercase tracking-wider">
              Search by Tag or Name
            </label>
            <input
              type="text"
              value={tagSearch}
              onChange={(e) => setTagSearch(e.target.value)}
              placeholder="e.g. EL-008 or Chepkoech"
              className="w-full h-10 bg-[#F8F9FA] border border-[#DADCE0] px-4 text-xs font-semibold text-[#202124] focus:outline-none focus:border-primary rounded-none transition-colors"
            />
          </div>

          {/* Cow List */}
          <div className="max-h-64 overflow-y-auto border border-[#DADCE0] divide-y divide-[#DADCE0] custom-scrollbar">
            {filteredCows.length === 0 ? (
              <p className="p-4 text-xs text-[#5F6368] italic">
                No active cows match your search.
              </p>
            ) : (
              filteredCows.map((c: any) => {
                const isWithholding = withholdingMap.has(c._id);
                const isSelected = cowId === c._id;
                return (
                  <button
                    key={c._id}
                    type="button"
                    onClick={() => handleSelectCow(c._id)}
                    className={`w-full flex items-center justify-between px-4 py-3 text-left transition-colors cursor-pointer
                      ${isSelected
                        ? "bg-[#E8F0FE] border-l-4 border-[#1A56DB]"
                        : isWithholding
                        ? "bg-[#FFEBE6]/30 hover:bg-[#FFEBE6]/60"
                        : "bg-white hover:bg-[#F8F9FA]"
                      }`}
                  >
                    <div>
                      <span className="text-xs font-black text-[#202124] block">
                        {c.tagNumber}
                        {isWithholding && (
                          <span className="ml-2 text-[9px] font-black text-[#D93025] uppercase tracking-widest bg-[#FFEBE6] px-1.5 py-0.5 border border-[#FFBDAD]">
                            WITHHELD
                          </span>
                        )}
                      </span>
                      <span className="text-[10px] text-[#5F6368] font-semibold">
                        {c.name} · {c.breed}
                      </span>
                    </div>
                    <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 border 
                      ${c.status === "treatment"
                        ? "bg-[#FFEBE6] text-[#D93025] border-[#FFBDAD]"
                        : "bg-[#E8F0FE] text-[#1A56DB] border-[#A8C7FA]"
                      }`}>
                      {c.status}
                    </span>
                  </button>
                );
              })
            )}
          </div>

          {/* Session Toggle */}
          <div>
            <label className="block text-[10px] font-black text-[#5F6368] mb-1.5 uppercase tracking-wider">
              Session
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(["AM", "PM"] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSession(s)}
                  className={`h-11 text-xs font-black uppercase tracking-widest border transition-colors cursor-pointer
                    ${session === s
                      ? "bg-[#202124] text-white border-[#202124]"
                      : "bg-white text-[#5F6368] border-[#DADCE0] hover:bg-[#F8F9FA]"
                    }`}
                >
                  {s === "AM" ? "AM · Morning" : "PM · Evening"}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Numpad & Commit */}
        <div className="system-card p-5 space-y-4">
          <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#5F6368] border-b border-[#DADCE0] pb-3">
            2 — Enter Litres
          </h2>

          {/* Live Display */}
          <div className="bg-[#F8F9FA] border border-[#DADCE0] px-6 py-4 text-center">
            {selectedCow ? (
              <p className="text-[10px] font-black uppercase tracking-widest text-[#5F6368] mb-1">
                {selectedCow.tagNumber} · {selectedCow.name} · {session}
              </p>
            ) : (
              <p className="text-[10px] font-black uppercase tracking-widest text-[#DADCE0] mb-1">
                Select a cow first
              </p>
            )}
            <div className="font-mono text-5xl font-black text-[#202124] tracking-tight leading-none">
              {litres || "0"}
              <span className="text-lg text-[#5F6368] ml-1">L</span>
            </div>
          </div>

          {/* Withholding Alert (shown inline before commit) */}
          {withholdingAlert && (
            <WithholdingBanner message={withholdingAlert} />
          )}

          {/* Success Banner */}
          {success && (
            <div className="bg-[#E3FCEF] border border-[#ABF5D1] text-[#1E8E3E] text-xs font-semibold p-4 flex items-start gap-2">
              <Check className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="bg-[#FFEBE6] border border-[#FFBDAD] text-[#D93025] text-xs font-semibold p-4">
              [Error] {error}
            </div>
          )}

          {/* Numpad */}
          <Numpad value={litres} onChange={setLitres} />

          {/* Commit Button */}
          <form onSubmit={handleLog}>
            <button
              type="submit"
              disabled={submitting || !cowId || !litres}
              className="w-full btn-primary h-14 text-[11px] rounded-none mt-2 uppercase tracking-wider disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {submitting
                ? "Writing to database..."
                : selectedWithholding
                ? "⚠ Log Withheld Milk (Flag)"
                : "Commit Milk Yield"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
