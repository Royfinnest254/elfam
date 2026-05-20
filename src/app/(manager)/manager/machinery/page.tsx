"use client";

import React, { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";

export default function MachineryPage() {
  const machineryList = useQuery(api.records.listMachinery);
  const addMachinery = useMutation(api.records.addMachinery);
  const logMaintenance = useMutation(api.records.logMaintenance);

  // Selection state
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Selected machinery maintenance logs
  const selectedIdTyped = selectedId as any;
  const maintenanceLogs = useQuery(
    api.records.listMaintenance,
    selectedId ? { machineryId: selectedIdTyped } : "skip"
  );

  // Add Machinery Form states
  const [name, setName] = useState("");
  const [type, setType] = useState<"tractor" | "harvester" | "milking_pump" | "vehicle" | "other">("tractor");
  const [plateNumber, setPlateNumber] = useState("");
  const [status, setStatus] = useState<"operational" | "maintenance" | "broken">("operational");
  const [fuelType, setFuelType] = useState<"diesel" | "petrol">("diesel");
  const [nextServiceDate, setNextServiceDate] = useState("");
  const [notes, setNotes] = useState("");
  const [machineryError, setMachineryError] = useState<string | null>(null);
  const [machinerySuccess, setMachinerySuccess] = useState<string | null>(null);
  const [submittingMachinery, setSubmittingMachinery] = useState(false);

  // Log Maintenance Form states
  const [mType, setMType] = useState<"routine" | "repair" | "overhaul">("routine");
  const [mDescription, setMDescription] = useState("");
  const [mCost, setMCost] = useState("");
  const [mPerformedBy, setMPerformedBy] = useState("");
  const [mNotes, setMNotes] = useState("");
  const [maintenanceError, setMaintenanceError] = useState<string | null>(null);
  const [maintenanceSuccess, setMaintenanceSuccess] = useState<string | null>(null);
  const [submittingMaintenance, setSubmittingMaintenance] = useState(false);

  if (machineryList === undefined) {
    return (
      <div className="font-mono text-xs text-[#5E6C84] uppercase tracking-widest p-8">
        Loading machinery fleet...
      </div>
    );
  }

  const selectedMachinery = machineryList.find((m) => m._id === selectedId);

  const handleAddMachinery = async (e: React.FormEvent) => {
    e.preventDefault();
    setMachineryError(null);
    setMachinerySuccess(null);
    setSubmittingMachinery(true);

    try {
      const serviceDateTimestamp = nextServiceDate ? new Date(nextServiceDate).getTime() : Date.now();
      await addMachinery({
        name,
        type,
        plateNumber,
        status,
        fuelType,
        nextServiceDate: serviceDateTimestamp,
        notes,
      });

      setMachinerySuccess("MACHINERY ADDED SUCCESSFULLY");
      setName("");
      setPlateNumber("");
      setNotes("");
      setNextServiceDate("");
    } catch (err: any) {
      console.error(err);
      setMachineryError(err.message || "Failed to add machinery.");
    } finally {
      setSubmittingMachinery(false);
    }
  };

  const handleLogMaintenance = async (e: React.FormEvent) => {
    e.preventDefault();
    setMaintenanceError(null);
    setMaintenanceSuccess(null);

    if (!selectedId) {
      setMaintenanceError("Please select a machinery item first.");
      return;
    }

    setSubmittingMaintenance(true);

    const costNum = parseFloat(mCost);
    if (isNaN(costNum) || costNum < 0) {
      setMaintenanceError("Please enter a valid maintenance cost.");
      setSubmittingMaintenance(false);
      return;
    }

    try {
      await logMaintenance({
        machineryId: selectedIdTyped,
        date: Date.now(),
        type: mType,
        description: mDescription,
        cost: costNum,
        performedBy: mPerformedBy,
        notes: mNotes,
      });

      setMaintenanceSuccess("MAINTENANCE LOGGED SUCCESSFULLY");
      setMDescription("");
      setMCost("");
      setMPerformedBy("");
      setMNotes("");
    } catch (err: any) {
      console.error(err);
      setMaintenanceError(err.message || "Failed to log maintenance.");
    } finally {
      setSubmittingMaintenance(false);
    }
  };

  return (
    <div className="space-y-8 font-sans text-[#091E42] pb-12">
      {/* Page Header */}
      <header className="border-b border-[#DFE1E6] pb-6">
        <span className="text-[10px] font-black uppercase text-[#5E6C84] tracking-[0.2em] block mb-2">
          Operations &gt; Fleet Management
        </span>
        <h1 className="font-sans text-2xl font-black uppercase text-[#091E42]">
          Machinery Fleet
        </h1>
        <p className="text-xs text-[#5E6C84] font-semibold mt-1 uppercase tracking-wider">
          Tractors, harvesters, milking pumps, and service registers
        </p>
      </header>

      {/* Main Grid split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Machinery List Container */}
        <div className="lg:col-span-2 card space-y-4">
          <h3 className="text-sm font-black uppercase tracking-wider text-[#091E42] border-b border-[#DFE1E6] pb-3">
            Fleet Register
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-[10px] font-black text-[#5E6C84] uppercase tracking-wider border-b border-[#DFE1E6]">
                  <th className="pb-2">Equipment</th>
                  <th className="pb-2">Type</th>
                  <th className="pb-2">Plate No</th>
                  <th className="pb-2">Fuel</th>
                  <th className="pb-2">Status</th>
                  <th className="pb-2">Next Service</th>
                  <th className="pb-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DFE1E6] font-semibold text-[#091E42]">
                {machineryList.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-4 text-center text-muted italic">
                      No machinery registered in fleet database.
                    </td>
                  </tr>
                ) : (
                  machineryList.map((m) => (
                    <tr 
                      key={m._id} 
                      className={`hover:bg-[#F4F5F7]/30 cursor-pointer ${selectedId === m._id ? "bg-primary-subtle/30" : ""}`}
                      onClick={() => setSelectedId(m._id)}
                    >
                      <td className="py-3 font-bold text-[#091E42]">{m.name}</td>
                      <td className="py-3 capitalize text-[#5E6C84]">{m.type.replace("_", " ")}</td>
                      <td className="py-3 font-mono text-primary">{m.plateNumber}</td>
                      <td className="py-3 capitalize text-[#5E6C84]">{m.fuelType}</td>
                      <td className="py-3">
                        <span className={`status-badge ${
                          m.status === "operational" ? "status-ok" :
                          m.status === "maintenance" ? "bg-[#FFF0B3] text-[#172B4D]" :
                          "bg-[#FFEBE6] text-[#BF2600]"
                        }`}>
                          {m.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-3 font-mono text-[#5E6C84]">
                        {new Date(m.nextServiceDate).toLocaleDateString("en-GB")}
                      </td>
                      <td className="py-3 text-right">
                        <button 
                          type="button"
                          className="btn-secondary text-[10px] py-1 px-2.5"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedId(m._id);
                          }}
                        >
                          View Logs
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Register Machinery Form */}
        <div className="card space-y-4">
          <h3 className="text-sm font-black uppercase tracking-wider text-[#091E42] border-b border-[#DFE1E6] pb-3">
            Register Equipment
          </h3>

          {machineryError && (
            <div className="border border-[#FFBDAD] text-[#BF2600] text-xs p-3 rounded-[4px]">
              [Error] {machineryError}
            </div>
          )}

          {machinerySuccess && (
            <div className="border border-[#ABF5D1] text-[#006644] text-[10px] uppercase tracking-wider font-semibold p-3 rounded-[4px]">
              {machinerySuccess}
            </div>
          )}

          <form onSubmit={handleAddMachinery} className="space-y-4">
            <div className="space-y-1">
              <label htmlFor="mach-name" className="label text-muted">Equipment Name / Model</label>
              <input
                type="text"
                id="mach-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="e.g. Caterpillar Harvester"
                className="input-field"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label htmlFor="mach-type" className="label text-muted">Type</label>
                <select
                  id="mach-type"
                  value={type}
                  onChange={(e) => setType(e.target.value as any)}
                  className="input-field bg-white"
                >
                  <option value="tractor">Tractor</option>
                  <option value="harvester">Harvester</option>
                  <option value="milking_pump">Milking Pump</option>
                  <option value="vehicle">Utility Vehicle</option>
                  <option value="other">Other Equipment</option>
                </select>
              </div>

              <div className="space-y-1">
                <label htmlFor="mach-fuel" className="label text-muted">Fuel Type</label>
                <select
                  id="mach-fuel"
                  value={fuelType}
                  onChange={(e) => setFuelType(e.target.value as any)}
                  className="input-field bg-white"
                >
                  <option value="diesel">Diesel</option>
                  <option value="petrol">Petrol</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label htmlFor="mach-plate" className="label text-muted">Plate / Serial No</label>
                <input
                  type="text"
                  id="mach-plate"
                  value={plateNumber}
                  onChange={(e) => setPlateNumber(e.target.value)}
                  required
                  placeholder="e.g. KCD 445Y"
                  className="input-field"
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="mach-status" className="label text-muted">Status</label>
                <select
                  id="mach-status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="input-field bg-white"
                >
                  <option value="operational">Operational</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="broken">Broken</option>
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label htmlFor="mach-service" className="label text-muted">Next Service Date</label>
              <input
                type="date"
                id="mach-service"
                value={nextServiceDate}
                onChange={(e) => setNextServiceDate(e.target.value)}
                required
                className="input-field"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="mach-notes" className="label text-muted">Operational Notes</label>
              <input
                type="text"
                id="mach-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Gearbox alignment check needed"
                className="input-field"
              />
            </div>

            <button
              type="submit"
              disabled={submittingMachinery}
              className="btn-primary w-full disabled:opacity-50"
            >
              {submittingMachinery ? "Registering..." : "Add to Fleet"}
            </button>
          </form>
        </div>
      </div>

      {/* Maintenance Logs Section for selected machinery */}
      {selectedId && selectedMachinery && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start pt-6 border-t border-[#DFE1E6]">
          {/* Logs Table */}
          <div className="lg:col-span-2 card space-y-4">
            <div className="flex justify-between items-center border-b border-[#DFE1E6] pb-3">
              <h3 className="text-sm font-black uppercase tracking-wider text-[#091E42]">
                Service History: {selectedMachinery.name} ({selectedMachinery.plateNumber})
              </h3>
              <button 
                type="button" 
                className="text-xs text-primary hover:underline"
                onClick={() => setSelectedId(null)}
              >
                Close History
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-[10px] font-black text-[#5E6C84] uppercase tracking-wider border-b border-[#DFE1E6]">
                    <th className="pb-2">Date</th>
                    <th className="pb-2">Type</th>
                    <th className="pb-2">Description</th>
                    <th className="pb-2">Performed By</th>
                    <th className="pb-2 text-right">Cost (KES)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#DFE1E6] font-semibold text-[#091E42]">
                  {maintenanceLogs === undefined ? (
                    <tr>
                      <td colSpan={5} className="py-4 text-center text-muted italic">
                        Loading service history...
                      </td>
                    </tr>
                  ) : maintenanceLogs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-4 text-center text-muted italic">
                        No maintenance history found for this machinery.
                      </td>
                    </tr>
                  ) : (
                    maintenanceLogs.map((log) => (
                      <tr key={log._id} className="hover:bg-[#F4F5F7]/30">
                        <td className="py-3 font-mono text-[#5E6C84]">
                          {new Date(log.date).toLocaleDateString("en-GB")}
                        </td>
                        <td className="py-3">
                          <span className={`badge ${
                            log.type === "routine" ? "border-primary text-primary" :
                            log.type === "repair" ? "border-[#FFF0B3] text-[#172B4D]" :
                            "border-[#BF2600] text-[#BF2600]"
                          }`}>
                            {log.type.toUpperCase()}
                          </span>
                        </td>
                        <td className="py-3 text-[#091E42]" title={log.notes}>
                          {log.description}
                        </td>
                        <td className="py-3 text-[#5E6C84]">{log.performedBy}</td>
                        <td className="py-3 text-right font-mono font-bold text-[#091E42]">
                          KES {log.cost.toLocaleString()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Log Maintenance Form */}
          <div className="card space-y-4">
            <h3 className="text-sm font-black uppercase tracking-wider text-[#091E42] border-b border-[#DFE1E6] pb-3">
              Log Maintenance
            </h3>

            {maintenanceError && (
              <div className="border border-[#FFBDAD] text-[#BF2600] text-xs p-3 rounded-[4px]">
                [Error] {maintenanceError}
              </div>
            )}

            {maintenanceSuccess && (
              <div className="border border-[#ABF5D1] text-[#006644] text-[10px] uppercase tracking-wider font-semibold p-3 rounded-[4px]">
                {maintenanceSuccess}
              </div>
            )}

            <form onSubmit={handleLogMaintenance} className="space-y-4">
              <div className="space-y-1">
                <label htmlFor="maint-type" className="label text-muted">Service Type</label>
                <select
                  id="maint-type"
                  value={mType}
                  onChange={(e) => setMType(e.target.value as any)}
                  className="input-field bg-white"
                >
                  <option value="routine">Routine Service</option>
                  <option value="repair">Repair Service</option>
                  <option value="overhaul">Major Overhaul</option>
                </select>
              </div>

              <div className="space-y-1">
                <label htmlFor="maint-desc" className="label text-muted">Service Description</label>
                <input
                  type="text"
                  id="maint-desc"
                  value={mDescription}
                  onChange={(e) => setMDescription(e.target.value)}
                  required
                  placeholder="e.g. Engine filter replacement"
                  className="input-field"
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="maint-cost" className="label text-muted">Cost (KES)</label>
                <input
                  type="number"
                  id="maint-cost"
                  value={mCost}
                  onChange={(e) => setMCost(e.target.value)}
                  required
                  placeholder="e.g. 8500"
                  className="input-field"
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="maint-by" className="label text-muted">Performed By</label>
                <input
                  type="text"
                  id="maint-by"
                  value={mPerformedBy}
                  onChange={(e) => setMPerformedBy(e.target.value)}
                  required
                  placeholder="e.g. Toyota Kenya Mechanic"
                  className="input-field"
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="maint-notes" className="label text-muted">Additional Notes</label>
                <input
                  type="text"
                  id="maint-notes"
                  value={mNotes}
                  onChange={(e) => setMNotes(e.target.value)}
                  placeholder="e.g. Next inspection in 6 months"
                  className="input-field"
                />
              </div>

              <button
                type="submit"
                disabled={submittingMaintenance}
                className="btn-primary w-full disabled:opacity-50"
              >
                {submittingMaintenance ? "Logging service..." : "Log Service Record"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
