"use client";

import React from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../../../convex/_generated/api";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Map, Tractor, Layers } from "lucide-react";

export default function FieldDetailPage() {
  const { fieldId } = useParams();
  const fieldData = useQuery(api.records.getField, { fieldId: fieldId as any });

  if (fieldData === undefined) {
    return <div className="text-small text-muted italic p-8 font-sans">Loading field record...</div>;
  }

  if (fieldData === null) {
    return (
      <div className="space-y-4 text-center py-12 text-navy">
        <h3 className="font-display text-h1 italic">Field Record Not Found</h3>
        <Link href="/manager/fields" className="text-small underline uppercase tracking-wider font-bold">
          Return to fields directory
        </Link>
      </div>
    );
  }

  const { field, applications, harvests } = fieldData;

  return (
    <div className="space-y-8 font-sans text-navy">
      <header className="border-b border-rule pb-6">
        <Link href="/manager/fields" className="text-small text-navy hover:text-gold uppercase tracking-wider font-semibold flex items-center gap-1 mb-4">
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Fields</span>
        </Link>
        <div className="flex justify-between items-end">
          <div>
            <span className="font-mono text-small uppercase text-muted tracking-wider block">
              Field Detail File
            </span>
            <h1 className="font-display text-display italic text-navy">
              {field.name}
            </h1>
          </div>
          <span className="font-mono text-small font-bold uppercase px-3 py-1 bg-paper border border-rule">
            {field.crop}
          </span>
        </div>
      </header>

      {/* Highlights Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-paper border border-rule p-5 font-mono text-small">
          <span className="text-muted block uppercase">Field Size</span>
          <strong className="text-navy text-h2 font-display italic block mt-1">{field.acres} Acres</strong>
        </div>
        <div className="bg-paper border border-rule p-5 font-mono text-small">
          <span className="text-muted block uppercase">Planted Date</span>
          <strong className="text-navy text-h2 font-display italic block mt-1 font-sans font-normal">
            {field.plantedDate ? new Date(field.plantedDate).toLocaleDateString("en-GB") : "Fallow"}
          </strong>
        </div>
        <div className="bg-paper border border-rule p-5 font-mono text-small">
          <span className="text-muted block uppercase">Expected Harvest</span>
          <strong className="text-navy text-h2 font-display italic block mt-1 font-sans font-normal">
            {field.expectedHarvestDate ? new Date(field.expectedHarvestDate).toLocaleDateString("en-GB") : "—"}
          </strong>
        </div>
      </div>

      {/* Field Applications & Treatments */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Spray & Fertilizer application log */}
        <div className="lg:col-span-6 bg-paper border border-rule p-6 space-y-4">
          <h3 className="font-display text-h2 italic border-b border-rule pb-3">Input Applications Log</h3>
          {applications.length === 0 ? (
            <p className="text-small text-muted italic">No input applications recorded.</p>
          ) : (
            <div className="space-y-3 font-sans text-small">
              {applications.map((app: any) => (
                <div key={app._id} className="p-4 bg-paper-2 border border-rule">
                  <div className="flex justify-between items-start">
                    <div>
                      <strong className="uppercase">{app.type}</strong> — {app.product}
                    </div>
                    <span className="font-mono text-[10px] text-muted">{new Date(app.date).toLocaleDateString("en-GB")}</span>
                  </div>
                  <div className="mt-2 font-mono text-[10px] text-navy">
                    Rate: {app.rate}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Harvest records history */}
        <div className="lg:col-span-6 bg-paper border border-rule p-6 space-y-4">
          <h3 className="font-display text-h2 italic border-b border-rule pb-3">Harvest Records</h3>
          {harvests.length === 0 ? (
            <p className="text-small text-muted italic">No harvest yields recorded for this block yet.</p>
          ) : (
            <div className="space-y-3 font-mono text-small font-sans">
              {harvests.map((h: any) => (
                <div key={h._id} className="p-4 bg-paper-2 border border-rule">
                  <div className="flex justify-between">
                    <span className="font-bold uppercase">{h.crop} Harvest</span>
                    <span className="font-bold text-navy">{h.bags} Bags ({h.bagWeightKg} kg/bag)</span>
                  </div>
                  <div className="text-[10px] text-muted mt-2">
                    Date: {new Date(h.date).toLocaleDateString("en-GB")}
                  </div>
                  {h.notes && (
                    <div className="text-[11px] text-muted italic mt-1 font-sans">
                      Notes: {h.notes}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
