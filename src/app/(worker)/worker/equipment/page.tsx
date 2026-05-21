"use client";

import React, { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { Tractor, Wrench } from "lucide-react";

type MachineryStatus = "operational" | "maintenance" | "broken";
type ServiceType = "routine" | "repair" | "overhaul";

const SERVICE_TYPES: ServiceType[] = ["routine", "repair", "overhaul"];

const STATUS_STYLE: Record<MachineryStatus, string> = {
  operational: "status-ok",
  maintenance: "status-low",
  broken: "status-out",
};

export default function WorkerEquipmentPage() {
  const machinery = useQuery(api.records.listMachinery, {});
  const maintenanceLogs = useQuery(api.records.listMaintenance, {});

  const logMaintenanceMutation = useMutation(api.records.logMaintenance);

  // Maintenance log modal
  const [maintOpen, setMaintOpen] = useState(false);
  const [selectedMachineId, setSelectedMachineId] = useState("");
  const [serviceType, setServiceType] = useState<ServiceType>("routine");
  const [description, setDescription] = useState("");
  const [cost, setCost] = useState("");
  const [performedBy, setPerformedBy] = useState("");
  const [notes, setNotes] = useState("");
  const [maintSubmitting, setMaintSubmitting] = useState(false);

  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (machinery === undefined || maintenanceLogs === undefined) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center text-[#5F6368] text-sm">
        Loading machinery fleet...
      </div>
    );
  }

  const handleLogMaintenance = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMsg(null);
    setErrorMsg(null);
    if (!selectedMachineId) { setErrorMsg("Select a machine."); return; }
    if (!description.trim()) { setErrorMsg("Description is required."); return; }
    setMaintSubmitting(true);
    try {
      await logMaintenanceMutation({
        machineryId: selectedMachineId as any,
        date: Date.now(),
        type: serviceType,
        description: description.trim(),
        cost: parseFloat(cost) || 0,
        performedBy: performedBy.trim(),
        notes: notes.trim(),
      });
      setStatusMsg("VERIFIED: Maintenance record logged successfully.");
      setSelectedMachineId(""); setServiceType("routine"); setDescription("");
      setCost(""); setPerformedBy(""); setNotes("");
      setMaintOpen(false);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to log maintenance.");
    } finally {
      setMaintSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <header className="border-b border-[#DADCE0] pb-6 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <span className="label block mb-2 text-teal">
            Fleet Operations
          </span>
          <h1 className="text-3xl font-normal text-[#1A56DB] tracking-tight">
            Equipment &amp; Machinery
          </h1>
          <p className="body-small text-[#5F6368] mt-1 uppercase tracking-wider font-semibold">
            Track active machinery fleet status and log servicing details
          </p>
        </div>
        <button
          type="button"
          onClick={() => { setStatusMsg(null); setErrorMsg(null); setMaintOpen(true); }}
          className="btn-primary"
        >
          <Wrench className="h-4 w-4 mr-2 inline" />
          Log Maintenance
        </button>
      </header>

      {/* Alerts */}
      {statusMsg && (
        <div className="text-teal text-xs font-bold bg-teal/5 border border-teal/20 p-4 rounded-[4px]">
          {statusMsg}
        </div>
      )}
      {errorMsg && (
        <div className="text-alert text-xs font-bold bg-alert/5 border border-alert/20 p-4 rounded-[4px]">
          {errorMsg}
        </div>
      )}

      {/* Fleet Table */}
      <div className="system-card p-6 space-y-4">
        <h3 className="text-lg font-normal text-[#1A56DB] tracking-tight border-b border-[#DADCE0] pb-4">
          Fleet Registry — {machinery.length} Active Machines
        </h3>
        {machinery.length === 0 ? (
          <div className="py-16 text-center">
            <Tractor className="h-10 w-10 text-[#D1D5DB] mx-auto mb-3" />
            <p className="text-sm text-[#5F6368]">No machines registered in database.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#F8F9FA] border-b border-[#DADCE0] text-[10px] font-semibold uppercase tracking-wider text-[#5F6368]">
                  <th className="py-3 px-4">Machine Name</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Plate No.</th>
                  <th className="py-3 px-4">Fuel</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Next Service</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DADCE0] text-xs font-medium text-[#1A56DB]">
                {machinery.map((m) => (
                  <tr key={m._id} className="hover:bg-[#F8F9FA]/40 transition-colors">
                    <td className="py-3.5 px-4 font-bold">{m.name}</td>
                    <td className="py-3.5 px-4 capitalize">{m.type.replace("_", " ")}</td>
                    <td className="py-3.5 px-4 font-mono text-[#5F6368]">{m.plateNumber || "—"}</td>
                    <td className="py-3.5 px-4 capitalize">{m.fuelType}</td>
                    <td className="py-3.5 px-4">
                      <span className={`status-badge text-[9px] border uppercase ${
                        m.status === "operational"
                          ? "text-teal border-teal/20 bg-teal/5"
                          : m.status === "maintenance"
                          ? "text-alert border-alert/20 bg-alert/5"
                          : "text-[#5F6368] border-[#DADCE0] bg-white"
                      }`}>
                        {m.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 mono text-[#5F6368]">
                      {new Date(m.nextServiceDate).toLocaleDateString("en-GB")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Maintenance Logs */}
      <div className="system-card p-6 space-y-4">
        <h3 className="text-lg font-normal text-[#1A56DB] tracking-tight border-b border-[#DADCE0] pb-4">
          Maintenance Log — {maintenanceLogs.length} Records
        </h3>
        {maintenanceLogs.length === 0 ? (
          <div className="py-10 text-center text-sm text-[#5F6368]">No maintenance logs recorded.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#F8F9FA] border-b border-[#DADCE0] text-[10px] font-semibold uppercase tracking-wider text-[#5F6368]">
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Machine</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4 text-right">Cost (KES)</th>
                  <th className="py-3 px-4">Performed By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DADCE0] text-xs font-medium text-[#1A56DB]">
                {maintenanceLogs.map((log) => {
                  const machine = machinery.find((m) => m._id === log.machineryId);
                  return (
                    <tr key={log._id} className="hover:bg-[#F8F9FA]/40 transition-colors">
                      <td className="py-3.5 px-4 font-mono text-[#5F6368]">
                        {new Date(log.date).toLocaleDateString("en-GB")}
                      </td>
                      <td className="py-3.5 px-4 font-bold">{machine?.name ?? "Unknown"}</td>
                      <td className="py-3.5 px-4">
                        <span className="status-badge text-[9px] text-teal border-teal/20 bg-teal/5 uppercase font-bold">
                          {log.type}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-normal text-[#5F6368]">{log.description}</td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold">
                        {log.cost > 0 ? `KES ${log.cost.toLocaleString()}` : "—"}
                      </td>
                      <td className="py-3.5 px-4 font-normal text-[#5F6368]">{log.performedBy || "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Log Maintenance Modal */}
      {maintOpen && (
        <div className="fixed inset-0 bg-[#202124]/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white border-2 border-[#1A56DB] w-full max-w-lg p-6 space-y-6 rounded-[6px]">
            <div className="flex justify-between items-start border-b border-[#DADCE0] pb-3">
              <h2 className="text-xl font-normal text-[#1A56DB]">Log Equipment Maintenance</h2>
              <button
                type="button"
                onClick={() => setMaintOpen(false)}
                className="text-[#5F6368] hover:text-[#1A56DB] text-lg font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleLogMaintenance} className="space-y-4">
              <div className="space-y-1">
                <label htmlFor="machine-select" className="label text-[#5F6368]">Select Machine / Tool *</label>
                <select
                  id="machine-select"
                  className="input-field bg-white"
                  value={selectedMachineId}
                  onChange={(e) => setSelectedMachineId(e.target.value)}
                  required
                >
                  <option value="">-- Choose Equipment --</option>
                  {machinery.map((m) => (
                    <option key={m._id} value={m._id}>{m.name} ({m.plateNumber || "No Plate"})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label htmlFor="service-type" className="label text-[#5F6368]">Maintenance Type *</label>
                  <select
                    id="service-type"
                    className="input-field bg-white"
                    value={serviceType}
                    onChange={(e) => setServiceType(e.target.value as ServiceType)}
                  >
                    {SERVICE_TYPES.map((t) => <option key={t} value={t}>{t.toUpperCase()}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label htmlFor="service-cost" className="label text-[#5F6368]">Service Cost (KES)</label>
                  <input
                    type="number"
                    id="service-cost"
                    className="input-field"
                    value={cost}
                    onChange={(e) => setCost(e.target.value)}
                    placeholder="e.g. 15000"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label htmlFor="service-perf" className="label text-[#5F6368]">Service Provider / Staff Name</label>
                <input
                  type="text"
                  id="service-perf"
                  className="input-field"
                  value={performedBy}
                  onChange={(e) => setPerformedBy(e.target.value)}
                  placeholder="e.g. Connex Garage Ltd"
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="service-desc" className="label text-[#5F6368]">Service Description *</label>
                <input
                  type="text"
                  id="service-desc"
                  className="input-field"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Replaced fuel filter and hydraulic oil"
                  required
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="service-notes" className="label text-[#5F6368]">Technical Notes</label>
                <textarea
                  id="service-notes"
                  className="input-field min-h-[80px] py-2"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Optional details, next checkup advice..."
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-[#DADCE0]">
                <button type="button" onClick={() => setMaintOpen(false)} className="btn-secondary">Cancel</button>
                <button type="submit" disabled={maintSubmitting} className="btn-primary">
                  {maintSubmitting ? "Logging..." : "Log Maintenance"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
