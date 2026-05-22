"use client";

import React from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import Link from "next/link";
import { ClipboardList, Tractor, FileText, ArrowRight, Layers, Map } from "lucide-react";

const LeafLogo = () => (
  <svg className="w-5 h-5 text-moss shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2a15 15 0 0 0-9 13 15 15 0 0 0 18 0 15 15 0 0 0-9-13Z" />
    <path d="M12 2v20" />
  </svg>
);

export default function ManagerDashboardPage() {
  const user = useQuery(api.users.viewer);
  
  // Generalized Livestock, Groups, and Field Queries
  const livestock = useQuery(api.livestock.list, {});
  const groups = useQuery(api.livestock.listGroups, {});
  const fields = useQuery(api.records.listFields, {});
  const requests = useQuery(api.records.listRequests, {});
  const machinery = useQuery(api.records.listMachinery, {});
  const tasks = useQuery(api.records.listTasks, {});
  const completeTaskMutation = useMutation(api.records.completeTask);

  // Loading state
  if (
    user === undefined ||
    livestock === undefined ||
    groups === undefined ||
    fields === undefined ||
    requests === undefined ||
    machinery === undefined ||
    tasks === undefined
  ) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center font-sans text-muted">
        <span className="body-small block">Loading dashboard statistics...</span>
      </div>
    );
  }

  // Aggregated Stats
  const totalIndividual = livestock.length;
  const totalGroups = groups.length;
  const totalBirdsAndBees = groups.reduce((sum, g) => sum + g.count, 0);

  const statusCount = livestock.reduce((acc: Record<string, number>, item) => {
    acc[item.status] = (acc[item.status] || 0) + 1;
    return acc;
  }, {});

  const speciesCount = livestock.reduce((acc: Record<string, number>, item) => {
    acc[item.species] = (acc[item.species] || 0) + 1;
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
    <div className="space-y-8 pb-12 bg-paper text-ink">
      <header className="border-b border-rule pb-6">
        <span className="text-[10px] font-mono uppercase tracking-[0.15em] block mb-2 text-muted">
          Operational Center
        </span>
        <h1 className="text-display font-display text-ink tracking-tight flex items-center gap-2.5">
          <LeafLogo />
          Welcome, {user?.name || "Operations Manager"}
        </h1>
        <p className="text-small text-muted mt-1 uppercase tracking-wider font-mono">
          Operations & Management Control Console | Elfam Agribusiness Ledger
        </p>
      </header>

      {/* Stats Grid */}
      <div className="border border-rule bg-paper grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-rule">
        <div className="p-6 flex flex-col justify-between">
          <span className="text-[10px] font-mono font-bold text-ink uppercase tracking-wider block">Livestock Holdings¹</span>
          <span className="text-3xl font-bold text-ink mt-2 block tracking-tight font-sans">
            {totalIndividual} <span className="text-sm font-normal text-muted">Individual</span>
          </span>
          <span className="text-xs text-muted mt-2 block leading-relaxed">
            {Object.entries(speciesCount)
              .map(([species, count]) => `${species}: ${count}`)
              .join(" | ") || "No individual animals registered"}
          </span>
        </div>

        <div className="p-6 flex flex-col justify-between">
          <span className="text-[10px] font-mono font-bold text-ink uppercase tracking-wider block">Group Cohorts²</span>
          <span className="text-3xl font-bold text-ink mt-2 block tracking-tight font-sans">
            {totalGroups} <span className="text-sm font-normal text-muted">Groups ({totalBirdsAndBees} head)</span>
          </span>
          <span className="text-xs text-muted mt-2 block leading-relaxed">
            {groups.map(g => `${g.name}: ${g.count}`).join(" | ") || "No groups registered"}
          </span>
        </div>

        <div className="p-6 flex flex-col justify-between">
          <span className="text-[10px] font-mono font-bold text-ink uppercase tracking-wider block">Field Acreage³</span>
          <span className="text-3xl font-bold text-ink mt-2 block tracking-tight font-sans">
            {totalAcres} <span className="text-sm font-normal text-muted">Acres</span>
          </span>
          <span className="text-xs text-muted mt-2 block leading-relaxed">{fields.length} Crop Fields Managed</span>
        </div>

        <div className="p-6 flex flex-col justify-between">
          <span className="text-[10px] font-mono font-bold text-ink uppercase tracking-wider block">Staff Tasks⁴</span>
          <span className="text-3xl font-bold text-ink mt-2 block tracking-tight font-sans">
            {pendingTasks.length} <span className="text-sm font-normal text-muted">Active Work Orders</span>
          </span>
          <span className="text-xs text-muted mt-2 block leading-relaxed">
            {pendingRequestsCount} pending approval requests
          </span>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Active Work Orders & Pending Requests */}
        <div className="lg:col-span-8 space-y-8">
          {/* Tasks Panel */}
          <div className="border border-rule bg-paper p-6 space-y-6">
            <div className="flex justify-between items-center border-b border-rule pb-4">
              <h3 className="text-h2 font-display text-ink tracking-tight flex items-center gap-2">
                <LeafLogo />
                Active Work Orders
              </h3>
              <Link href="/manager/tasks" className="btn-secondary h-8 px-3 text-xs flex items-center gap-1 rounded-none">
                <span>All Tasks</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            {pendingTasks.length === 0 ? (
              <p className="body-small text-muted italic">All tasks successfully resolved.</p>
            ) : (
              <div className="space-y-4">
                {pendingTasks.slice(0, 5).map((task) => (
                  <div key={task._id} className="flex items-start gap-3 py-3 border-b border-rule last:border-0">
                    <div className="mt-0.5 flex items-center justify-center w-5 h-5 border border-ink bg-paper text-ink shrink-0 rounded-none">
                      <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-sm font-bold text-ink">{task.title}</span>
                        <button
                          type="button"
                          onClick={() => handleCompleteTask(task._id)}
                          className="btn-secondary h-8 px-3 text-xs cursor-pointer rounded-none"
                        >
                          Resolve
                        </button>
                      </div>
                      <p className="text-xs text-muted mt-0.5">{task.description}</p>
                      <span className="text-[10px] text-muted uppercase tracking-wider block mt-1 font-mono">
                        Due: {new Date(task.dueDate).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pending Staff Requests Panel */}
          <div className="border border-rule bg-paper p-6 space-y-6">
            <div className="flex justify-between items-center border-b border-rule pb-4">
              <h3 className="text-h2 font-display text-ink tracking-tight flex items-center gap-2">
                <LeafLogo />
                Pending Staff Requests
              </h3>
              <Link href="/manager/requests" className="btn-secondary h-8 px-3 text-xs flex items-center gap-1 rounded-none">
                <span>Requests Queue</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            {pendingRequestsCount === 0 ? (
              <p className="body-small text-muted italic">No pending requests requiring review.</p>
            ) : (
              <div className="space-y-3">
                {pendingRequests.map((item) => (
                  <div key={item._id} className="flex items-center justify-between p-4 border border-rule bg-paper rounded-none">
                    <div>
                      <span className="status-badge text-[9px] text-moss border-moss/20 bg-cream block mb-1 uppercase font-bold">
                        {item.category}
                      </span>
                      <span className="text-xs font-bold text-ink">{item.title}</span>
                      <span className="body-small text-muted block font-medium">Requested by: {item.requestedByName} &middot; {item.details}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="status-badge text-[9px] text-alert border-alert/20 bg-alert/5 font-bold">
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
          <div className="border border-rule bg-paper p-6 space-y-6">
            <h3 className="text-h2 font-display text-ink tracking-tight flex items-center gap-2">
              <LeafLogo />
              Ledger Shortcuts
            </h3>
            <div className="grid grid-cols-1 gap-3">
              <Link href="/manager/livestock" className="flex items-center gap-3 p-3.5 bg-paper hover:bg-cream border border-rule hover:border-moss transition-colors rounded-none text-xs font-semibold text-moss">
                <Layers className="h-4 w-4 text-moss shrink-0" />
                <span>Livestock Registry</span>
              </Link>
              <Link href="/manager/fields" className="flex items-center gap-3 p-3.5 bg-paper hover:bg-cream border border-rule hover:border-moss transition-colors rounded-none text-xs font-semibold text-moss">
                <Map className="h-4 w-4 text-moss shrink-0" />
                <span>Crops & Fields Register</span>
              </Link>
              <Link href="/manager/inventory" className="flex items-center gap-3 p-3.5 bg-paper hover:bg-cream border border-rule hover:border-moss transition-colors rounded-none text-xs font-semibold text-moss">
                <ClipboardList className="h-4 w-4 text-moss shrink-0" />
                <span>Store Inventory Control</span>
              </Link>
              <Link href="/manager/equipment" className="flex items-center gap-3 p-3.5 bg-paper hover:bg-cream border border-rule hover:border-moss transition-colors rounded-none text-xs font-semibold text-moss">
                <Tractor className="h-4 w-4 text-moss shrink-0" />
                <span>Equipment Registry</span>
              </Link>
              <Link href="/manager/reports" className="flex items-center gap-3 p-3.5 bg-paper hover:bg-cream border border-rule hover:border-moss transition-colors rounded-none text-xs font-semibold text-moss">
                <FileText className="h-4 w-4 text-moss shrink-0" />
                <span>Export Reports Console</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Footnotes */}
      <footer className="mt-8 pt-4 border-t border-rule text-[11px] text-muted space-y-1 font-mono">
        <div>¹ Total count of individual animals currently recorded in the active livestock database.</div>
        <div>² Active livestock groups (e.g. poultry flocks, bee colonies) managed collectively.</div>
        <div>³ Total acreage registered across all active crop management fields.</div>
        <div>⁴ Fleet count of registered machinery and auxiliary support vehicles.</div>
      </footer>
    </div>
  );
}

