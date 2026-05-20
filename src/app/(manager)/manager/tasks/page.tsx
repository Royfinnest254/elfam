"use client";

import React, { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { Check } from "lucide-react";

export default function ManagerTasksPage() {
  const tasks = useQuery(api.records.listTasks);
  const users = useQuery(api.users.list);
  const completeTaskMutation = useMutation(api.records.completeTask);
  const createTaskMutation = useMutation(api.records.createTask);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [dueDateStr, setDueDateStr] = useState(new Date().toISOString().split("T")[0]);

  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const workers = users?.filter((u: any) => u.role === "worker" || u.role === "manager") ?? [];
  const managerUser = users?.find((u: any) => u.role === "manager");

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!title || !description || !assignedTo) {
      setError("Please fill out all required task fields.");
      return;
    }

    try {
      const assignedBy = managerUser?._id ?? assignedTo; // fallback to self if manager profile load delayed
      await createTaskMutation({
        title,
        description,
        assignedTo: assignedTo as any,
        assignedBy: assignedBy as any,
        dueDate: new Date(dueDateStr).getTime(),
      });

      setSuccess(true);
      setTitle("");
      setDescription("");
      setTimeout(() => setSuccess(false), 3000);
    } catch (e: any) {
      setError(e.message || "Failed to dispatch task.");
    }
  };

  const handleResolveTask = async (taskId: any) => {
    try {
      await completeTaskMutation({ taskId });
    } catch (e) {
      console.error("Resolve task failed:", e);
    }
  };

  if (tasks === undefined || users === undefined) {
    return <div className="text-xs text-[#5E6C84] uppercase font-semibold p-8 font-sans">Loading tasks ledger...</div>;
  }

  return (
    <div className="space-y-8 pb-12 text-[#091E42]">
      <header className="border-b border-[#DFE1E6] pb-6">
        <span className="label block mb-2 text-teal">
          Work Operations
        </span>
        <h1 className="text-3xl font-normal text-[#0F1B2D] tracking-tight">
          Tasks & Workers Checklist
        </h1>
        <p className="body-small text-[#5E6C84] mt-1 uppercase tracking-wider font-semibold">Assign crop/dairy duties and track staff resolutions</p>
      </header>

      {success && (
        <div className="bg-[#E3FCEF] border border-[#ABF5D1] text-[#006644] text-xs font-semibold p-4 rounded-[4px] flex items-center gap-2">
          <Check className="h-4 w-4 text-[#006644]" />
          <span>Task successfully dispatched to team member.</span>
        </div>
      )}

      {error && (
        <div className="bg-[#FFEBE6] border border-[#FFBDAD] text-[#BF2600] text-xs font-semibold p-4 rounded-[4px]">
          [Error] {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Active Tasks List */}
        <div className="lg:col-span-7 system-card p-6 space-y-6 rounded-none">
          <h3 className="text-lg font-normal text-[#0F1B2D] tracking-tight border-b border-[#DFE1E6] pb-4">Active Tasks Register</h3>

          {tasks.length === 0 ? (
            <p className="body-small text-[#5E6C84] italic">No tasks currently registered.</p>
          ) : (
            <div className="space-y-3">
              {tasks.map((task: any) => {
                const assignee = users.find((u: any) => u._id === task.assignedTo);
                const isDone = task.status === "done";
                
                return (
                  <div key={task._id} className={`p-4 border rounded-none flex justify-between items-start ${
                    isDone ? "bg-[#F4F5F7] border-[#DFE1E6] opacity-60" : "bg-white border-[#DFE1E6]"
                  }`}>
                    <div className="space-y-1">
                      <span className={`text-xs font-bold block ${isDone ? "line-through text-[#7A869A]" : "text-[#091E42]"}`}>
                        {task.title}
                      </span>
                      <p className="body-small text-[#5E6C84] font-medium">{task.description}</p>
                      <div className="flex gap-4 font-mono text-[9px] text-[#7A869A] pt-1 font-semibold">
                        <span>ASSIGNEE: {assignee?.name ?? "Staff"}</span>
                        <span>DUE: {new Date(task.dueDate).toLocaleDateString("en-GB")}</span>
                      </div>
                    </div>
                    
                    {!isDone && (
                      <button
                        type="button"
                        onClick={() => handleResolveTask(task._id)}
                        className="h-8 px-3 rounded-[6px] bg-white border border-[#DFE1E6] text-xs font-semibold text-[#091E42] hover:bg-[#F4F5F7] hover:border-[#B3BAC5] transition-colors cursor-pointer"
                      >
                        Resolve
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Create Task Form */}
        <div className="lg:col-span-5 system-card p-6 space-y-6 rounded-none">
          <h3 className="text-lg font-normal text-[#0F1B2D] tracking-tight border-b border-[#DFE1E6] pb-4">Dispatch New Task</h3>
          <form onSubmit={handleCreateTask} className="space-y-4">
            <div className="space-y-1">
              <label htmlFor="task-title" className="label text-[#5E6C84] block mb-1">Task Title</label>
              <input
                type="text"
                id="task-title"
                placeholder="e.g. Silage allocation Block 3"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="input-field"
                required
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="task-desc" className="label text-[#5E6C84] block mb-1">Description</label>
              <textarea
                id="task-desc"
                rows={3}
                placeholder="Enter instructions..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="input-field min-h-[80px] py-2 resize-none"
                required
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="task-assign" className="label text-[#5E6C84] block mb-1">Assign to staff</label>
              <select
                id="task-assign"
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
                className="input-field bg-white"
                required
              >
                <option value="">-- Choose Staff --</option>
                {workers.map((w: any) => (
                  <option key={w._id} value={w._id}>{w.name} ({w.role})</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label htmlFor="task-duedate" className="label text-[#5E6C84] block mb-1">Due Date</label>
              <input
                type="date"
                id="task-duedate"
                value={dueDateStr}
                onChange={(e) => setDueDateStr(e.target.value)}
                className="input-field"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full btn-primary h-11 text-xs"
            >
              Dispatch Task
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
