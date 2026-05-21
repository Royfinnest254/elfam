"use client";

import React from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../../../convex/_generated/api";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Layers, ShieldAlert, Award, ClipboardList } from "lucide-react";

export default function CowProfilePage() {
  const { tagNumber } = useParams();
  const cow = useQuery(api.cows.getByTag, { tagNumber: tagNumber as string });

  const milkingHistory = useQuery(
    api.cows.getMilkingHistory,
    cow ? { cowId: cow._id, limit: 30 } : "skip"
  );
  const calvings = useQuery(
    api.cows.getCalvings,
    cow ? { cowId: cow._id } : "skip"
  );
  const treatments = useQuery(
    api.cows.getTreatments,
    cow ? { cowId: cow._id } : "skip"
  );

  if (cow === undefined || milkingHistory === undefined || calvings === undefined || treatments === undefined) {
    return <div className="text-small text-muted italic p-8 font-sans">Loading cow registry file...</div>;
  }

  if (cow === null) {
    return (
      <div className="space-y-4 text-center py-12 text-navy">
        <h3 className="font-display text-h1 italic">Cow Tag Not Found</h3>
        <p className="text-small text-muted">No registration matches tag number "{tagNumber}".</p>
        <Link href="/manager/herd" className="text-small underline uppercase tracking-wider font-bold">
          Return to herd list
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8 font-sans text-navy">
      <header className="border-b border-rule pb-6">
        <Link href="/manager/herd" className="text-small text-navy hover:text-gold uppercase tracking-wider font-semibold flex items-center gap-1 mb-4">
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Registry</span>
        </Link>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <span className="font-mono text-small uppercase text-muted tracking-wider block">
              Cow Profile File &gt; {cow.tagNumber}
            </span>
            <h1 className="font-display text-display italic text-navy">
              {cow.name}
            </h1>
          </div>
          <span className={`text-small font-mono font-bold uppercase px-3 py-1 border ${
            cow.status === "milking" ? "bg-success/10 text-success border-success/20" :
            cow.status === "treatment" ? "bg-alert/10 text-alert border-alert/20" :
            "bg-[#F8F9FA] text-[#5F6368] border-[#DADCE0]"
          }`}>
            {cow.status}
          </span>
        </div>
      </header>

      {/* Main Profile Info Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Pedigree & Biological telemetry */}
        <div className="lg:col-span-4 bg-paper border border-rule p-6 space-y-6">
          <h3 className="font-display text-h2 italic border-b border-rule pb-3">biological ledger</h3>
          <div className="space-y-4 font-mono text-small">
            <div className="flex justify-between border-b border-rule pb-2">
              <span className="text-muted">Breed</span>
              <span className="font-bold">{cow.breed}</span>
            </div>
            <div className="flex justify-between border-b border-rule pb-2">
              <span className="text-muted">Date of Birth</span>
              <span className="font-bold">{new Date(cow.dateOfBirth).toLocaleDateString("en-GB")}</span>
            </div>
            <div className="flex justify-between border-b border-rule pb-2">
              <span className="text-muted">Lactation No.</span>
              <span className="font-bold">#{cow.currentLactationNumber}</span>
            </div>
            <div className="flex justify-between border-b border-rule pb-2">
              <span className="text-muted">Sire Info</span>
              <span className="font-bold truncate max-w-[180px]" title={cow.sireInfo}>{cow.sireInfo}</span>
            </div>
            <div className="flex justify-between border-b border-rule pb-2">
              <span className="text-muted">Dam Tag</span>
              <span className="font-bold">{cow.damTagNumber}</span>
            </div>
          </div>
          <div className="text-small text-muted italic bg-paper-2 p-3 border border-rule">
            <strong>Notes:</strong> {cow.notes}
          </div>
        </div>

        {/* Dynamic yield and history logs */}
        <div className="lg:col-span-8 space-y-8">
          {/* Milking history */}
          <div className="bg-paper border border-rule p-6 space-y-4">
            <h3 className="font-display text-h2 italic border-b border-rule pb-3">milking history (recent)</h3>
            {milkingHistory.length === 0 ? (
              <p className="text-small text-muted italic">No milking sessions registered.</p>
            ) : (
              <div className="max-h-[220px] overflow-y-auto border border-rule divide-y divide-rule font-mono text-small">
                {milkingHistory.map((session: any) => (
                  <div key={session._id} className="flex justify-between p-3">
                    <span>{session.date} - Session {session.session}</span>
                    <div className="flex items-center gap-2">
                      <span className="font-bold">{session.litres.toFixed(1)} Litres</span>
                      {session.flagged && (
                        <span className="bg-alert text-white px-1.5 py-0.5 text-[9px] font-bold">
                          LOCKED
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Treatments history */}
          <div className="bg-paper border border-rule p-6 space-y-4">
            <h3 className="font-display text-h2 italic border-b border-rule pb-3">medical treatments & withholding</h3>
            {treatments.length === 0 ? (
              <p className="text-small text-muted italic">No treatment history on file.</p>
            ) : (
              <div className="space-y-3 font-sans text-small">
                {treatments.map((t: any) => (
                  <div key={t._id} className="p-4 bg-paper-2 border border-rule">
                    <div className="flex justify-between items-start">
                      <div>
                        <strong>{t.condition}</strong> - Administered <em>{t.drugAdministered}</em> ({t.dosage})
                      </div>
                      <span className="font-mono text-[10px] text-muted">{new Date(t.date).toLocaleDateString()}</span>
                    </div>
                    <p className="text-muted text-small mt-2">{t.notes}</p>
                    <div className="mt-2 font-mono text-[10px] bg-alert/5 text-alert border border-alert/20 px-2 py-1 inline-block">
                      Withholding until {new Date(t.withholdingUntil).toLocaleString()} ({t.withholdingDays} days)
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
