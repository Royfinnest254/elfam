"use client";

import React, { useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { AlertTriangle, Clock } from "lucide-react";
import { getFarmClock } from "@/lib/farmClock";

export default function WithholdingBoardPage() {
  const { now } = getFarmClock();
  const activeWithholdings = useQuery(api.livestock.getActiveWithholdings, { now });

  const sortedWithholdings = useMemo(() => {
    if (!activeWithholdings) return [];
    return [...activeWithholdings].sort((a, b) => {
      const aTime = a.treatment.withholdingUntil;
      const bTime = b.treatment.withholdingUntil;
      return aTime - bTime; // Sort by earliest clearance first (ascending)
    });
  }, [activeWithholdings]);

  if (activeWithholdings === undefined) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center font-sans text-muted">
        <span className="body-small block">Loading withholding board...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12 bg-paper text-ink">
      <header className="border-b border-rule pb-6">
        <span className="text-[10px] font-mono uppercase text-muted tracking-[0.2em] block mb-2">
          Safety Safeguards
        </span>
        <h1 className="font-display text-display uppercase text-ink">
          Withholding Board
        </h1>
        <p className="body-small text-muted mt-1 uppercase tracking-wider font-mono">
          Morning check-in board | Locked out animals under treatment
        </p>
      </header>

      {sortedWithholdings.length === 0 ? (
        <div className="border border-rule bg-paper-2 p-12 text-center">
          <p className="body-small text-muted italic">No animals currently under withholding. All milk is safe for the bulk tank.</p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-alert/5 border border-alert/20 text-alert p-4 rounded-none flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-alert shrink-0 mt-0.5" />
            <div className="text-xs leading-relaxed font-sans font-medium">
              <strong className="text-alert font-bold block mb-1">CRITICAL DIRECTIVE:</strong>
              Milk or food output from the animals listed below is chemically contaminated. Do NOT siphon into the bulk transport tanks. Any accidental addition requires dumping the entire bulk tank ledger.
            </div>
          </div>

          <div className="border border-rule bg-paper overflow-hidden">
            <div className="overflow-x-auto w-full">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-rule bg-paper-2">
                    <th className="px-6 py-3 label text-muted font-mono font-bold tracking-wider">Ident / Tag</th>
                    <th className="px-6 py-3 label text-muted font-bold tracking-wider">Animal / Group</th>
                    <th className="px-6 py-3 label text-muted font-bold tracking-wider">Condition</th>
                    <th className="px-6 py-3 label text-muted font-bold tracking-wider">Medication Administered</th>
                    <th className="px-6 py-3 label text-muted font-mono font-bold tracking-wider">Clearance Date</th>
                    <th className="px-6 py-3 label text-muted font-mono font-bold tracking-wider text-right">Time Remaining</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-rule font-sans">
                  {sortedWithholdings.map((item) => {
                    const t = item.treatment;
                    const tag = item.type === "individual" && item.livestock ? item.livestock.tagNumber : item.group?.groupCode;
                    const name = item.type === "individual" && item.livestock ? item.livestock.name : item.group?.name;
                    const breed = item.type === "individual" && item.livestock ? item.livestock.breed : item.group?.breed;
                    const species = item.type === "individual" && item.livestock ? item.livestock.species : item.group?.species;

                    const msLeft = t.withholdingUntil - now;
                    const daysLeft = Math.max(0, Math.ceil(msLeft / (24 * 60 * 60 * 1000)));

                    return (
                      <tr key={t._id} className="hover:bg-paper-2 transition-colors">
                        <td className="px-6 py-4 font-mono font-bold text-ink whitespace-nowrap">{tag}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="font-bold text-ink block leading-tight">{name}</span>
                          <span className="text-[11px] text-muted block capitalize">{species} &middot; {breed}</span>
                        </td>
                        <td className="px-6 py-4 font-medium text-ink">{t.condition}</td>
                        <td className="px-6 py-4">
                          <span className="font-bold text-ink block leading-tight">{t.drugAdministered}</span>
                          <span className="text-[11px] text-muted block">Dosage: {t.dosage}</span>
                        </td>
                        <td className="px-6 py-4 font-mono text-muted whitespace-nowrap">
                          {new Date(t.withholdingUntil).toLocaleDateString("en-GB", {
                            day: "numeric",
                            month: "short",
                            year: "numeric"
                          })}
                        </td>
                        <td className="px-6 py-4 text-right whitespace-nowrap">
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 border border-alert text-alert font-mono text-[11px] font-bold rounded-[2px] uppercase">
                            <Clock className="h-3 w-3" />
                            <span>{daysLeft} {daysLeft === 1 ? "day" : "days"} left</span>
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
