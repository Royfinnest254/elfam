"use client";

import React from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { Info } from "lucide-react";

export default function ManagerWorkersPage() {
  const users = useQuery(api.users.list);

  if (users === undefined) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center font-sans text-muted">
        <span className="body-small block">Loading workers crew...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      <header className="border-b border-[#DFE1E6] pb-6">
        <span className="label block mb-2 text-teal">
          Staff Directory
        </span>
        <h1 className="text-3xl font-normal text-[#0F1B2D] tracking-tight">
          Workers Crew
        </h1>
        <p className="body-small text-[#5E6C84] mt-1 uppercase tracking-wider font-semibold">
          Registry of farm operations staff, active roles & contacts
        </p>
      </header>

      {/* Info warning */}
      <div className="flex items-start gap-2.5 bg-teal/5 text-teal p-4 rounded-[4px] border border-teal/20">
        <Info className="h-4.5 w-4.5 shrink-0 mt-0.5" />
        <p className="body-small leading-relaxed font-semibold">
          <strong>Security Notice</strong>: Access to this roster and contact ledger is strictly restricted to Managers on the server side. Workers do not have access to general team lists to ensure data privacy.
        </p>
      </div>

      {/* Table Section */}
      <div className="system-card p-6 rounded-none">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#F4F5F7] border-b border-[#DFE1E6] text-[10px] font-semibold uppercase tracking-wider text-[#5E6C84]">
                <th className="py-4 px-6">Name</th>
                <th className="py-4 px-6">Role</th>
                <th className="py-4 px-6">Email Address</th>
                <th className="py-4 px-6">Phone Contact</th>
                <th className="py-4 px-6">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#DFE1E6] text-xs font-medium text-[#0F1B2D]">
              {users.map((staff: any) => (
                <tr key={staff._id} className="hover:bg-[#F4F5F7]/40 transition-colors">
                  <td className="py-4 px-6 font-bold">{staff.name ?? "Registry User"}</td>
                  <td className="py-4 px-6">
                    <span className={`status-badge text-[9px] border uppercase ${
                      staff.role === "manager"
                        ? "text-[#C09E5A] border-[#C09E5A]/20 bg-[#C09E5A]/5"
                        : "text-teal border-teal/20 bg-teal/5"
                    }`}>
                      {staff.role}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-[#5E6C84] font-mono">{staff.email}</td>
                  <td className="py-4 px-6 text-[#5E6C84] font-mono">{staff.phone ?? "—"}</td>
                  <td className="py-4 px-6">
                    <span className="status-badge text-[9px] text-teal border-teal/20 bg-teal/5 font-bold">
                      ACTIVE
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
