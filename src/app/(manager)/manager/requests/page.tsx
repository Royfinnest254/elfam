"use client";

import React, { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { FileText, Check, X, Trash2 } from "lucide-react";

export default function ManagerRequestsPage() {
  const requests = useQuery(api.records.listRequests, {});

  const approveMutation = useMutation(api.records.approveRequest);
  const rejectMutation = useMutation(api.records.rejectRequest);
  const deleteMutation = useMutation(api.records.deleteRequest);

  // Notes Modal state for Approve/Reject action
  const [actionModalOpen, setActionModalOpen] = useState(false);
  const [selectedReqId, setSelectedReqId] = useState<string | null>(null);
  const [actionType, setActionType] = useState<"approve" | "reject">("approve");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (requests === undefined) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center text-[#5F6368] text-sm">
        Loading requests ledger...
      </div>
    );
  }

  const handleOpenActionModal = (reqId: string, type: "approve" | "reject") => {
    setStatusMsg(null);
    setErrorMsg(null);
    setSelectedReqId(reqId);
    setActionType(type);
    setNotes("");
    setActionModalOpen(true);
  };

  const handleProcessAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReqId) return;

    setSubmitting(true);
    try {
      if (actionType === "approve") {
        await approveMutation({ id: selectedReqId as any, notes: notes.trim() });
        setStatusMsg("VERIFIED: Request successfully approved.");
      } else {
        await rejectMutation({ id: selectedReqId as any, notes: notes.trim() });
        setStatusMsg("VERIFIED: Request rejected.");
      }
      setActionModalOpen(false);
      setSelectedReqId(null);
      setNotes("");
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Failed to process request action.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteRequest = async (id: any) => {
    if (!confirm("Are you sure you want to permanently delete this request record?")) return;
    setStatusMsg(null);
    setErrorMsg(null);
    try {
      await deleteMutation({ id });
      setStatusMsg("VERIFIED: Request record deleted.");
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Failed to delete request.");
    }
  };

  const pendingRequests = requests.filter((r) => r.status === "pending");
  const resolvedRequests = requests.filter((r) => r.status !== "pending");

  return (
    <div className="space-y-8 pb-12">
      <header className="border-b border-[#DADCE0] pb-6">
        <span className="label block mb-2 text-teal">
          Administrative Validation
        </span>
        <h1 className="text-3xl font-normal text-[#1A56DB] tracking-tight">
          Resource & Maintenance Requests
        </h1>
        <p className="body-small text-[#5F6368] mt-1 uppercase tracking-wider font-semibold">
          Review, approve, and resolve staff resource requests or maintenance tickets
        </p>
      </header>

      {/* Alerts */}
      {statusMsg && (
        <div className="text-teal text-xs font-bold bg-teal/5 border border-teal/20 p-4 rounded-[4px]">
          {statusMsg}
        </div>
      )}
      {errorMsg && (
        <div className="text-alert text-xs font-bold bg-alert/5 border border-alert/20 p-4 rounded-[4px]">
          {errorMsg}
        </div>
      )}

      {/* Pending Reviews Panel */}
      <div className="system-card p-6 space-y-6">
        <h3 className="text-lg font-normal text-[#1A56DB] tracking-tight border-b border-[#DADCE0] pb-4">
          Pending Validation Queue ({pendingRequests.length})
        </h3>
        {pendingRequests.length === 0 ? (
          <p className="body-small text-[#5F6368] italic">No pending requests requiring validation.</p>
        ) : (
          <div className="space-y-4">
            {pendingRequests.map((req) => (
              <div key={req._id} className="flex flex-col md:flex-row md:items-center justify-between p-5 bg-[#F8F9FA] border border-[#DADCE0] rounded-none gap-4">
                <div className="space-y-1.5 max-w-3xl">
                  <div className="flex items-center gap-2">
                    <span className="status-badge text-[9px] text-teal border-teal/20 bg-teal/5 uppercase font-bold">
                      {req.category}
                    </span>
                    <span className="mono text-[9px] text-[#5F6368]">
                      Submitted: {new Date(req.requestedAt).toLocaleString("en-GB")}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-[#1A56DB]">{req.title}</h4>
                  <p className="body-small text-[#5F6368] font-medium leading-relaxed">{req.details}</p>
                  <span className="text-[10px] font-bold text-[#1A56DB] uppercase block">
                    Requested By: {req.requestedByName}
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleOpenActionModal(req._id, "approve")}
                    className="btn-primary flex items-center gap-1.5 h-9 px-4 text-xs font-bold"
                  >
                    <Check className="h-3.5 w-3.5" />
                    Approve
                  </button>
                  <button
                    type="button"
                    onClick={() => handleOpenActionModal(req._id, "reject")}
                    className="btn-secondary border-alert text-alert hover:bg-alert/5 flex items-center gap-1.5 h-9 px-4 text-xs font-bold"
                  >
                    <X className="h-3.5 w-3.5" />
                    Reject
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteRequest(req._id)}
                    className="p-2 border border-[#DADCE0] hover:border-alert text-[#5F6368] hover:text-alert rounded-[6px] transition-colors bg-white"
                    title="Delete Request Record"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Resolved History Panel */}
      <div className="system-card p-6 space-y-6">
        <h3 className="text-lg font-normal text-[#1A56DB] tracking-tight border-b border-[#DADCE0] pb-4">
          Request Validation Archive
        </h3>
        {resolvedRequests.length === 0 ? (
          <p className="body-small text-[#5F6368] italic">No completed requests in logs.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#F8F9FA] border-b border-[#DADCE0] text-[10px] font-semibold uppercase tracking-wider text-[#5F6368]">
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Requester</th>
                  <th className="py-3 px-4">Title / Purpose</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Validation Notes</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DADCE0] text-xs font-medium text-[#1A56DB]">
                {resolvedRequests.map((req) => (
                  <tr key={req._id} className="hover:bg-[#F8F9FA]/40 transition-colors">
                    <td className="py-3.5 px-4 font-mono text-[#5F6368]">
                      {new Date(req.requestedAt).toLocaleDateString("en-GB")}
                    </td>
                    <td className="py-3.5 px-4 font-bold">{req.requestedByName}</td>
                    <td className="py-3.5 px-4 font-bold">{req.title}</td>
                    <td className="py-3.5 px-4">
                      <span className="status-badge text-[9px] text-teal border-teal/20 bg-teal/5 uppercase">
                        {req.category}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`status-badge text-[9px] border uppercase font-bold ${
                        req.status === "approved"
                          ? "text-teal border-teal/20 bg-teal/5"
                          : "text-alert border-alert/20 bg-alert/5"
                      }`}>
                        {req.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-normal text-[#5F6368] italic max-w-[240px] truncate" title={req.notes}>
                      {req.notes || "—"}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => handleDeleteRequest(req._id)}
                        className="text-alert hover:underline font-bold text-xs"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Action Notes Modal */}
      {actionModalOpen && (
        <div className="fixed inset-0 bg-[#202124]/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white border-2 border-[#1A56DB] w-full max-w-lg p-6 space-y-6 rounded-[6px]">
            <div className="flex justify-between items-start border-b border-[#DADCE0] pb-3">
              <h2 className="text-xl font-normal text-[#1A56DB] capitalize">
                {actionType} Request Record
              </h2>
              <button
                type="button"
                onClick={() => setActionModalOpen(false)}
                className="text-[#5F6368] hover:text-[#1A56DB] text-lg font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleProcessAction} className="space-y-4">
              <div className="space-y-1">
                <label htmlFor="action-notes" className="label text-[#5F6368]">Validation Comments / Notes</label>
                <textarea
                  id="action-notes"
                  className="input-field min-h-[100px] py-2"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Include details about budget allocation, delivery ETA, reasons for rejection, etc."
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-[#DADCE0]">
                <button
                  type="button"
                  onClick={() => setActionModalOpen(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary"
                >
                  {submitting ? "Processing..." : `Confirm ${actionType}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
