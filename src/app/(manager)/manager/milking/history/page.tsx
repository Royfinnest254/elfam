"use client";

import React from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../../../convex/_generated/api";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getFarmClock } from "@/lib/farmClock";

export default function ProductionHistoryPage() {
  const { now } = getFarmClock();
  
  const history = useQuery(api.records.getMilkingAudit, { limit: 100 });
  const dashboardData = useQuery(api.livestock.getLivestockDashboard, { now, yesterdayDateStr: "" });
  const users = useQuery(api.users.list);

  if (history === undefined || dashboardData === undefined || users === undefined) {
    return <div className="text-xs text-muted uppercase font-mono tracking-widest p-8 font-sans">Loading yield ledger files...</div>;
  }

  const { individual = [], groups = [] } = dashboardData;

  // Build lookup maps
  const animalMap = new Map(individual.map((i: any) => [i._id, i]));
  const groupMap = new Map(groups.map((g: any) => [g._id, g]));
  const userMap = new Map(users.map((u: any) => [u._id, u.name]));

  const getUnit = (type: string) => {
    switch (type) {
      case "milk": return "L";
      case "eggs": return "units";
      case "wool":
      case "honey":
      case "weight": return "kg";
      default: return "";
    }
  };

  return (
    <div className="space-y-8 font-sans text-ink pb-12">
      <header className="border-b border-rule pb-6">
        <Link href="/manager/production" className="text-[10px] text-moss hover:underline uppercase tracking-widest font-mono flex items-center gap-1 mb-4">
          <ArrowLeft className="h-3 w-3" />
          <span>Back to Yield Log</span>
        </Link>
        <h1 className="font-display text-display uppercase text-ink">
          Agribusiness Yield Archive
        </h1>
        <p className="text-xs text-muted font-mono mt-1">Operational ledger log of all agricultural dispatches & weights</p>
      </header>

      <div className="bg-paper border border-rule p-6 space-y-4">
        {history.length === 0 ? (
          <p className="text-xs text-muted italic font-sans">No production yield records logged in the system.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="font-mono text-[9px] text-muted uppercase bg-paper-2 border-b border-rule">
                  <th className="p-3">Log Date</th>
                  <th className="p-3">Source Tag/Code</th>
                  <th className="p-3">Yield Category</th>
                  <th className="p-3">Yield Amount</th>
                  <th className="p-3">Safety Status</th>
                  <th className="p-3">Recorded By</th>
                  <th className="p-3">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-rule font-mono text-[11px]">
                {history.map((record: any) => {
                  let sourceTag = "System";
                  let speciesLabel = "unknown";

                  if (record.livestockId && animalMap.has(record.livestockId)) {
                    const anim = animalMap.get(record.livestockId);
                    sourceTag = `${anim.tagNumber} (${anim.name})`;
                    speciesLabel = anim.species;
                  } else if (record.groupId && groupMap.has(record.groupId)) {
                    const grp = groupMap.get(record.groupId);
                    sourceTag = `${grp.groupCode} (${grp.name})`;
                    speciesLabel = grp.species;
                  }

                  const staffName = userMap.get(record.loggedBy) ?? "Unknown";

                  return (
                    <tr key={record._id} className="hover:bg-paper-2/50 transition-colors">
                      <td className="p-3 font-bold text-ink">{record.date}</td>
                      <td className="p-3 font-sans font-semibold text-ink">
                        {sourceTag}
                        <span className="ml-2 font-mono text-[8px] uppercase tracking-wider text-muted font-bold px-1.5 py-0.5 border border-rule bg-paper">
                          {speciesLabel}
                        </span>
                      </td>
                      <td className="p-3 font-sans font-semibold text-moss uppercase tracking-wider text-[9px]">{record.type}</td>
                      <td className="p-3 font-bold text-ink text-xs">
                        {record.amount.toFixed(1)} {getUnit(record.type)}
                        {record.session && (
                          <span className="text-[9px] font-mono text-muted ml-1.5 font-bold uppercase">
                            ({record.session})
                          </span>
                        )}
                      </td>
                      <td className="p-3">
                        {record.flagged ? (
                          <span className="bg-alert text-cream px-2 py-0.5 text-[9px] font-bold tracking-wider font-mono">
                            WITHHELD
                          </span>
                        ) : (
                          <span className="text-moss px-2 py-0.5 text-[9px] font-bold tracking-wider font-mono bg-moss/5 border border-moss/10">
                            CLEAN
                          </span>
                        )}
                      </td>
                      <td className="p-3 font-sans text-ink font-semibold">{staffName}</td>
                      <td className="p-3 text-muted font-mono text-[10px]">
                        {new Date(record.loggedAt).toLocaleTimeString("en-GB")}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
