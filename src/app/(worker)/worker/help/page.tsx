"use client";

import React from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { Phone, ShieldAlert, Mail } from "lucide-react";

export default function WorkerHelpPage() {
  const users = useQuery(api.users.list);
  const manager = users?.find((u: any) => u.role === "manager");

  return (
    <div className="space-y-6 text-[#091E42] pb-12">
      <header className="border-b border-[#DFE1E6] pb-4">
        <span className="label block mb-1 text-teal">
          Support Center
        </span>
        <h1 className="text-2xl font-normal text-[#0F1B2D] tracking-tight">
          Help & Contacts
        </h1>
        <p className="body-small text-[#5E6C84] mt-0.5 uppercase tracking-wider font-semibold">Operational procedures and manager contact information</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Contact Manager Card */}
        <div className="lg:col-span-6 system-card p-6 space-y-6 rounded-none">
          <h3 className="text-lg font-normal text-[#0F1B2D] border-b border-[#DFE1E6] pb-4">Contact General Manager</h3>
          {manager ? (
            <div className="space-y-4">
              <div>
                <strong className="text-base font-bold text-[#0F1B2D] block tracking-tight">{manager.name}</strong>
                <span className="status-badge text-[9px] uppercase px-1.5 py-0.5 mt-2 bg-teal/5 border-teal/20 text-teal">
                  {manager.role}
                </span>
              </div>

              <div className="space-y-3 pt-4 border-t border-[#DFE1E6] font-mono text-xs font-semibold text-[#5E6C84]">
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-teal" />
                  <span>{manager.phone ?? "No phone on file"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-teal" />
                  <span>{manager.email}</span>
                </div>
              </div>
            </div>
          ) : (
            <p className="body-small text-[#5E6C84] italic">Manager details loading...</p>
          )}
        </div>

        {/* Safety Guidelines */}
        <div className="lg:col-span-6 system-card p-6 space-y-6 rounded-none">
          <h3 className="text-lg font-normal text-[#0F1B2D] border-b border-[#DFE1E6] pb-4">Safety & Quality Rules</h3>
          <div className="space-y-4 text-xs font-medium text-[#5E6C84] leading-relaxed">
            <div className="flex gap-3 items-start bg-alert/5 border border-alert/20 text-alert p-4 rounded-[4px]">
              <ShieldAlert className="h-5 w-5 shrink-0 mt-0.5 text-alert" />
              <div>
                <strong className="block font-mono text-[10px] uppercase font-bold tracking-wider">Milk Quality lockouts</strong>
                <p className="mt-1 font-sans">
                  Never mix milk from sick animals under medication with the main bulk tank dispatches. Always use separate color-coded buckets.
                </p>
              </div>
            </div>
            <p className="body-small">
              Report any physical injuries or signs of mastitis directly to your manager before starting the AM or PM milking session.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
