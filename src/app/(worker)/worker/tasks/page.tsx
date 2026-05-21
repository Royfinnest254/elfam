"use client";

import React, { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { Check } from "lucide-react";

export default function WorkerTasksPage() {
  const user = useQuery(api.users.viewer);
  const tasks = useQuery(api.records.listTasks);
  const completeTaskMutation = useMutation(api.records.completeTask);

  const handleResolveTask = async (taskId: any) => {
    try {
      await completeTaskMutation({ taskId });
    } catch (e) {
      console.error("Resolve task failed:", e);
    }
  };

  if (tasks === undefined || user === undefined) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center text-xs text-[#5F6368] uppercase font-semibold p-8 font-sans">
        Loading tasks checklist...
      </div>
    );
  }

  // Filter tasks assigned to current worker
  const myTasks = tasks.filter((t) => t.assignedTo === user?._id);

  return (
    <div className="space-y-8 pb-12 text-[#202124]">
      <header className="border-b border-[#DADCE0] pb-6">
        <span className="label block mb-2 text-teal">
          Duty Checklist
        </span>
        <h1 className="text-3xl font-normal text-[#1A56DB] tracking-tight">
          Assigned Tasks
        </h1>
        <p className="body-small text-[#5F6368] mt-1 uppercase tracking-wider font-semibold">
          Review tasks and mark resolved upon completion of duty
        </p>
      </header>

      <div className="system-card p-6 space-y-6 rounded-none">
        <h3 className="text-lg font-normal text-[#1A56DB] tracking-tight border-b border-[#DADCE0] pb-4">
          My Operational Checklist ({myTasks.length})
        </h3>

        {myTasks.length === 0 ? (
          <p className="body-small text-[#5F6368] italic">No duties currently assigned to your station.</p>
        ) : (
          <div className="space-y-3">
            {myTasks.map((task) => {
              const isDone = task.status === "done";
              return (
                <div key={task._id} className={`p-4 border rounded-none flex justify-between items-start ${
                  isDone ? "bg-[#F8F9FA] border-[#DADCE0] opacity-60" : "bg-white border-[#DADCE0]"
                }`}>
                  <div className="space-y-1">
                    <span className={`text-xs font-bold block ${isDone ? "line-through text-[#7A869A]" : "text-[#202124]"}`}>
                      {task.title}
                    </span>
                    <p className="body-small text-[#5F6368] font-medium">{task.description}</p>
                    <div className="flex gap-4 font-mono text-[9px] text-[#7A869A] pt-1 font-semibold">
                      <span>DUE: {new Date(task.dueDate).toLocaleDateString("en-GB")}</span>
                      {task.completedAt && (
                        <span>RESOLVED: {new Date(task.completedAt).toLocaleDateString("en-GB")}</span>
                      )}
                    </div>
                  </div>
                  
                  {!isDone && (
                    <button
                      type="button"
                      onClick={() => handleResolveTask(task._id)}
                      className="h-8 px-3 rounded-[6px] bg-[#1A56DB] text-white hover:bg-[#1A56DB]/90 text-xs font-semibold transition-colors cursor-pointer"
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
  );
}
