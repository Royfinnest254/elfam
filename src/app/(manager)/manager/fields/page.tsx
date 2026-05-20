"use client";

import React from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import Link from "next/link";
import { Map, ChevronRight } from "lucide-react";

export default function ManagerFieldsPage() {
  const fields = useQuery(api.records.listFields);

  if (fields === undefined) {
    return <div className="text-xs text-[#5E6C84] uppercase font-black tracking-widest p-8 font-sans">Loading fields registry...</div>;
  }

  return (
    <div className="space-y-8 font-sans text-[#091E42] pb-12">
      <header className="border-b border-[#DFE1E6] pb-6">
        <span className="text-[10px] font-black uppercase text-[#5E6C84] tracking-[0.2em] block mb-2">
          Land Register
        </span>
        <h1 className="font-sans text-2xl font-black uppercase text-[#091E42]">
          Crop Fields
        </h1>
        <p className="text-xs text-[#5E6C84] font-semibold mt-1 uppercase tracking-wider">Managed acreage blocks, crop allocations, and treatments</p>
      </header>

      {/* Grid of Field Plots */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {fields.map((field: any) => (
          <Link
            key={field._id}
            href={`/manager/fields/${field._id}`}
            className="group block system-card p-6 hover:border-primary transition-all cursor-pointer relative"
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <span className="status-badge bg-primary-subtle text-primary border border-primary-subtle text-[9px] uppercase font-black px-2.5 py-1 rounded-lg">
                  {field.crop}
                </span>
                <h3 className="text-base font-black uppercase text-[#091E42] mt-2 group-hover:underline">
                  {field.name}
                </h3>
              </div>
              <Map className="h-5 w-5 text-primary" />
            </div>

            <div className="border-t border-[#DFE1E6] pt-4 space-y-2 text-xs font-semibold text-[#5E6C84]">
              <div className="flex justify-between">
                <span className="text-[10px] font-black text-[#7A869A] uppercase tracking-wider">Size</span>
                <span className="text-[#091E42] font-bold">{field.acres} Acres</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[10px] font-black text-[#7A869A] uppercase tracking-wider">Planted Date</span>
                <span className="text-[#091E42] font-bold">
                  {field.plantedDate ? new Date(field.plantedDate).toLocaleDateString("en-GB") : "Fallow"}
                </span>
              </div>
            </div>

            <div className="absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 transition-all text-primary">
              <ChevronRight className="h-5 w-5" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}


