"use client";

import React, { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { AlertCircle, CheckCircle2, HelpCircle, Eye, EyeOff, Loader2 } from "lucide-react";

export default function ManagerIncidentsPage() {
  const user = useQuery(api.users.viewer);
  const incidents = useQuery(api.records.listIncidents);
  const addIncidentMutation = useMutation(api.records.addIncident);
  const updateIncidentStatusMutation = useMutation(api.records.updateIncidentStatus);

  // Form state for reporting new incident
  const [title, setTitle] = useState("");
  const [department, setDepartment] = useState<"dairy" | "cereal" | "machinery" | "infrastructure" | "general">("general");
  const [severity, setSeverity] = useState<"low" | "medium" | "critical">("medium");
  const [description, setDescription] = useState("");
  const [notes, setNotes] = useState("");

  // UI state for filters
  const [filterDept, setFilterDept] = useState("all");
  const [filterSeverity, setFilterSeverity] = useState("all");

  // UI state for status updates
  const [updatingIncidentId, setUpdatingIncidentId] = useState<string | null>(null);
  const [updateStatus, setUpdateStatus] = useState<"open" | "investigating" | "resolved">("open");
  const [updateNotes, setUpdateNotes] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleReportIncident = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!user) {
      setError("You must be logged in to report an incident.");
      return;
    }

    if (!title.trim() || !description.trim()) {
      setError("Please fill in the title and description fields.");
      return;
    }

    setLoading(true);
    try {
      await addIncidentMutation({
        title: title.trim(),
        department,
        severity,
        description: description.trim(),
        reportedBy: user._id,
        notes: notes.trim(),
      });
      setSuccess("Incident reported successfully.");
      setTitle("");
      setDescription("");
      setNotes("");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(`[Incident] Log failed: ${err.message || "Unknown error"}`);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!updatingIncidentId) return;

    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      await updateIncidentStatusMutation({
        incidentId: updatingIncidentId as any,
        status: updateStatus,
        notes: updateNotes.trim(),
      });
      setSuccess("Incident status updated successfully.");
      setUpdatingIncidentId(null);
      setUpdateNotes("");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(`[Incident] Update failed: ${err.message || "Unknown error"}`);
    } finally {
      setLoading(false);
    }
  };

  if (incidents === undefined) {
    return (
      <div className="font-mono text-xs text-[#5E6C84] uppercase tracking-widest p-8">
        Loading incident register...
      </div>
    );
  }

  // Filter logic
  const filteredIncidents = incidents.filter((inc) => {
    const deptMatch = filterDept === "all" || inc.department === filterDept;
    const severityMatch = filterSeverity === "all" || inc.severity === filterSeverity;
    return deptMatch && severityMatch;
  });

  return (
    <div className="space-y-8 font-sans text-[#091E42] pb-12">
      <header className="border-b border-[#DFE1E6] pb-6">
        <span className="text-[10px] font-black uppercase text-[#5E6C84] tracking-[0.2em] block mb-2">
          Operations Risk Control
        </span>
        <h1 className="font-sans text-2xl font-bold uppercase text-[#091E42]">
          Incident Triaging Board
        </h1>
        <p className="text-xs text-[#5E6C84] font-semibold mt-1 uppercase tracking-wider">
          Track active machinery faults, boundary fence breaches, or dairy herd health risks
        </p>
      </header>

      {success && (
        <div className="bg-[#E3FCEF] border border-[#ABF5D1] text-[#006644] text-xs font-semibold p-4 rounded-none flex items-center gap-2">
          <HelpCircle className="h-4 w-4" />
          <span>{success}</span>
        </div>
      )}

      {error && (
        <div className="bg-[#FFEBE6] border border-[#FFD2C7] text-[#BF2600] text-xs font-semibold p-4 rounded-none">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Report form */}
        <div className="lg:col-span-4 border border-[#DFE1E6] bg-white p-6 space-y-6 self-start">
          <h3 className="text-base font-bold uppercase tracking-tight text-[#091E42] border-b border-[#DFE1E6] pb-4">
            Report New Incident
          </h3>

          <form onSubmit={handleReportIncident} className="space-y-4">
            <div>
              <label className="text-[10px] font-black text-[#5E6C84] uppercase tracking-wider block mb-1">
                Incident Title
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Mastitis sign in EL-004"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full h-11 border border-[#DFE1E6] bg-white px-3 text-xs font-bold text-[#091E42] focus:outline-none focus:border-primary"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-black text-[#5E6C84] uppercase tracking-wider block mb-1">
                  Department
                </label>
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value as any)}
                  className="w-full h-11 border border-[#DFE1E6] bg-white px-3 text-xs font-bold text-[#091E42] focus:outline-none focus:border-primary"
                >
                  <option value="dairy">Dairy Unit</option>
                  <option value="cereal">Cereal Fields</option>
                  <option value="machinery">Machinery & Fleet</option>
                  <option value="infrastructure">Infrastructure</option>
                  <option value="general">General</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-black text-[#5E6C84] uppercase tracking-wider block mb-1">
                  Severity
                </label>
                <select
                  value={severity}
                  onChange={(e) => setSeverity(e.target.value as any)}
                  className="w-full h-11 border border-[#DFE1E6] bg-white px-3 text-xs font-bold text-[#091E42] focus:outline-none focus:border-primary"
                >
                  <option value="low">Low Risk</option>
                  <option value="medium">Medium Risk</option>
                  <option value="critical">Critical Fault</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-[10px] font-black text-[#5E6C84] uppercase tracking-wider block mb-1">
                Description / Details
              </label>
              <textarea
                rows={4}
                required
                placeholder="Describe the exact location, animal ID, or symptom observations..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full border border-[#DFE1E6] bg-white p-3 text-xs font-semibold text-[#091E42] focus:outline-none focus:border-primary resize-none"
              />
            </div>

            <div>
              <label className="text-[10px] font-black text-[#5E6C84] uppercase tracking-wider block mb-1">
                Immediate Actions / Notes
              </label>
              <textarea
                rows={2}
                placeholder="Actions taken or team members notified..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full border border-[#DFE1E6] bg-white p-3 text-xs font-semibold text-[#091E42] focus:outline-none focus:border-primary resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 text-[10px] font-bold uppercase tracking-wider bg-primary hover:bg-primary-dark disabled:bg-[#DFE1E6] text-white flex items-center justify-center cursor-pointer transition-colors"
            >
              {loading ? "Logging..." : "Report Incident"}
            </button>
          </form>
        </div>

        {/* Board and list */}
        <div className="lg:col-span-8 space-y-6">
          {/* Filters */}
          <div className="border border-[#DFE1E6] bg-white p-4 flex flex-wrap gap-4 items-center justify-between">
            <span className="text-[10px] font-black uppercase text-[#5E6C84] tracking-wider">
              Filter Incidents
            </span>

            <div className="flex gap-4">
              <div>
                <select
                  value={filterDept}
                  onChange={(e) => setFilterDept(e.target.value)}
                  className="h-9 border border-[#DFE1E6] bg-white px-2.5 text-xs font-bold text-[#091E42] focus:outline-none"
                >
                  <option value="all">All Departments</option>
                  <option value="dairy">Dairy Unit</option>
                  <option value="cereal">Cereal Fields</option>
                  <option value="machinery">Machinery & Fleet</option>
                  <option value="infrastructure">Infrastructure</option>
                  <option value="general">General</option>
                </select>
              </div>

              <div>
                <select
                  value={filterSeverity}
                  onChange={(e) => setFilterSeverity(e.target.value)}
                  className="h-9 border border-[#DFE1E6] bg-white px-2.5 text-xs font-bold text-[#091E42] focus:outline-none"
                >
                  <option value="all">All Severities</option>
                  <option value="low">Low Risk</option>
                  <option value="medium">Medium Risk</option>
                  <option value="critical">Critical Fault</option>
                </select>
              </div>
            </div>
          </div>

          {/* Incidents List */}
          <div className="space-y-4">
            {filteredIncidents.length === 0 ? (
              <div className="border border-[#DFE1E6] bg-white p-8 text-center text-xs italic text-[#5E6C84]">
                No logged incidents match the active filters.
              </div>
            ) : (
              filteredIncidents.map((inc) => {
                const isCritical = inc.severity === "critical";
                const isMedium = inc.severity === "medium";
                const isResolved = inc.status === "resolved";
                const isInvestigating = inc.status === "investigating";

                return (
                  <div
                    key={inc._id}
                    className={`border p-6 bg-white ${
                      isCritical
                        ? "border-l-4 border-l-[#D04437] border-[#DFE1E6]"
                        : isMedium
                        ? "border-l-4 border-l-[#F79238] border-[#DFE1E6]"
                        : "border-l-4 border-l-primary border-[#DFE1E6]"
                    }`}
                  >
                    <div className="flex flex-wrap justify-between items-start gap-4 border-b border-[#DFE1E6] pb-4 mb-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 border ${
                              isCritical
                                ? "bg-[#FFEBE6] border-[#FFD2C7] text-[#BF2600]"
                                : isMedium
                                ? "bg-[#FFF0B3] border-[#FFE380] text-[#172B4D]"
                                : "bg-primary-subtle border-primary-subtle text-primary"
                            }`}
                          >
                            {inc.severity} Severity
                          </span>
                          <span className="text-[10px] uppercase font-bold text-[#7A869A]">
                            {inc.department}
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-[#091E42] mt-1.5 uppercase">
                          {inc.title}
                        </h4>
                      </div>

                      <div className="text-right">
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider inline-flex items-center gap-1.5 px-2.5 py-1 ${
                            isResolved
                              ? "bg-[#E3FCEF] border border-[#ABF5D1] text-[#006644]"
                              : isInvestigating
                              ? "bg-primary-subtle border border-primary-subtle text-primary"
                              : "bg-[#FFEBE6] border border-[#FFD2C7] text-[#BF2600]"
                          }`}
                        >
                          {isResolved ? (
                            <CheckCircle2 className="h-3.5 w-3.5" />
                          ) : (
                            <AlertCircle className="h-3.5 w-3.5" />
                          )}
                          {inc.status}
                        </span>
                        <div className="text-[10px] text-[#7A869A] font-mono mt-1">
                          {new Date(inc.reportedAt).toLocaleString("en-GB", {
                            day: "2-digit",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3 text-xs">
                      <p className="text-[#091E42] leading-relaxed">{inc.description}</p>

                      {inc.notes && (
                        <div className="bg-[#F4F5F7] p-3 border border-[#DFE1E6]">
                          <strong className="text-[10px] uppercase text-[#5E6C84] block mb-1">
                            Resolution Log / Notes:
                          </strong>
                          <p className="text-[#5E6C84] italic">{inc.notes}</p>
                          {inc.resolvedAt && (
                            <span className="text-[9px] font-mono text-[#7A869A] block mt-1">
                              Resolved on:{" "}
                              {new Date(inc.resolvedAt).toLocaleString("en-GB", {
                                day: "2-digit",
                                month: "short",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Triaging Action trigger */}
                      {updatingIncidentId === inc._id ? (
                        <form onSubmit={handleUpdateStatus} className="bg-[#FAFBFC] border border-[#DFE1E6] p-4 mt-3 space-y-3">
                          <h5 className="text-[10px] font-black uppercase text-[#091E42] tracking-wider">
                            Update Incident Triage Status
                          </h5>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="text-[9px] font-black text-[#5E6C84] uppercase tracking-wider block mb-1">
                                Status
                              </label>
                              <select
                                value={updateStatus}
                                onChange={(e) => setUpdateStatus(e.target.value as any)}
                                className="w-full h-9 border border-[#DFE1E6] bg-white px-2.5 text-xs font-bold text-[#091E42] focus:outline-none"
                              >
                                <option value="open">Open</option>
                                <option value="investigating">Investigating</option>
                                <option value="resolved">Resolved</option>
                              </select>
                            </div>
                            <div>
                              <label className="text-[9px] font-black text-[#5E6C84] uppercase tracking-wider block mb-1">
                                Resolution notes
                              </label>
                              <input
                                type="text"
                                placeholder="Details of diagnosis, spare parts fitted, etc."
                                value={updateNotes}
                                onChange={(e) => setUpdateNotes(e.target.value)}
                                className="w-full h-9 border border-[#DFE1E6] bg-white px-2.5 text-xs font-semibold text-[#091E42] focus:outline-none"
                              />
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button
                              type="submit"
                              disabled={loading}
                              className="h-8 px-4 text-[9px] font-bold uppercase tracking-wider bg-primary hover:bg-primary-dark text-white transition-colors"
                            >
                              Save Triage Status
                            </button>
                            <button
                              type="button"
                              onClick={() => setUpdatingIncidentId(null)}
                              className="h-8 px-4 text-[9px] font-bold uppercase tracking-wider border border-[#DFE1E6] bg-white hover:bg-[#FAFBFC] text-[#5E6C84] transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        </form>
                      ) : (
                        <div className="pt-2">
                          <button
                            type="button"
                            onClick={() => {
                              setUpdatingIncidentId(inc._id);
                              setUpdateStatus(inc.status);
                              setUpdateNotes(inc.notes || "");
                            }}
                            className="h-8 px-4 text-[9px] font-bold uppercase tracking-wider border border-[#DFE1E6] bg-white hover:bg-[#FAFBFC] text-primary flex items-center gap-1.5 transition-colors"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            <span>Triage / Log Action</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
