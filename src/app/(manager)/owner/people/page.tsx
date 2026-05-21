"use client";

import React from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";

export default function OwnerPeoplePage() {
  const users = useQuery(api.users.list);

  if (users === undefined) {
    return (
      <div className="font-mono text-xs text-[#5F6368] uppercase tracking-widest p-8">
        Loading staff directory...
      </div>
    );
  }

  return (
    <div className="space-y-8 font-sans text-[#202124] pb-12">
      {/* Page Title & Header */}
      <header className="border-b border-[#DADCE0] pb-6">
        <span className="text-[10px] font-black uppercase text-[#5F6368] tracking-[0.2em] block mb-2">
          Executive Ledger &gt; Staff
        </span>
        <h1 className="font-sans text-2xl font-black uppercase text-[#202124]">
          People
        </h1>
        <p className="text-xs text-[#5F6368] font-semibold mt-1 uppercase tracking-wider">
          Directory of farm operations staff and contacts
        </p>
      </header>

      {/* Tabular List Section */}
      <section className="bg-white border border-[#DADCE0] p-6 rounded-[24px] space-y-4">
        <h3 className="text-sm font-black uppercase tracking-wider text-[#202124] border-b border-[#DADCE0] pb-3">
          Operations Team Roster
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="text-[10px] font-black text-[#5F6368] uppercase tracking-wider border-b border-[#DADCE0]">
                <th className="pb-2">Name</th>
                <th className="pb-2">Role</th>
                <th className="pb-2">Email</th>
                <th className="pb-2">Phone</th>
                <th className="pb-2">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#DADCE0] font-semibold text-[#202124]">
              {users.map((staff: any) => (
                <tr key={staff._id} className="hover:bg-[#F8F9FA]/30">
                  <td className="py-4 font-bold">{staff.name ?? "Registry User"}</td>
                  <td className="py-4">
                    <span className={`status-badge uppercase text-[9px] px-2 py-0.5 ${
                      staff.role === "owner" ? "bg-primary-subtle text-primary border-primary-subtle" :
                      staff.role === "manager" ? "bg-[#FFF0B3] text-[#172B4D] border-[#FFF0B3]" :
                      "bg-[#F8F9FA] text-[#5F6368] border-[#DADCE0]"
                    }`}>
                      {staff.role}
                    </span>
                  </td>
                  <td className="py-4 text-[#5F6368] font-mono">{staff.email}</td>
                  <td className="py-4 text-[#5F6368] font-mono">{staff.phone ?? "—"}</td>
                  <td className="py-4">
                    <span className="status-badge status-ok text-[9px] uppercase px-1.5 py-0.5">
                      ACTIVE
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
