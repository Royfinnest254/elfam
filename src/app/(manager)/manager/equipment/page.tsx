"use client";

import React, { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { Tractor, Plus, X, Wrench } from "lucide-react";

type MachineryType = "tractor" | "harvester" | "milking_pump" | "vehicle" | "other";
type MachineryStatus = "operational" | "maintenance" | "broken";
type FuelType = "diesel" | "petrol" | "electric";
type ServiceType = "routine" | "repair" | "overhaul";

const MACHINERY_TYPES: MachineryType[] = ["tractor", "harvester", "milking_pump", "vehicle", "other"];
const STATUSES: MachineryStatus[] = ["operational", "maintenance", "broken"];
const FUEL_TYPES: FuelType[] = ["diesel", "petrol", "electric"];
const SERVICE_TYPES: ServiceType[] = ["routine", "repair", "overhaul"];

const STATUS_STYLE: Record<MachineryStatus, string> = {
  operational: "status-ok",
  maintenance: "status-low",
  broken: "status-out",
};

export default function ManagerEquipmentPage() {
  const machinery = useQuery(api.records.listMachinery, {});
  const maintenanceLogs = useQuery(api.records.listMaintenance, {});

  const createMachineryMut = useMutation(api.records.createMachinery);
  const logMaintenanceMutation = useMutation(api.records.logMaintenance);

  // Registration modal
  const [regOpen, setRegOpen] = useState(false);
  const [regName, setRegName] = useState("");
  const [regType, setRegType] = useState<MachineryType>("tractor");
  const [regPlate, setRegPlate] = useState("");
  const [regStatus, setRegStatus] = useState<MachineryStatus>("operational");
  const [regFuel, setRegFuel] = useState<FuelType>("diesel");
  const [regServiceDate, setRegServiceDate] = useState("");
  const [regNotes, setRegNotes] = useState("");
  const [regSubmitting, setRegSubmitting] = useState(false);

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

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMsg(null);
    setErrorMsg(null);
    if (!regName.trim()) { setErrorMsg("Machine name is required."); return; }
    if (!regServiceDate) { setErrorMsg("Next service date is required."); return; }
    setRegSubmitting(true);
    try {
      await createMachineryMut({
        name: regName.trim(),
        type: regType,
        plateNumber: regPlate.trim(),
        status: regStatus,
        fuelType: regFuel,
        nextServiceDate: new Date(regServiceDate).getTime(),
        notes: regNotes.trim(),
      });
      setStatusMsg("Machine registered successfully.");
      setRegName(""); setRegType("tractor"); setRegPlate(""); setRegStatus("operational");
      setRegFuel("diesel"); setRegServiceDate(""); setRegNotes("");
      setRegOpen(false);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to register machine.");
    } finally {
      setRegSubmitting(false);
    }
  };

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
      setStatusMsg("Maintenance record logged.");
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
    <div className="space-y-6 pb-12">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <p className="label text-[#1A56DB] mb-1">Fleet Management</p>
          <h1 className="text-2xl font-bold text-[#1A56DB]" >
            Equipment &amp; Machinery
          </h1>
          <p className="body-small text-[#5F6368] mt-1">
            Register machines, track status and log maintenance records
          </p>
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => { setStatusMsg(null); setErrorMsg(null); setMaintOpen(true); }}
            className="btn-secondary"
          >
            <Wrench className="h-4 w-4" />
            Log Maintenance
          </button>
          <button
            type="button"
            onClick={() => { setStatusMsg(null); setErrorMsg(null); setRegOpen(true); }}
            className="btn-primary"
          >
            <Plus className="h-4 w-4" />
            Register Machine
          </button>
        </div>
      </header>

      {/* Alerts */}
      {statusMsg && (
        <div className="text-[#15803d] text-sm font-semibold bg-[#f0fdf4] border border-[#bbf7d0] p-4 rounded-lg">
          {statusMsg}
        </div>
      )}
      {errorMsg && (
        <div className="text-[#b91c1c] text-sm font-semibold bg-[#fef2f2] border border-[#fecaca] p-4 rounded-lg">
          {errorMsg}
        </div>
      )}

      {/* Fleet Table */}
      <div className="system-card overflow-hidden">
        <div className="px-6 py-4 border-b border-[#DADCE0] bg-[#F8F9FA]">
          <h3 className="text-xs-label">Fleet Registry — {machinery.length} machine{machinery.length !== 1 ? "s" : ""}</h3>
        </div>
        {machinery.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <Tractor className="h-10 w-10 text-[#D1D5DB] mx-auto mb-3" />
            <p className="text-sm text-[#5F6368]">No machines registered. Click <strong>Register Machine</strong> to add one.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#F8F9FA] border-b border-[#DADCE0]">
                  {["Machine Name", "Type", "Plate No.", "Fuel", "Status", "Next Service"].map((h) => (
                    <th key={h} className="px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-[#5F6368]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F3F4]">
                {machinery.map((m) => (
                  <tr key={m._id} className="hover:bg-[#F8F9FA] transition-colors">
                    <td className="px-5 py-3.5 font-bold text-sm text-[#202124]">{m.name}</td>
                    <td className="px-5 py-3.5 text-sm text-[#5F6368] capitalize">{m.type.replace("_", " ")}</td>
                    <td className="px-5 py-3.5 text-sm font-mono text-[#5F6368]">{m.plateNumber || "—"}</td>
                    <td className="px-5 py-3.5 text-sm text-[#5F6368] capitalize">{m.fuelType}</td>
                    <td className="px-5 py-3.5">
                      <span className={`status-badge ${STATUS_STYLE[m.status as MachineryStatus]}`}>
                        {m.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-[#5F6368]">
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
      <div className="system-card overflow-hidden">
        <div className="px-6 py-4 border-b border-[#DADCE0] bg-[#F8F9FA]">
          <h3 className="text-xs-label">Maintenance Log — {maintenanceLogs.length} record{maintenanceLogs.length !== 1 ? "s" : ""}</h3>
        </div>
        {maintenanceLogs.length === 0 ? (
          <div className="px-6 py-10 text-center text-sm text-[#5F6368]">No maintenance records yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#F8F9FA] border-b border-[#DADCE0]">
                  {["Date", "Machine", "Type", "Description", "Cost (KES)", "Performed By"].map((h) => (
                    <th key={h} className="px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-[#5F6368]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F3F4]">
                {maintenanceLogs.map((log) => {
                  const machine = machinery.find((m) => m._id === log.machineryId);
                  return (
                    <tr key={log._id} className="hover:bg-[#F8F9FA] transition-colors">
                      <td className="px-5 py-3.5 text-sm font-mono text-[#5F6368]">
                        {new Date(log.date).toLocaleDateString("en-GB")}
                      </td>
                      <td className="px-5 py-3.5 text-sm font-bold text-[#202124]">{machine?.name ?? "Unknown"}</td>
                      <td className="px-5 py-3.5">
                        <span className="status-badge status-ok capitalize">{log.type}</span>
                      </td>
                      <td className="px-5 py-3.5 text-sm text-[#5F6368]">{log.description}</td>
                      <td className="px-5 py-3.5 text-sm font-mono font-bold text-[#202124]">
                        {log.cost > 0 ? `KES ${log.cost.toLocaleString()}` : "—"}
                      </td>
                      <td className="px-5 py-3.5 text-sm text-[#5F6368]">{log.performedBy || "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Register Machine Modal */}
      {regOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-[#DADCE0] w-full max-w-lg shadow-xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#DADCE0]">
              <h2 className="text-base font-bold text-[#202124]" >Register Machine</h2>
              <button type="button" onClick={() => setRegOpen(false)} className="text-[#5F6368] hover:text-[#202124] p-1 rounded">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleRegister} className="px-6 py-5 space-y-4">
              <div className="space-y-1">
                <label className="label">Machine Name *</label>
                <input type="text" className="input-field" value={regName} onChange={(e) => setRegName(e.target.value)} placeholder="e.g. John Deere 5075E" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="label">Type *</label>
                  <select className="input-field" value={regType} onChange={(e) => setRegType(e.target.value as MachineryType)}>
                    {MACHINERY_TYPES.map((t) => <option key={t} value={t}>{t.replace("_", " ")}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="label">Fuel Type *</label>
                  <select className="input-field" value={regFuel} onChange={(e) => setRegFuel(e.target.value as FuelType)}>
                    {FUEL_TYPES.map((f) => <option key={f} value={f}>{f}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="label">Plate Number</label>
                  <input type="text" className="input-field" value={regPlate} onChange={(e) => setRegPlate(e.target.value)} placeholder="e.g. KCA 123A" />
                </div>
                <div className="space-y-1">
                  <label className="label">Status *</label>
                  <select className="input-field" value={regStatus} onChange={(e) => setRegStatus(e.target.value as MachineryStatus)}>
                    {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div className="space-y-1">
                <label className="label">Next Service Date *</label>
                <input type="date" className="input-field" value={regServiceDate} onChange={(e) => setRegServiceDate(e.target.value)} required />
              </div>
              <div className="space-y-1">
                <label className="label">Notes</label>
                <input type="text" className="input-field" value={regNotes} onChange={(e) => setRegNotes(e.target.value)} placeholder="Optional notes" />
              </div>
              <div className="flex justify-end gap-3 pt-2 border-t border-[#DADCE0]">
                <button type="button" onClick={() => setRegOpen(false)} className="btn-secondary">Cancel</button>
                <button type="submit" disabled={regSubmitting} className="btn-primary">
                  {regSubmitting ? "Registering..." : "Register Machine"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Log Maintenance Modal */}
      {maintOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-[#DADCE0] w-full max-w-lg shadow-xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#DADCE0]">
              <h2 className="text-base font-bold text-[#202124]" >Log Maintenance</h2>
              <button type="button" onClick={() => setMaintOpen(false)} className="text-[#5F6368] hover:text-[#202124] p-1 rounded">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleLogMaintenance} className="px-6 py-5 space-y-4">
              <div className="space-y-1">
                <label className="label">Machine *</label>
                <select className="input-field" value={selectedMachineId} onChange={(e) => setSelectedMachineId(e.target.value)} required>
                  <option value="">Select machine...</option>
                  {machinery.map((m) => <option key={m._id} value={m._id}>{m.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="label">Service Type *</label>
                  <select className="input-field" value={serviceType} onChange={(e) => setServiceType(e.target.value as ServiceType)}>
                    {SERVICE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="label">Cost (KES)</label>
                  <input type="number" className="input-field" value={cost} onChange={(e) => setCost(e.target.value)} placeholder="0" min="0" />
                </div>
              </div>
              <div className="space-y-1">
                <label className="label">Description *</label>
                <input type="text" className="input-field" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What was done?" required />
              </div>
              <div className="space-y-1">
                <label className="label">Performed By</label>
                <input type="text" className="input-field" value={performedBy} onChange={(e) => setPerformedBy(e.target.value)} placeholder="Technician or mechanic name" />
              </div>
              <div className="space-y-1">
                <label className="label">Notes</label>
                <input type="text" className="input-field" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional notes" />
              </div>
              <div className="flex justify-end gap-3 pt-2 border-t border-[#DADCE0]">
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
