"use client";

import React, { useState, useMemo } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { AlertCircle, CheckCircle2, Stethoscope, HeartPulse, ShieldCheck, Plus } from "lucide-react";
import Link from "next/link";

export default function ManagerIncidentsPage() {
  const user = useQuery(api.users.viewer);
  const incidents = useQuery(api.records.listIncidents);
  const livestock = useQuery(api.livestock.list, {});
  const users = useQuery(api.users.list);
  const addIncidentMutation = useMutation(api.records.addIncident);
  const updateIncidentStatusMutation = useMutation(api.records.updateIncidentStatus);
  const logTreatmentMutation = useMutation(api.records.logTreatment);
  const healCowMutation = useMutation(api.records.healCow); // Backend uses this name or healLivestock; both work now

  // New incident form state
  const [title, setTitle] = useState("");
  const [department, setDepartment] = useState<"dairy" | "cereal" | "machinery" | "infrastructure" | "general">("general");
  const [severity, setSeverity] = useState<"low" | "medium" | "critical">("medium");
  const [description, setDescription] = useState("");
  const [notes, setNotes] = useState("");

  // Filters
  const [filterDept, setFilterDept] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  // Status update state
  const [updatingIncidentId, setUpdatingIncidentId] = useState<string | null>(null);
  const [updateStatus, setUpdateStatus] = useState<"open" | "investigating" | "resolved">("open");
  const [updateNotes, setUpdateNotes] = useState("");

  // Treatment inline form state
  const [treatingIncidentId, setTreatingIncidentId] = useState<string | null>(null);
  const [treatLivestockId, setTreatLivestockId] = useState("");
  const [treatCondition, setTreatCondition] = useState("");
  const [treatDrug, setTreatDrug] = useState("");
  const [treatDosage, setTreatDosage] = useState("");
  const [treatWhDays, setTreatWhDays] = useState("");
  const [treatAdminBy, setTreatAdminBy] = useState("");
  const [treatNotes, setTreatNotes] = useState("");

  // Heal form state
  const [healingIncidentId, setHealingIncidentId] = useState<string | null>(null);
  const [healNotes, setHealNotes] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const livestockMap = useMemo(() => {
    const m = new Map<string, any>();
    livestock?.forEach((l: any) => m.set(l._id, l));
    return m;
  }, [livestock]);

  const staffMembers = useMemo(
    () => users?.filter((u: any) => u.role === "manager" || u.role === "worker") ?? [],
    [users]
  );

  const showMsg = (msg: string, isError = false) => {
    if (isError) { setError(msg); setSuccess(null); }
    else { setSuccess(msg); setError(null); }
    setTimeout(() => { setSuccess(null); setError(null); }, 4000);
  };

  const handleReportIncident = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || user === null || !title.trim() || !description.trim()) return;
    setLoading(true);
    try {
      await addIncidentMutation({
        title: title.trim(), department, severity,
        description: description.trim(),
        reportedBy: user._id, notes: notes.trim(),
      });
      showMsg("Incident reported and queued for management review.");
      setTitle(""); setDescription(""); setNotes("");
    } catch (err: any) {
      showMsg(`Log failed: ${err.message || "Unknown error"}`, true);
    } finally { setLoading(false); }
  };

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!updatingIncidentId) return;
    setLoading(true);
    try {
      await updateIncidentStatusMutation({
        incidentId: updatingIncidentId as any,
        status: updateStatus,
        notes: updateNotes.trim(),
      });
      showMsg("Incident status updated.");
      setUpdatingIncidentId(null); setUpdateNotes("");
    } catch (err: any) {
      showMsg(`Update failed: ${err.message}`, true);
    } finally { setLoading(false); }
  };

  const handleLogTreatment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!treatingIncidentId) return;
    if (!treatLivestockId || !treatCondition || !treatDrug || !treatDosage || !treatWhDays || !treatAdminBy) {
      showMsg("Please fill all treatment fields.", true); return;
    }
    setLoading(true);
    try {
      await logTreatmentMutation({
        livestockId: treatLivestockId as any,
        incidentId: treatingIncidentId as any,
        date: Date.now(),
        condition: treatCondition.trim(),
        drugAdministered: treatDrug.trim(),
        dosage: treatDosage.trim(),
        withholdingDays: parseInt(treatWhDays),
        administeredBy: treatAdminBy as any,
        notes: treatNotes.trim(),
      });
      showMsg("VERIFIED: Treatment logged. Incident status updated to Investigating. Withholding period enforced.");
      setTreatingIncidentId(null);
      setTreatLivestockId(""); setTreatCondition(""); setTreatDrug("");
      setTreatDosage(""); setTreatWhDays(""); setTreatAdminBy(""); setTreatNotes("");
    } catch (err: any) {
      showMsg(`Treatment failed: ${err.message}`, true);
    } finally { setLoading(false); }
  };

  const handleHealLivestock = async (e: React.FormEvent, inc: any) => {
    e.preventDefault();
    if (!user || user === null) { showMsg("Not authenticated.", true); return; }
    if (!inc.livestockId) { showMsg("No animal linked to this incident.", true); return; }
    setLoading(true);
    try {
      await healCowMutation({
        livestockId: inc.livestockId as any,
        incidentId: inc._id as any,
        notes: healNotes.trim() || "Animal verified healed by supervisor.",
      });
      showMsg(`VERIFIED: Animal ${livestockMap.get(inc.livestockId)?.tagNumber ?? ""} marked healed. Incident resolved.`);
      setHealingIncidentId(null); setHealNotes("");
    } catch (err: any) {
      showMsg(`Heal failed: ${err.message}`, true);
    } finally { setLoading(false); }
  };

  const getSpeciesEmoji = (species?: string) => {
    if (!species) return "🐾";
    switch (species) {
      case "cattle": return "🐄";
      case "goat": return "🐐";
      case "sheep": return "🐑";
      case "pig": return "🐖";
      default: return "🐾";
    }
  };

  if (incidents === undefined || livestock === undefined) {
    return (
      <div className="font-mono text-xs text-[#5F6368] uppercase tracking-widest p-8">
        Loading incident register...
      </div>
    );
  }

  const filteredIncidents = incidents.filter((inc: any) => {
    const deptOk = filterDept === "all" || inc.department === filterDept;
    const statusOk = filterStatus === "all" || inc.status === filterStatus;
    return deptOk && statusOk;
  });

  return (
    <div className="space-y-8 font-sans text-[#202124] pb-12">
      <header className="border-b border-[#DADCE0] pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <span className="text-[10px] font-black uppercase text-[#5F6368] tracking-[0.2em] block mb-2">
            Operations Risk Control
          </span>
          <h1 className="font-sans text-2xl font-bold uppercase text-[#202124]">
            Incident Triaging Board
          </h1>
          <p className="text-xs text-[#5F6368] font-semibold mt-1 uppercase tracking-wider">
            Observation → Treatment → Supervisor Heal workflow
          </p>
        </div>
        <Link
          href="/manager/treatments/new"
          className="btn-primary h-10 px-5 text-[10px] rounded-[14px] flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          <span>Log Treatment</span>
        </Link>
      </header>

      {success && (
        <div className="bg-[#E3FCEF] border border-[#ABF5D1] text-[#1E8E3E] text-xs font-semibold p-4 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{success}</span>
        </div>
      )}
      {error && (
        <div className="bg-[#FFEBE6] border border-[#FFD2C7] text-[#D93025] text-xs font-semibold p-4">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Report Incident Form */}
        <div className="lg:col-span-4 border border-[#DADCE0] bg-white p-6 space-y-5 self-start">
          <h3 className="text-base font-bold uppercase tracking-tight text-[#202124] border-b border-[#DADCE0] pb-3">
            Report New Incident
          </h3>
          <form onSubmit={handleReportIncident} className="space-y-4">
            <div>
              <label className="text-[10px] font-black text-[#5F6368] uppercase tracking-wider block mb-1">
                Incident Title
              </label>
              <input
                type="text" required
                placeholder="e.g. Mastitis sign in EL-004"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full h-11 border border-[#DADCE0] bg-[#F8F9FA] px-3 text-xs font-bold text-[#202124] focus:outline-none focus:border-primary rounded-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-black text-[#5F6368] uppercase tracking-wider block mb-1">
                  Department
                </label>
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value as any)}
                  className="w-full h-11 border border-[#DADCE0] bg-[#F8F9FA] px-3 text-xs font-bold text-[#202124] focus:outline-none focus:border-primary"
                >
                  <option value="dairy">Dairy Unit</option>
                  <option value="cereal">Cereal Fields</option>
                  <option value="machinery">Machinery</option>
                  <option value="infrastructure">Infrastructure</option>
                  <option value="general">General</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-black text-[#5F6368] uppercase tracking-wider block mb-1">
                  Severity
                </label>
                <select
                  value={severity}
                  onChange={(e) => setSeverity(e.target.value as any)}
                  className="w-full h-11 border border-[#DADCE0] bg-[#F8F9FA] px-3 text-xs font-bold text-[#202124] focus:outline-none focus:border-primary"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
            </div>
            <div>
              <label className="text-[10px] font-black text-[#5F6368] uppercase tracking-wider block mb-1">
                Description
              </label>
              <textarea
                rows={3} required
                placeholder="Describe the exact location, animal ID, symptom..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full border border-[#DADCE0] bg-[#F8F9FA] p-3 text-xs font-semibold text-[#202124] focus:outline-none focus:border-primary resize-none"
              />
            </div>
            <div>
              <label className="text-[10px] font-black text-[#5F6368] uppercase tracking-wider block mb-1">
                Notes (Optional)
              </label>
              <textarea
                rows={2}
                placeholder="Actions taken or team members notified..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full border border-[#DADCE0] bg-[#F8F9FA] p-3 text-xs font-semibold text-[#202124] focus:outline-none focus:border-primary resize-none"
              />
            </div>
            <button
              type="submit" disabled={loading}
              className="w-full h-11 text-[10px] font-bold uppercase tracking-wider bg-primary hover:bg-primary-dark disabled:bg-[#DADCE0] text-white flex items-center justify-center cursor-pointer transition-colors"
            >
              {loading ? "Logging..." : "Report Incident"}
            </button>
          </form>
        </div>

        {/* Incidents Board */}
        <div className="lg:col-span-8 space-y-4">
          {/* Filters */}
          <div className="border border-[#DADCE0] bg-white p-4 flex flex-wrap gap-4 items-center justify-between">
            <span className="text-[10px] font-black uppercase text-[#5F6368] tracking-wider">
              Filter Board
            </span>
            <div className="flex gap-3">
              <select
                value={filterDept}
                onChange={(e) => setFilterDept(e.target.value)}
                className="h-9 border border-[#DADCE0] bg-white px-2.5 text-xs font-bold text-[#202124] focus:outline-none"
              >
                <option value="all">All Departments</option>
                <option value="dairy">Dairy Unit</option>
                <option value="cereal">Cereal Fields</option>
                <option value="machinery">Machinery</option>
                <option value="infrastructure">Infrastructure</option>
                <option value="general">General</option>
              </select>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="h-9 border border-[#DADCE0] bg-white px-2.5 text-xs font-bold text-[#202124] focus:outline-none"
              >
                <option value="all">All Statuses</option>
                <option value="open">Open</option>
                <option value="investigating">Investigating</option>
                <option value="resolved">Resolved</option>
              </select>
            </div>
          </div>

          {/* List */}
          <div className="space-y-4">
            {filteredIncidents.length === 0 ? (
              <div className="border border-[#DADCE0] bg-white p-8 text-center text-xs italic text-[#5F6368]">
                No incidents match the active filters.
              </div>
            ) : (
              filteredIncidents.map((inc: any) => {
                const isCritical = inc.severity === "critical";
                const isMedium = inc.severity === "medium";
                const isResolved = inc.status === "resolved";
                const isInvestigating = inc.status === "investigating";
                const linkedLivestock = inc.livestockId ? livestockMap.get(inc.livestockId) : null;

                return (
                  <div
                    key={inc._id}
                    className={`border p-5 bg-white space-y-4 ${
                      isCritical
                        ? "border-l-4 border-l-[#D04437] border-[#DADCE0]"
                        : isMedium
                        ? "border-l-4 border-l-[#F79238] border-[#DADCE0]"
                        : "border-l-4 border-l-primary border-[#DADCE0]"
                    }`}
                  >
                    {/* Header row */}
                    <div className="flex flex-wrap justify-between items-start gap-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className={`text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 border ${
                              isCritical
                                ? "bg-[#FFEBE6] border-[#FFD2C7] text-[#D93025]"
                                : isMedium
                                ? "bg-[#FFF0B3] border-[#FFE380] text-[#172B4D]"
                                : "bg-[#E8F0FE] border-[#A8C7FA] text-primary"
                            }`}
                          >
                            {inc.severity}
                          </span>
                          <span className="text-[10px] uppercase font-bold text-[#7A869A]">
                            {inc.department}
                          </span>
                          {linkedLivestock && (
                            <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 border bg-[#F8F9FA] border-[#DADCE0] text-[#5F6368]">
                              {getSpeciesEmoji(linkedLivestock.species)} {linkedLivestock.tagNumber} — {linkedLivestock.name}
                            </span>
                          )}
                        </div>
                        <h4 className="text-sm font-bold text-[#202124] uppercase">
                          {inc.title}
                        </h4>
                        <p className="text-[10px] font-mono text-[#7A869A] mt-0.5">
                          {new Date(inc.reportedAt).toLocaleString("en-GB", {
                            day: "2-digit", month: "short",
                            hour: "2-digit", minute: "2-digit",
                          })}
                        </p>
                      </div>

                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider inline-flex items-center gap-1.5 px-2.5 py-1 ${
                          isResolved
                            ? "bg-[#E3FCEF] border border-[#ABF5D1] text-[#1E8E3E]"
                            : isInvestigating
                            ? "bg-[#E8F0FE] border border-[#A8C7FA] text-primary"
                            : "bg-[#FFEBE6] border border-[#FFD2C7] text-[#D93025]"
                        }`}
                      >
                        {isResolved ? <CheckCircle2 className="h-3.5 w-3.5" /> : <AlertCircle className="h-3.5 w-3.5" />}
                        {inc.status}
                      </span>
                    </div>

                    {/* Description */}
                    <p className="text-xs text-[#202124] leading-relaxed">{inc.description}</p>

                    {inc.notes && (
                      <div className="bg-[#F8F9FA] p-3 border border-[#DADCE0] text-xs">
                        <strong className="text-[10px] uppercase text-[#5F6368] block mb-1">Resolution Notes:</strong>
                        <p className="text-[#5F6368] italic">{inc.notes}</p>
                        {inc.resolvedAt && (
                          <span className="text-[9px] font-mono text-[#7A869A] block mt-1">
                            Resolved: {new Date(inc.resolvedAt).toLocaleString("en-GB")}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Action Buttons Row */}
                    {!isResolved && (
                      <div className="flex flex-wrap gap-2 pt-1">
                        {/* Standard triage update */}
                        <button
                           type="button"
                          onClick={() => {
                            setUpdatingIncidentId(updatingIncidentId === inc._id ? null : inc._id);
                            setTreatingIncidentId(null);
                            setHealingIncidentId(null);
                            setUpdateStatus(inc.status);
                            setUpdateNotes(inc.notes || "");
                          }}
                          className="h-8 px-3 text-[9px] font-bold uppercase tracking-wider border border-[#DADCE0] bg-white hover:bg-[#F8F9FA] text-primary flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <AlertCircle className="h-3.5 w-3.5" />
                          Triage Status
                        </button>

                        {/* Log Treatment (only if dairy incident with linked animal) */}
                        {inc.department === "dairy" && inc.livestockId && !isInvestigating && (
                          <button
                            type="button"
                            onClick={() => {
                              setTreatingIncidentId(treatingIncidentId === inc._id ? null : inc._id);
                              setUpdatingIncidentId(null);
                              setHealingIncidentId(null);
                              setTreatLivestockId(inc.livestockId || "");
                            }}
                            className="h-8 px-3 text-[9px] font-bold uppercase tracking-wider border border-[#DADCE0] bg-white hover:bg-[#FFEBE6] text-[#D93025] flex items-center gap-1.5 transition-colors cursor-pointer"
                          >
                            <Stethoscope className="h-3.5 w-3.5" />
                            Administer Treatment
                          </button>
                        )}

                        {/* Heal Animal (only if investigating, dairy, animal linked) */}
                        {isInvestigating && linkedLivestock && (
                          <button
                            type="button"
                            onClick={() => {
                              setHealingIncidentId(healingIncidentId === inc._id ? null : inc._id);
                              setUpdatingIncidentId(null);
                              setTreatingIncidentId(null);
                              setHealNotes("");
                            }}
                            className="h-8 px-3 text-[9px] font-bold uppercase tracking-wider border border-[#ABF5D1] bg-[#E3FCEF] hover:bg-[#C6F6D5] text-[#1E8E3E] flex items-center gap-1.5 transition-colors cursor-pointer"
                          >
                            <ShieldCheck className="h-3.5 w-3.5" />
                            Resolve — Heal Animal
                          </button>
                        )}
                      </div>
                    )}

                    {/* Triage Form */}
                    {updatingIncidentId === inc._id && (
                      <form onSubmit={handleUpdateStatus} className="bg-[#FAFBFC] border border-[#DADCE0] p-4 space-y-3">
                        <h5 className="text-[10px] font-black uppercase text-[#202124] tracking-wider">
                          Update Triage Status
                        </h5>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-[9px] font-black text-[#5F6368] uppercase tracking-wider block mb-1">Status</label>
                            <select
                              value={updateStatus}
                              onChange={(e) => setUpdateStatus(e.target.value as any)}
                              className="w-full h-9 border border-[#DADCE0] bg-white px-2.5 text-xs font-bold text-[#202124] focus:outline-none"
                            >
                              <option value="open">Open</option>
                              <option value="investigating">Investigating</option>
                              <option value="resolved">Resolved</option>
                            </select>
                          </div>
                          <div>
                            <label className="text-[9px] font-black text-[#5F6368] uppercase tracking-wider block mb-1">Notes</label>
                            <input
                              type="text"
                              value={updateNotes}
                              onChange={(e) => setUpdateNotes(e.target.value)}
                              placeholder="Diagnosis, parts fitted..."
                              className="w-full h-9 border border-[#DADCE0] bg-white px-2.5 text-xs font-semibold text-[#202124] focus:outline-none"
                            />
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button type="submit" disabled={loading}
                            className="h-8 px-4 text-[9px] font-bold uppercase tracking-wider bg-primary hover:bg-primary-dark text-white transition-colors cursor-pointer"
                          >
                            Save Status
                          </button>
                          <button type="button" onClick={() => setUpdatingIncidentId(null)}
                            className="h-8 px-4 text-[9px] font-bold uppercase tracking-wider border border-[#DADCE0] bg-white hover:bg-[#F8F9FA] text-[#5F6368] transition-colors cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    )}

                    {/* Treatment Form */}
                    {treatingIncidentId === inc._id && (
                      <form onSubmit={handleLogTreatment} className="bg-[#FFEBE6]/30 border border-[#FFD2C7] p-4 space-y-3">
                        <h5 className="text-[10px] font-black uppercase text-[#D93025] tracking-wider flex items-center gap-1.5">
                          <Stethoscope className="h-3.5 w-3.5" />
                          Administer Veterinary Treatment
                        </h5>
                        {linkedLivestock && (
                          <p className="text-[10px] font-bold text-[#202124]">
                            Animal: {linkedLivestock.tagNumber} — {linkedLivestock.name} ({linkedLivestock.breed})
                          </p>
                        )}
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-[9px] font-black text-[#5F6368] uppercase tracking-wider block mb-1">Condition</label>
                            <input type="text" required value={treatCondition} onChange={(e) => setTreatCondition(e.target.value)}
                              placeholder="e.g. Mastitis"
                              className="w-full h-9 border border-[#DADCE0] bg-white px-2.5 text-xs font-semibold text-[#202124] focus:outline-none" />
                          </div>
                          <div>
                            <label className="text-[9px] font-black text-[#5F6368] uppercase tracking-wider block mb-1">Drug Used</label>
                            <input type="text" required value={treatDrug} onChange={(e) => setTreatDrug(e.target.value)}
                              placeholder="e.g. Penistrep LA"
                              className="w-full h-9 border border-[#DADCE0] bg-white px-2.5 text-xs font-semibold text-[#202124] focus:outline-none" />
                          </div>
                          <div>
                            <label className="text-[9px] font-black text-[#5F6368] uppercase tracking-wider block mb-1">Dosage</label>
                            <input type="text" required value={treatDosage} onChange={(e) => setTreatDosage(e.target.value)}
                              placeholder="e.g. 15ml IM"
                              className="w-full h-9 border border-[#DADCE0] bg-white px-2.5 text-xs font-semibold text-[#202124] focus:outline-none" />
                          </div>
                          <div>
                            <label className="text-[9px] font-black text-[#5F6368] uppercase tracking-wider block mb-1">Withholding (Days)</label>
                            <input type="number" required value={treatWhDays} onChange={(e) => setTreatWhDays(e.target.value)}
                              placeholder="e.g. 5" min="0"
                              className="w-full h-9 border border-[#DADCE0] bg-white px-2.5 text-xs font-semibold text-[#202124] focus:outline-none" />
                          </div>
                          <div className="col-span-2">
                            <label className="text-[9px] font-black text-[#5F6368] uppercase tracking-wider block mb-1">Administered By</label>
                            <select value={treatAdminBy} onChange={(e) => setTreatAdminBy(e.target.value)}
                              className="w-full h-9 border border-[#DADCE0] bg-white px-2.5 text-xs font-bold text-[#202124] focus:outline-none"
                            >
                              <option value="">-- Select Staff --</option>
                              {staffMembers.map((s: any) => (
                                <option key={s._id} value={s._id}>{s.name}</option>
                              ))}
                            </select>
                          </div>
                          <div className="col-span-2">
                            <label className="text-[9px] font-black text-[#5F6368] uppercase tracking-wider block mb-1">Notes</label>
                            <input type="text" value={treatNotes} onChange={(e) => setTreatNotes(e.target.value)}
                              placeholder="Vet recommendation..."
                              className="w-full h-9 border border-[#DADCE0] bg-white px-2.5 text-xs font-semibold text-[#202124] focus:outline-none" />
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button type="submit" disabled={loading}
                            className="h-8 px-4 text-[9px] font-bold uppercase tracking-wider bg-[#D93025] hover:bg-[#B31412] text-white transition-colors cursor-pointer"
                          >
                            <HeartPulse className="h-3 w-3 inline mr-1" />
                            Commit Treatment
                          </button>
                          <button type="button" onClick={() => setTreatingIncidentId(null)}
                            className="h-8 px-4 text-[9px] font-bold uppercase tracking-wider border border-[#DADCE0] bg-white hover:bg-[#F8F9FA] text-[#5F6368] transition-colors cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    )}

                    {/* Heal Form */}
                    {healingIncidentId === inc._id && (
                      <form onSubmit={(e) => handleHealLivestock(e, inc)} className="bg-[#E3FCEF]/40 border border-[#ABF5D1] p-4 space-y-3">
                        <h5 className="text-[10px] font-black uppercase text-[#1E8E3E] tracking-wider flex items-center gap-1.5">
                          <ShieldCheck className="h-3.5 w-3.5" />
                          Supervisor Heal — Clear animal for milking
                        </h5>
                        {linkedLivestock && (
                          <p className="text-[10px] font-bold text-[#202124]">
                            Animal: {linkedLivestock.tagNumber} — {linkedLivestock.name} · Current status: {linkedLivestock.status}
                          </p>
                        )}
                        <div>
                          <label className="text-[9px] font-black text-[#5F6368] uppercase tracking-wider block mb-1">Supervisor Notes</label>
                          <input type="text" value={healNotes} onChange={(e) => setHealNotes(e.target.value)}
                            placeholder="e.g. Vet cleared. Udder healthy. Withholding period elapsed."
                            className="w-full h-9 border border-[#DADCE0] bg-white px-2.5 text-xs font-semibold text-[#202124] focus:outline-none"
                          />
                        </div>
                        <div className="flex gap-2">
                          <button type="submit" disabled={loading}
                            className="h-8 px-4 text-[9px] font-bold uppercase tracking-wider bg-[#1E8E3E] hover:bg-[#166534] text-white transition-colors cursor-pointer"
                          >
                            <ShieldCheck className="h-3 w-3 inline mr-1" />
                            VERIFY — Heal & Resolve
                          </button>
                          <button type="button" onClick={() => setHealingIncidentId(null)}
                            className="h-8 px-4 text-[9px] font-bold uppercase tracking-wider border border-[#DADCE0] bg-white hover:bg-[#F8F9FA] text-[#5F6368] transition-colors cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    )}
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
