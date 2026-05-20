"use client";

import React from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import Link from "next/link";
import { FileText, ChevronRight } from "lucide-react";

export default function ManagerContractsPage() {
  const contracts = useQuery(api.records.listContracts);

  if (contracts === undefined) {
    return <div className="text-xs text-[#5E6C84] uppercase font-black tracking-widest p-8 font-sans">Loading contract files...</div>;
  }

  return (
    <div className="space-y-8 font-sans text-[#091E42] pb-12">
      <header className="border-b border-[#DFE1E6] pb-6">
        <span className="text-[10px] font-black uppercase text-[#5E6C84] tracking-[0.2em] block mb-2">
          Commercial Ledger
        </span>
        <h1 className="font-sans text-2xl font-black uppercase text-[#091E42]">
          Sales Agreements & Contracts
        </h1>
        <p className="text-xs text-[#5E6C84] font-semibold mt-1 uppercase tracking-wider">Cereal buyer agreements, quotas, pricing, and dispatch targets</p>
      </header>

      {/* Contracts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {contracts.map((contract: any) => {
          const totalVal = contract.contractedBags * contract.pricePerBag;
          const isActive = contract.status === "active";
          
          return (
            <Link
              key={contract._id}
              href={`/manager/contracts/${contract._id}`}
              className="group block system-card p-6 hover:border-primary transition-all cursor-pointer relative"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <span className={`status-badge text-[9px] uppercase font-black px-2.5 py-0.5 rounded-lg border ${
                    isActive 
                      ? "bg-[#E3FCEF] text-[#006644] border-[#ABF5D1]" 
                      : "bg-[#FFF0B3] text-[#172B4D] border-[#FFE380]"
                  }`}>
                    {contract.status}
                  </span>
                  <h3 className="text-base font-black uppercase text-[#091E42] mt-2 group-hover:underline">
                    {contract.buyer}
                  </h3>
                </div>
                <FileText className="h-5 w-5 text-primary" />
              </div>

              <div className="border-t border-[#DFE1E6] pt-4 space-y-2 text-xs font-semibold text-[#5E6C84]">
                <div className="flex justify-between">
                  <span className="text-[10px] font-black text-[#7A869A] uppercase tracking-wider">Season</span>
                  <span className="text-[#091E42] font-bold">{contract.season}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[10px] font-black text-[#7A869A] uppercase tracking-wider">Crop Contracted</span>
                  <span className="text-[#091E42] font-bold uppercase">{contract.crop}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[10px] font-black text-[#7A869A] uppercase tracking-wider">Contracted Weight</span>
                  <span className="text-[#091E42] font-bold">{contract.contractedBags} Bags</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[10px] font-black text-[#7A869A] uppercase tracking-wider">Value Est.</span>
                  <span className="text-primary font-bold">KES {totalVal.toLocaleString()}</span>
                </div>
              </div>

              <div className="absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 transition-all text-primary">
                <ChevronRight className="h-5 w-5" />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}


