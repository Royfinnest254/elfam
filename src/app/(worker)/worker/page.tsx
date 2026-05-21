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

const LeafLogo = () => (
  <svg className="w-5 h-5 text-[#1A56DB] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2a15 15 0 0 0-9 13 15 15 0 0 0 18 0 15 15 0 0 0-9-13Z" />
    <path d="M12 2v20" />
  </svg>
);

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
    <div className="max-w-[1024px] mx-auto p-4 md:p-6 space-y-6 pb-20 bg-white">
      {/* Mobile Top Header Shell */}
      <header className="flex justify-between items-center border-b border-gray-200 pb-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider block mb-1 text-[#4B5563]">
            Worker Operations Portal
          </span>
          <h1 className="text-2xl font-bold text-black tracking-tight flex items-center gap-2">
            <LeafLogo />
            Station Checklist¹
          </h1>
          <p className="body-small text-[#4B5563] font-semibold uppercase tracking-wider mt-0.5">
            Crew: {user?.name || "Active Crew Member"}
          </p>
        </div>
        <button
          type="button"
          onClick={handleSignOut}
          className="btn-secondary h-9 px-3 rounded-none text-xs flex items-center gap-1.5 cursor-pointer border-gray-200 text-[#4B5563] hover:bg-gray-50 hover:text-black transition-colors"
        >
          <LogOut className="h-3.5 w-3.5" />
          <span>Sign Out</span>
        </button>
      </header>

      {/* Quick Action Logger Shortcuts (Mobile-optimized cards) */}
      <div className="space-y-3">
        <span className="text-xs font-bold uppercase tracking-wider block text-black flex items-center gap-2">
          <LeafLogo />
          Station Logging Hub²
        </span>
        <div className="grid grid-cols-1 md:grid-cols-3 border-t border-l border-gray-200">
          <Link href="/worker/milk" className="flex items-center justify-between p-4 bg-white border-r border-b border-gray-200 hover:bg-[#E8F0FE]/50 transition-colors">
            <div className="flex items-center gap-3">
              <div className="p-2 border border-[#1A56DB]/10 bg-[#E8F0FE]/30">
                <Layers className="h-5 w-5 text-[#1A56DB]" />
              </div>
              <div className="text-left">
                <span className="text-xs font-bold text-black block">Milk Logging</span>
                <span className="body-small text-[#4B5563]">Log daily yields & treatments</span>
              </div>
            </div>
            <PlusCircle className="h-5 w-5 text-[#1A56DB]" />
          </Link>

          <Link href="/worker/record/crops" className="flex items-center justify-between p-4 bg-white border-r border-b border-gray-200 hover:bg-[#E8F0FE]/50 transition-colors">
            <div className="flex items-center gap-3">
              <div className="p-2 border border-[#1A56DB]/10 bg-[#E8F0FE]/30">
                <Map className="h-5 w-5 text-[#1A56DB]" />
              </div>
              <div className="text-left">
                <span className="text-xs font-bold text-black block">Field Log</span>
                <span className="body-small text-[#4B5563]">Log seeding, spraying & yields</span>
              </div>
            </div>
            <PlusCircle className="h-5 w-5 text-[#1A56DB]" />
          </Link>

          <Link href="/worker/record/inventory" className="flex items-center justify-between p-4 bg-white border-r border-b border-gray-200 hover:bg-[#E8F0FE]/50 transition-colors">
            <div className="flex items-center gap-3">
              <div className="p-2 border border-[#1A56DB]/10 bg-[#E8F0FE]/30">
                <ClipboardList className="h-5 w-5 text-[#1A56DB]" />
              </div>
              <div className="text-left">
                <span className="text-xs font-bold text-black block">Store Inventory</span>
                <span className="body-small text-[#4B5563]">Log restocks & withdrawals</span>
              </div>
            </div>
            <PlusCircle className="h-5 w-5 text-[#1A56DB]" />
          </Link>
        </div>
      </div>

      {successMsg && (
        <div className="text-[#1E8E3E] text-xs font-bold bg-[#E6F4EA] border border-[#A8D5B5] p-4 rounded-none">
          {successMsg}
        </div>
      )}
      {errorMsg && (
        <div className="text-[#D93025] text-xs font-bold bg-[#FCE8E6] border border-[#F5C6C3] p-4 rounded-none">
          {errorMsg}
        </div>
      )}

      {/* Main Grid: My Active Tasks vs Report Incident */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Active Tasks List */}
        <div className="lg:col-span-8 space-y-4">
          <div className="border border-gray-200 bg-white p-6 space-y-6">
            <h3 className="text-lg font-bold text-black tracking-tight border-b border-gray-200 pb-4 flex items-center gap-2">
              <LeafLogo />
              My Assigned Operations Checklist³
            </h3>

            {myTasks.length === 0 ? (
              <p className="body-small text-[#4B5563] italic">
                No duties currently assigned to your station.
              </p>
            ) : (
              <div className="space-y-3">
                {myTasks.map((task) => {
                  const isDone = task.status === "done";
                  return (
                    <div
                      key={task._id}
                      className={`p-4 border flex justify-between items-center transition-all ${
                        isDone ? "bg-white border-gray-200 opacity-60" : "bg-white border-gray-200"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`mt-0.5 flex items-center justify-center w-5 h-5 rounded-full border shrink-0 ${
                          isDone ? "border-[#4B5563] bg-black text-white" : "border-black bg-white text-black"
                        }`}>
                          <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="space-y-1">
                          <span
                            className={`text-xs font-bold block ${
                              isDone ? "line-through text-[#4B5563]" : "text-black"
                            }`}
                          >
                            {task.title}
                          </span>
                          <p className="body-small text-[#4B5563] font-medium">{task.description}</p>
                          <span className="mono text-[9px] text-[#4B5563] uppercase tracking-wider block font-semibold">
                            DUE BY: {new Date(task.dueDate).toLocaleDateString("en-GB")}
                          </span>
                        </div>
                      </div>
                      {!isDone && (
                        <button
                          type="button"
                          onClick={() => handleResolve(task._id)}
                          className="h-8 px-3 bg-[#1A56DB] hover:bg-[#103FA8] text-white text-[10px] font-bold uppercase tracking-wider rounded-none transition-colors cursor-pointer"
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
          <div className="border border-gray-200 bg-white p-6 space-y-6">
            <h3 className="text-lg font-bold text-black tracking-tight border-b border-gray-200 pb-4 flex items-center gap-2">
              <LeafLogo />
              Report Field Incident⁴
            </h3>

            <form onSubmit={handleReportIncident} className="space-y-4">
              <div className="space-y-1">
                <label htmlFor="inc-title-input" className="label text-[#4B5563] font-bold">Incident Title / Issue</label>
                <input
                  type="text"
                  id="inc-title-input"
                  required
                  placeholder="e.g. Broken water pipe"
                  value={incTitle}
                  onChange={(e) => setIncTitle(e.target.value)}
                  className="input-field rounded-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label htmlFor="inc-dept-select" className="label text-[#4B5563] font-bold">Department</label>
                  <select
                    id="inc-dept-select"
                    value={incDept}
                    onChange={(e) => setIncDept(e.target.value as any)}
                    className="input-field bg-white cursor-pointer rounded-none"
                  >
                    <option value="dairy">Dairy / Livestock</option>
                    <option value="cereal">Crops / Fields</option>
                    <option value="machinery">Machinery Fleet</option>
                    <option value="infrastructure">Infrastructure</option>
                    <option value="general">General</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label htmlFor="inc-severity-select" className="label text-[#4B5563] font-bold">Severity</label>
                  <select
                    id="inc-severity-select"
                    value={incSeverity}
                    onChange={(e) => setIncSeverity(e.target.value as any)}
                    className="input-field bg-white cursor-pointer rounded-none"
                  >
                    <option value="low">Low Risk</option>
                    <option value="medium">Medium Risk</option>
                    <option value="critical">Critical Fault</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label htmlFor="inc-desc-input" className="label text-[#4B5563] font-bold">Describe the Issue</label>
                <textarea
                  id="inc-desc-input"
                  rows={3}
                  required
                  placeholder="Include specific location, affected animals..."
                  value={incDesc}
                  onChange={(e) => setIncDesc(e.target.value)}
                  className="input-field min-h-[80px] py-2 rounded-none"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="btn-primary w-full disabled:opacity-50 h-11 text-xs rounded-none"
              >
                {submitting ? "Reporting..." : "Report Field Issue"}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Reported Incidents Log */}
      <div className="border border-gray-200 bg-white p-6 space-y-4">
        <h3 className="text-lg font-bold text-black border-b border-gray-200 pb-4 flex items-center gap-2">
          <LeafLogo />
          My Reported Incidents Log⁵
        </h3>

        {myReportedIncidents.length === 0 ? (
          <p className="body-small text-[#4B5563] italic">
            No incidents reported by your station.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-gray-200 text-[10px] font-semibold text-[#4B5563] uppercase tracking-wider">
                  <th className="pb-3">Date</th>
                  <th className="pb-3">Incident Title</th>
                  <th className="pb-3">Dept</th>
                  <th className="pb-3">Severity</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3">Latest Resolution Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 text-black font-medium">
                {myReportedIncidents.map((inc) => {
                  const isResolved = inc.status === "resolved";
                  const isInvestigating = inc.status === "investigating";
                  const isCritical = inc.severity === "critical";

                  return (
                    <tr key={inc._id} className="hover:bg-gray-50 transition-colors">
                      <td className="py-3 font-mono text-[10px] text-[#4B5563]">
                        {new Date(inc.reportedAt).toLocaleDateString("en-GB")}
                      </td>
                      <td className="py-3 font-bold text-black">{inc.title}</td>
                      <td className="py-3 uppercase text-[9px] text-[#4B5563]">{inc.department}</td>
                      <td className="py-3">
                        <span
                          className={`status-badge text-[9px] uppercase ${
                            isCritical
                              ? "bg-[#FCE8E6] border-[#F5C6C3] text-[#D93025]"
                              : "bg-white border-gray-200 text-[#4B5563]"
                          }`}
                        >
                          {inc.severity}
                        </span>
                      </td>
                      <td className="py-3">
                        <span
                          className={`mono text-[9px] font-black uppercase inline-flex items-center gap-1 ${
                            isResolved
                              ? "text-[#1E8E3E]"
                              : isInvestigating
                              ? "text-[#4B5563]"
                              : "text-[#D93025]"
                          }`}
                        >
                          {isResolved ? "RESOLVED" : isInvestigating ? "INVESTIGATING" : "PENDING"}
                        </span>
                      </td>
                      <td className="py-3 text-[#4B5563] italic max-w-[200px] truncate">
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

      {/* Footnotes */}
      <footer className="mt-8 pt-4 border-t border-gray-100 text-[11px] text-[#4B5563] space-y-1">
        <div>¹ Main operational view listing crew name and active crew station indicators.</div>
        <div>² Quick logger links for registering livestock, crop harvests, and store inventory updates.</div>
        <div>³ Active operational duties and assignments dispatched to your account.</div>
        <div>⁴ Direct logging form for reporting machinery faults or infrastructure issues.</div>
        <div>⁵ Real-time operational history of incidents filed by your user session.</div>
      </footer>
    </div>
  );
}
