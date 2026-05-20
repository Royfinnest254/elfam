"use client";

import React, { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import Link from "next/link";
import { useAuthActions } from "@convex-dev/auth/react";
import { useRouter } from "next/navigation";
import { 
  Layers, 
  Map, 
  ClipboardList, 
  LogOut, 
  PlusCircle 
} from "lucide-react";

export default function WorkerDashboardPage() {
  const user = useQuery(api.users.viewer);
  const tasks = useQuery(api.records.listTasks);
  const incidents = useQuery(api.records.listIncidents);
  const { signOut } = useAuthActions();
  const router = useRouter();

  const completeTaskMutation = useMutation(api.records.completeTask);
  const addIncidentMutation = useMutation(api.records.addIncident);

  // Incident form state
  const [incTitle, setIncTitle] = useState("");
  const [incDept, setIncDept] = useState<"dairy" | "cereal" | "machinery" | "infrastructure" | "general">("general");
  const [incSeverity, setIncSeverity] = useState<"low" | "medium" | "critical">("medium");
  const [incDesc, setIncDesc] = useState("");

  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push("/signin");
    } catch (error) {
      console.error("[Auth] signOut failed:", error);
    }
  };

  const handleResolve = async (taskId: any) => {
    try {
      await completeTaskMutation({ taskId });
    } catch (e) {
      console.error("Failed to complete task:", e);
    }
  };

  const handleReportIncident = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!user) {
      setErrorMsg("Not authenticated.");
      return;
    }

    if (!incTitle.trim() || !incDesc.trim()) {
      setErrorMsg("Title and description are required.");
      return;
    }

    setSubmitting(true);
    try {
      await addIncidentMutation({
        title: incTitle.trim(),
        department: incDept,
        severity: incSeverity,
        description: incDesc.trim(),
        reportedBy: user._id,
        notes: "",
      });
      setSuccessMsg("Incident successfully submitted to management triaging board.");
      setIncTitle("");
      setIncDesc("");
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setErrorMsg(`Report failed: ${err.message || "Unknown error"}`);
    } finally {
      setSubmitting(false);
    }
  };

  if (user === undefined || tasks === undefined || incidents === undefined) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center font-sans text-muted">
        <span className="body-small block">Loading operational duty sheets...</span>
      </div>
    );
  }

  const myTasks = tasks?.filter((t) => t.assignedTo === user?._id) ?? [];
  const myReportedIncidents = incidents?.filter((inc) => inc.reportedBy === user?._id) ?? [];

  return (
    <div className="max-w-[1024px] mx-auto p-4 md:p-6 space-y-6 pb-20">
      {/* Mobile Top Header Shell */}
      <header className="flex justify-between items-center border-b border-[#DFE1E6] pb-4">
        <div>
          <span className="label block mb-1 text-teal">
            Worker Operations Portal
          </span>
          <h1 className="text-2xl font-normal text-[#0F1B2D] tracking-tight">
            Station Checklist
          </h1>
          <p className="body-small text-[#5E6C84] font-semibold uppercase tracking-wider mt-0.5">
            Crew: {user?.name || "Active Crew Member"}
          </p>
        </div>
        <button
          type="button"
          onClick={handleSignOut}
          className="btn-secondary h-9 px-3 rounded-[6px] text-xs flex items-center gap-1.5 cursor-pointer border-[#DFE1E6]"
        >
          <LogOut className="h-3.5 w-3.5" />
          <span>Sign Out</span>
        </button>
      </header>

      {/* Quick Action Logger Shortcuts (Mobile-optimized cards) */}
      <div className="space-y-3">
        <span className="label text-[#5E6C84] block">
          Station Logging Hub
        </span>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link href="/worker/record/livestock" className="flex items-center justify-between p-4 bg-[#F4F5F7] border border-[#DFE1E6] hover:border-teal rounded-none transition-colors">
            <div className="flex items-center gap-3">
              <div className="p-2 border border-teal/10 bg-teal/5">
                <Layers className="h-5 w-5 text-teal" />
              </div>
              <div className="text-left">
                <span className="text-xs font-bold text-[#0F1B2D] block">Livestock Production</span>
                <span className="body-small text-[#5E6C84]">Log daily yields & treatments</span>
              </div>
            </div>
            <PlusCircle className="h-5 w-5 text-teal" />
          </Link>

          <Link href="/worker/record/crops" className="flex items-center justify-between p-4 bg-[#F4F5F7] border border-[#DFE1E6] hover:border-teal rounded-none transition-colors">
            <div className="flex items-center gap-3">
              <div className="p-2 border border-teal/10 bg-teal/5">
                <Map className="h-5 w-5 text-teal" />
              </div>
              <div className="text-left">
                <span className="text-xs font-bold text-[#0F1B2D] block">Crops & Harvesting</span>
                <span className="body-small text-[#5E6C84]">Log seeding, spraying & yields</span>
              </div>
            </div>
            <PlusCircle className="h-5 w-5 text-teal" />
          </Link>

          <Link href="/worker/record/inventory" className="flex items-center justify-between p-4 bg-[#F4F5F7] border border-[#DFE1E6] hover:border-teal rounded-none transition-colors">
            <div className="flex items-center gap-3">
              <div className="p-2 border border-teal/10 bg-teal/5">
                <ClipboardList className="h-5 w-5 text-teal" />
              </div>
              <div className="text-left">
                <span className="text-xs font-bold text-[#0F1B2D] block">Store Inventory</span>
                <span className="body-small text-[#5E6C84]">Log restocks & withdrawals</span>
              </div>
            </div>
            <PlusCircle className="h-5 w-5 text-teal" />
          </Link>
        </div>
      </div>

      {successMsg && (
        <div className="text-teal text-xs font-bold bg-teal/5 border border-teal/20 p-4 rounded-[4px]">
          {successMsg}
        </div>
      )}
      {errorMsg && (
        <div className="text-alert text-xs font-bold bg-alert/5 border border-alert/20 p-4 rounded-[4px]">
          {errorMsg}
        </div>
      )}

      {/* Main Grid: My Active Tasks vs Report Incident */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Active Tasks List */}
        <div className="lg:col-span-8 space-y-4">
          <div className="system-card p-6 space-y-6 rounded-none">
            <h3 className="text-lg font-normal text-[#0F1B2D] tracking-tight border-b border-[#DFE1E6] pb-4">
              My Assigned Operations Checklist
            </h3>

            {myTasks.length === 0 ? (
              <p className="body-small text-[#5E6C84] italic">
                No duties currently assigned to your station.
              </p>
            ) : (
              <div className="space-y-3">
                {myTasks.map((task) => {
                  const isDone = task.status === "done";
                  return (
                    <div
                      key={task._id}
                      className={`p-4 border flex justify-between items-center rounded-none transition-all ${
                        isDone ? "bg-[#F4F5F7]/60 border-[#DFE1E6] opacity-60" : "bg-white border-[#DFE1E6]"
                      }`}
                    >
                      <div className="space-y-1">
                        <span
                          className={`text-xs font-bold block ${
                            isDone ? "line-through text-[#7A869A]" : "text-[#0F1B2D]"
                          }`}
                        >
                          {task.title}
                        </span>
                        <p className="body-small text-[#5E6C84] font-medium">{task.description}</p>
                        <span className="mono text-[9px] text-[#7A869A] uppercase tracking-wider block font-semibold">
                          DUE BY: {new Date(task.dueDate).toLocaleDateString("en-GB")}
                        </span>
                      </div>
                      {!isDone && (
                        <button
                          type="button"
                          onClick={() => handleResolve(task._id)}
                          className="h-8 px-3 bg-[#0F1B2D] hover:bg-[#0F1B2D]/90 text-white text-[10px] font-bold uppercase tracking-wider rounded-[4px] transition-colors cursor-pointer"
                        >
                          Mark Done
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Quick Incident Reporter */}
        <div className="lg:col-span-4 space-y-4">
          <div className="system-card p-6 space-y-6 rounded-none">
            <h3 className="text-lg font-normal text-[#0F1B2D] tracking-tight border-b border-[#DFE1E6] pb-4">
              Report Field Incident
            </h3>

            <form onSubmit={handleReportIncident} className="space-y-4">
              <div className="space-y-1">
                <label htmlFor="inc-title-input" className="label text-[#5E6C84]">Incident Title / Issue</label>
                <input
                  type="text"
                  id="inc-title-input"
                  required
                  placeholder="e.g. Broken water pipe"
                  value={incTitle}
                  onChange={(e) => setIncTitle(e.target.value)}
                  className="input-field"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label htmlFor="inc-dept-select" className="label text-[#5E6C84]">Department</label>
                  <select
                    id="inc-dept-select"
                    value={incDept}
                    onChange={(e) => setIncDept(e.target.value as any)}
                    className="input-field bg-white cursor-pointer"
                  >
                    <option value="dairy">Dairy / Livestock</option>
                    <option value="cereal">Crops / Fields</option>
                    <option value="machinery">Machinery Fleet</option>
                    <option value="infrastructure">Infrastructure</option>
                    <option value="general">General</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label htmlFor="inc-severity-select" className="label text-[#5E6C84]">Severity</label>
                  <select
                    id="inc-severity-select"
                    value={incSeverity}
                    onChange={(e) => setIncSeverity(e.target.value as any)}
                    className="input-field bg-white cursor-pointer"
                  >
                    <option value="low">Low Risk</option>
                    <option value="medium">Medium Risk</option>
                    <option value="critical">Critical Fault</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label htmlFor="inc-desc-input" className="label text-[#5E6C84]">Describe the Issue</label>
                <textarea
                  id="inc-desc-input"
                  rows={3}
                  required
                  placeholder="Include specific location, affected animals..."
                  value={incDesc}
                  onChange={(e) => setIncDesc(e.target.value)}
                  className="input-field min-h-[80px] py-2"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="btn-primary w-full disabled:opacity-50 h-11 text-xs"
              >
                {submitting ? "Reporting..." : "Report Field Issue"}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Reported Incidents Log */}
      <div className="system-card p-6 space-y-4 rounded-none">
        <h3 className="text-lg font-normal text-[#0F1B2D] border-b border-[#DFE1E6] pb-4">
          My Reported Incidents Log
        </h3>

        {myReportedIncidents.length === 0 ? (
          <p className="body-small text-[#5E6C84] italic">
            No incidents reported by your station.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#DFE1E6] text-[10px] font-semibold text-[#5E6C84] uppercase tracking-wider">
                  <th className="pb-3">Date</th>
                  <th className="pb-3">Incident Title</th>
                  <th className="pb-3">Dept</th>
                  <th className="pb-3">Severity</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3">Latest Resolution Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DFE1E6] text-[#0F1B2D] font-medium">
                {myReportedIncidents.map((inc) => {
                  const isResolved = inc.status === "resolved";
                  const isInvestigating = inc.status === "investigating";
                  const isCritical = inc.severity === "critical";

                  return (
                    <tr key={inc._id} className="hover:bg-[#F4F5F7]/40 transition-colors">
                      <td className="py-3 font-mono text-[10px] text-[#5E6C84]">
                        {new Date(inc.reportedAt).toLocaleDateString("en-GB")}
                      </td>
                      <td className="py-3 font-bold">{inc.title}</td>
                      <td className="py-3 uppercase text-[9px] text-[#5E6C84]">{inc.department}</td>
                      <td className="py-3">
                        <span
                          className={`status-badge text-[9px] uppercase ${
                            isCritical
                              ? "bg-alert/5 border-alert/20 text-alert"
                              : "bg-[#C09E5A]/5 border-[#C09E5A]/20 text-[#C09E5A]"
                          }`}
                        >
                          {inc.severity}
                        </span>
                      </td>
                      <td className="py-3">
                        <span
                          className={`mono text-[9px] font-black uppercase inline-flex items-center gap-1 ${
                            isResolved
                              ? "text-teal"
                              : isInvestigating
                              ? "text-[#C09E5A]"
                              : "text-alert"
                          }`}
                        >
                          {isResolved ? "RESOLVED" : isInvestigating ? "INVESTIGATING" : "PENDING"}
                        </span>
                      </td>
                      <td className="py-3 text-[#5E6C84] italic max-w-[200px] truncate">
                        {inc.notes || "Pending triage review"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
