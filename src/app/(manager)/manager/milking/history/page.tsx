"use client";

import React from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../../../convex/_generated/api";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function MilkingHistoryPage() {
  const history = useQuery(api.records.getMilkingAudit, { limit: 100 });

  if (history === undefined) {
    return <div className="text-small text-muted italic p-8 font-sans">Loading milking history...</div>;
  }

  return (
    <div className="space-y-8 font-sans text-navy">
      <header className="border-b border-rule pb-6">
        <Link href="/manager/milking" className="text-small text-navy hover:text-gold uppercase tracking-wider font-semibold flex items-center gap-1 mb-4">
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Milking Log</span>
        </Link>
        <h1 className="font-display text-display italic text-navy">
          Milk Yield Logs History
        </h1>
        <p className="text-small text-muted font-mono mt-1">Archive of AM/PM milking yields entries</p>
      </header>

      <div className="bg-paper border border-rule p-6 space-y-4">
        {history.length === 0 ? (
          <p className="text-small text-muted italic">No yields records found in ledger database.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-small divide-y divide-rule">
              <thead>
                <tr className="font-mono text-[11px] text-muted uppercase bg-paper-2">
                  <th className="p-3">Log Date</th>
                  <th className="p-3">Session</th>
                  <th className="p-3">Litres Recorded</th>
                  <th className="p-3">Safety Status</th>
                  <th className="p-3">Recorded Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-rule">
                {history.map((record: any) => (
                  <tr key={record._id} className="hover:bg-paper-2/50 transition-colors">
                    <td className="p-3 font-mono font-bold">{record.date}</td>
                    <td className="p-3 font-semibold">{record.session} Session</td>
                    <td className="p-3 font-mono font-bold">{record.litres.toFixed(1)} Litres</td>
                    <td className="p-3">
                      {record.flagged ? (
                        <span className="font-mono text-[10px] bg-alert text-white px-2 py-0.5 uppercase font-bold">
                          LOCKED
                        </span>
                      ) : (
                        <span className="font-mono text-[10px] text-muted uppercase">
                          CLEAN dispatch
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-muted font-mono text-[11px]">
                      {new Date(record.loggedAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
