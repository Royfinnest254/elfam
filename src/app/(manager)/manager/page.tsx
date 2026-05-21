"use client";

import React from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import Link from "next/link";
import { ClipboardList, Tractor, FileText, ArrowRight, Layers, Map } from "lucide-react";

const LeafLogo = () => (
  <svg className="w-5 h-5 text-[#1A56DB] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2a15 15 0 0 0-9 13 15 15 0 0 0 18 0 15 15 0 0 0-9-13Z" />
    <path d="M12 2v20" />
  </svg>
);

export default function ManagerDashboardPage() {
  const user = useQuery(api.users.viewer);
  
  // Specific Cow & Field Queries
  const cows = useQuery(api.cows.list, {});
  const fields = useQuery(api.records.listFields, {});
  const requests = useQuery(api.records.listRequests, {});
  const machinery = useQuery(api.records.listMachinery, {});
  const tasks = useQuery(api.records.listTasks, {});
  const completeTaskMutation = useMutation(api.records.completeTask);

  // Loading state
  if (user === undefined || cows === undefined || fields === undefined || requests === undefined || machinery === undefined || tasks === undefined) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center font-sans text-muted">
        <span className="body-small block">Loading dashboard statistics...</span>
      </div>
    );
  }

  // Aggregated Stats
  const totalLivestock = cows.length;
  const statusCount = cows.reduce((acc: Record<string, number>, item) => {
    acc[item.status] = (acc[item.status] || 0) + 1;
    return acc;
  }, {});

  const totalAcres = fields.reduce((sum, field) => sum + field.acres, 0);
  const pendingRequests = requests.filter(r => r.status === "pending");
  const pendingRequestsCount = pendingRequests.length;
  const totalMachinery = machinery.length;
  const pendingTasks = tasks.filter(t => t.status !== "done");

  const handleCompleteTask = async (taskId: any) => {
    try {
      await completeTaskMutation({ taskId });
    } catch (e) {
      console.error("Failed to complete task:", e);
    }
  };

  return (
    <div className="space-y-8 pb-12 bg-white text-[#4B5563]">
      <header className="border-b border-gray-200 pb-6">
        <span className="text-xs font-bold uppercase tracking-wider block mb-2 text-[#4B5563]">
          System Overview
        </span>
        <h1 className="text-3xl font-bold text-black tracking-tight flex items-center gap-2.5">
          <LeafLogo />
          Welcome, {user?.name || "Operations Manager"}
        </h1>
        <p className="body-small text-[#4B5563] mt-1 uppercase tracking-wider font-semibold">
          Operations & Management Control Console | Elfam Agribusiness Ledger
        </p>
      </header>

      {/* Stats Grid */}
      <div className="border border-gray-200 bg-white grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-gray-200">
        <div className="p-6 flex flex-col justify-between">
          <span className="text-xs font-bold text-black uppercase tracking-wider block">Herd Size¹</span>
          <span className="text-3xl font-bold text-black mt-2 block tracking-tight font-sans">{totalLivestock} <span className="text-sm font-normal text-[#4B5563]">Cows</span></span>
          <span className="text-xs text-[#4B5563] mt-2 block leading-relaxed">
            {Object.entries(statusCount).map(([status, count]) => `${status}: ${count}`).join(" | ") || "No cows registered"}
          </span>
        </div>

        <div className="p-6 flex flex-col justify-between">
          <span className="text-xs font-bold text-black uppercase tracking-wider block">Field Acreage²</span>
          <span className="text-3xl font-bold text-black mt-2 block tracking-tight font-sans">{totalAcres} <span className="text-sm font-normal text-[#4B5563]">Acres</span></span>
          <span className="text-xs text-[#4B5563] mt-2 block leading-relaxed">{fields.length} Active Fields</span>
        </div>

        <div className="p-6 flex flex-col justify-between">
          <span className="text-xs font-bold text-black uppercase tracking-wider block">Pending Requests³</span>
          <span className={`text-3xl font-bold mt-2 block tracking-tight font-sans ${pendingRequestsCount > 0 ? "text-[#D93025]" : "text-black"}`}>
            {pendingRequestsCount} <span className="text-sm font-normal text-[#4B5563]">Pending</span>
          </span>
          <span className="text-xs text-[#4B5563] mt-2 block leading-relaxed">Awaiting manager validation</span>
        </div>

        <div className="p-6 flex flex-col justify-between">
          <span className="text-xs font-bold text-black uppercase tracking-wider block">Machinery Fleet⁴</span>
          <span className="text-3xl font-bold text-black mt-2 block tracking-tight font-sans">{totalMachinery} <span className="text-sm font-normal text-[#4B5563]">Active</span></span>
          <span className="text-xs text-[#4B5563] mt-2 block leading-relaxed">Equipment & machinery registered</span>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Active Work Orders & Pending Requests */}
        <div className="lg:col-span-8 space-y-8">
          {/* Tasks Panel */}
          <div className="border border-gray-200 bg-white p-6 space-y-6">
            <div className="flex justify-between items-center border-b border-gray-200 pb-4">
              <h3 className="text-lg font-bold text-black tracking-tight flex items-center gap-2">
                <LeafLogo />
                Active Work Orders
              </h3>
              <Link href="/manager/tasks" className="btn-secondary h-8 px-3 rounded-[6px] text-xs flex items-center gap-1">
                <span>All Tasks</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            {pendingTasks.length === 0 ? (
              <p className="body-small text-[#4B5563] italic">All tasks successfully resolved.</p>
            ) : (
              <div className="space-y-4">
                {pendingTasks.slice(0, 5).map((task) => (
                  <div key={task._id} className="flex items-start gap-3 py-3 border-b border-gray-100 last:border-0">
                    <div className="mt-0.5 flex items-center justify-center w-5 h-5 rounded-full border border-black bg-white text-black shrink-0">
                      <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-sm font-bold text-black">{task.title}</span>
                        <button
                          type="button"
                          onClick={() => handleCompleteTask(task._id)}
                          className="btn-secondary h-8 px-3 rounded-[6px] text-xs cursor-pointer"
                        >
                          Resolve
                        </button>
                      </div>
                      <p className="text-xs text-[#4B5563] mt-0.5">{task.description}</p>
                      <span className="text-[10px] text-[#4B5563]/80 uppercase tracking-wider block mt-1">
                        Due: {new Date(task.dueDate).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pending Staff Requests Panel */}
          <div className="border border-gray-200 bg-white p-6 space-y-6">
            <div className="flex justify-between items-center border-b border-gray-200 pb-4">
              <h3 className="text-lg font-bold text-black tracking-tight flex items-center gap-2">
                <LeafLogo />
                Pending Staff Requests
              </h3>
              <Link href="/manager/requests" className="btn-secondary h-8 px-3 rounded-[6px] text-xs flex items-center gap-1">
                <span>Requests Queue</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            {pendingRequestsCount === 0 ? (
              <p className="body-small text-[#4B5563] italic">No pending requests requiring review.</p>
            ) : (
              <div className="space-y-3">
                {pendingRequests.map((item) => (
                  <div key={item._id} className="flex items-center justify-between p-4 border border-gray-200 bg-white rounded-none">
                    <div>
                      <span className="status-badge text-[9px] text-[#1A56DB] border-[#1A56DB]/20 bg-[#E8F0FE] block mb-1 uppercase font-bold">
                        {item.category}
                      </span>
                      <span className="text-xs font-bold text-black">{item.title}</span>
                      <span className="body-small text-[#4B5563] block font-medium">Requested by: {item.requestedByName} &middot; {item.details}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="status-badge text-[9px] text-[#D93025] border-[#D93025]/20 bg-[#FCE8E6] font-bold">
                        PENDING
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: Quick Links / Access Panels */}
        <div className="lg:col-span-4 space-y-8">
          <div className="border border-gray-200 bg-white p-6 space-y-6">
            <h3 className="text-lg font-bold text-black tracking-tight flex items-center gap-2">
              <LeafLogo />
              Ledger Shortcuts
            </h3>
            <div className="grid grid-cols-1 gap-3">
              <Link href="/manager/herd" className="flex items-center gap-3 p-3.5 bg-white hover:bg-[#E8F0FE]/50 border border-gray-200 hover:border-[#1A56DB] transition-colors rounded-none text-xs font-medium text-[#1A56DB]">
                <Layers className="h-4 w-4 text-[#1A56DB] shrink-0 animate-none" />
                <span>Herd Status</span>
              </Link>
              <Link href="/manager/fields" className="flex items-center gap-3 p-3.5 bg-white hover:bg-[#E8F0FE]/50 border border-gray-200 hover:border-[#1A56DB] transition-colors rounded-none text-xs font-medium text-[#1A56DB]">
                <Map className="h-4 w-4 text-[#1A56DB] shrink-0 animate-none" />
                <span>Crops & Fields Register</span>
              </Link>
              <Link href="/manager/inventory" className="flex items-center gap-3 p-3.5 bg-white hover:bg-[#E8F0FE]/50 border border-gray-200 hover:border-[#1A56DB] transition-colors rounded-none text-xs font-medium text-[#1A56DB]">
                <ClipboardList className="h-4 w-4 text-[#1A56DB] shrink-0 animate-none" />
                <span>Store Inventory Control</span>
              </Link>
              <Link href="/manager/equipment" className="flex items-center gap-3 p-3.5 bg-white hover:bg-[#E8F0FE]/50 border border-gray-200 hover:border-[#1A56DB] transition-colors rounded-none text-xs font-medium text-[#1A56DB]">
                <Tractor className="h-4 w-4 text-[#1A56DB] shrink-0 animate-none" />
                <span>Equipment Registry</span>
              </Link>
              <Link href="/manager/reports" className="flex items-center gap-3 p-3.5 bg-white hover:bg-[#E8F0FE]/50 border border-gray-200 hover:border-[#1A56DB] transition-colors rounded-none text-xs font-medium text-[#1A56DB]">
                <FileText className="h-4 w-4 text-[#1A56DB] shrink-0 animate-none" />
                <span>Export Reports Console</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Footnotes */}
      <footer className="mt-8 pt-4 border-t border-gray-100 text-[11px] text-[#4B5563] space-y-1">
        <div>¹ Total count of cows currently recorded in the active herd database.</div>
        <div>² Total acreage registered across all active crop management fields.</div>
        <div>³ Staff requests submitted by workers awaiting manager review and validation.</div>
        <div>⁴ Fleet count of registered machinery and auxiliary support vehicles.</div>
      </footer>
    </div>
  );
}
