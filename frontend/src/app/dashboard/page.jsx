"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axiosInstance from "../../lib/axios";
import { useAuth } from "../../lib/useAuth";
import Link from "next/link";

// ── Withdrawal Request Modal ──────────────────────────────────────────────────

function WithdrawalModal({ balance, onConfirm, onClose }) {
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [err, setErr] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    const num = Number(amount);
    if (!num || num <= 0) { setErr("Enter a valid amount."); return; }
    if (num > balance) { setErr(`Amount exceeds your balance of $${balance.toFixed(2)}.`); return; }
    onConfirm(num, note);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div className="glass-panel p-8 w-full max-w-md relative z-10" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-xl font-bold text-white mb-1">Request Withdrawal</h3>
        <p className="text-gray-400 text-sm mb-6">
          Available balance: <span className="text-emerald-400 font-bold">${balance.toFixed(2)}</span>
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Amount ($)</label>
            <input
              type="number" min="1" step="0.01"
              className="input-emerald"
              value={amount}
              onChange={(e) => { setAmount(e.target.value); setErr(""); }}
              placeholder="0.00"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Payment details / note <span className="text-gray-500">(optional)</span></label>
            <textarea
              rows="2" className="input-emerald"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. PayPal: you@email.com"
            />
          </div>
          {err && <p className="text-red-400 text-xs">{err}</p>}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-outline-emerald flex-1">Cancel</button>
            <button type="submit" className="btn-emerald flex-1">Submit Request</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Main Dashboard ────────────────────────────────────────────────────────────

export default function Dashboard() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth("user");
  const [projects, setProjects] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showWithdrawalModal, setShowWithdrawalModal] = useState(false);
  const [withdrawalMsg, setWithdrawalMsg] = useState(null); // { type: "success"|"error", text }

  useEffect(() => {
    if (!authLoading && user) {
      fetchData();
    }
  }, [authLoading, user]);

  const fetchData = async () => {
    try {
      const [projectsRes, withdrawalsRes] = await Promise.all([
        axiosInstance.get("/projects"),
        axiosInstance.get("/withdrawals/mine"),
      ]);
      setProjects(projectsRes.data.projects);
      setWithdrawals(withdrawalsRes.data.withdrawals);
    } catch (err) {
      console.error(err);
      if (err.response?.status === 401) router.push("/login");
    } finally {
      setLoading(false);
    }
  };

  const handleExtensionResponse = async (projectId, status) => {
    try {
      await axiosInstance.patch(`/projects/${projectId}/extension`, { status });
      fetchData();
    } catch {
      setWithdrawalMsg({ type: "error", text: "Failed to respond to extension." });
    }
  };

  const handleWithdrawalRequest = async (amount, note) => {
    try {
      await axiosInstance.post("/withdrawals", { amount, note });
      setShowWithdrawalModal(false);
      setWithdrawalMsg({ type: "success", text: "Withdrawal request submitted. Awaiting admin approval." });
      fetchData(); // refresh balance + withdrawal list
    } catch (err) {
      setShowWithdrawalModal(false);
      setWithdrawalMsg({ type: "error", text: err.response?.data?.message || "Failed to submit withdrawal." });
    }
  };

  const getTimeLeft = (deadlineDate) => {
    const total = Date.parse(deadlineDate) - Date.parse(new Date());
    if (total <= 0) return "Overdue";
    const days = Math.floor(total / (1000 * 60 * 60 * 24));
    if (days > 0) return `${days} day${days > 1 ? "s" : ""} left`;
    const hours = Math.floor((total / (1000 * 60 * 60)) % 24);
    return `${hours} hr${hours > 1 ? "s" : ""} left`;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "active": return "text-emerald-400 bg-emerald-500/10 border-emerald-500/30";
      case "completed": return "text-blue-400 bg-blue-500/10 border-blue-500/30";
      case "rejected": return "text-red-400 bg-red-500/10 border-red-500/30";
      default: return "text-yellow-400 bg-yellow-500/10 border-yellow-500/30";
    }
  };

  const pendingEarned = projects
    .filter((p) => p.status === "active")
    .reduce((sum, p) => sum + p.revenue * (p.memberPercentage / 100), 0);

  const hasPendingWithdrawal = withdrawals.some((w) => w.status === "pending");

  if (authLoading || loading) return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="w-8 h-8 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto w-full pt-8 relative z-10">

      {showWithdrawalModal && (
        <WithdrawalModal
          balance={user?.balance ?? 0}
          onConfirm={handleWithdrawalRequest}
          onClose={() => setShowWithdrawalModal(false)}
        />
      )}

      {withdrawalMsg && (
        <div className={`p-4 mb-6 rounded-lg text-sm flex justify-between items-center ${
          withdrawalMsg.type === "success"
            ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-400"
            : "bg-red-500/10 border border-red-500/30 text-red-400"
        }`}>
          {withdrawalMsg.text}
          <button onClick={() => setWithdrawalMsg(null)} className="ml-4 font-bold opacity-70 hover:opacity-100">✕</button>
        </div>
      )}

      {/* Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        {/* Available Balance — primary stat */}
        <div className="glass-panel p-6 border-l-4 border-emerald-500 md:col-span-1">
          <p className="text-gray-400 text-sm font-medium mb-1">Available Balance</p>
          <h2 className="text-4xl font-black text-white mb-4">
            ${(user?.balance ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </h2>
          <button
            onClick={() => setShowWithdrawalModal(true)}
            disabled={!user?.balance || user.balance <= 0 || hasPendingWithdrawal}
            className="btn-emerald w-full py-2 text-sm disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none"
          >
            {hasPendingWithdrawal ? "Withdrawal Pending..." : "Request Withdrawal"}
          </button>
        </div>

        <div className="glass-panel p-6 border-l-4 border-yellow-500">
          <p className="text-gray-400 text-sm font-medium mb-1">Pending Revenue</p>
          <h2 className="text-4xl font-black text-white">
            ${pendingEarned.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </h2>
          <p className="text-gray-500 text-xs mt-2">From active projects</p>
        </div>

        <div className="glass-panel p-6 border-l-4 border-blue-500">
          <p className="text-gray-400 text-sm font-medium mb-1">Total Withdrawn</p>
          <h2 className="text-4xl font-black text-white">
            ${withdrawals
              .filter((w) => w.status === "approved")
              .reduce((sum, w) => sum + w.amount, 0)
              .toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </h2>
          <p className="text-gray-500 text-xs mt-2">All time</p>
        </div>
      </div>

      {/* Withdrawal History */}
      {withdrawals.length > 0 && (
        <div className="glass-panel mb-10 overflow-hidden">
          <div className="px-6 py-4 border-b border-white/5 bg-black/20">
            <h2 className="text-base font-semibold text-white">Withdrawal History</h2>
          </div>
          <div className="divide-y divide-white/5">
            {withdrawals.map((w) => (
              <div key={w._id} className="px-6 py-4 flex items-center justify-between">
                <div>
                  <span className="text-white font-bold">${w.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  {w.note && <span className="text-gray-500 text-xs ml-3">{w.note}</span>}
                  <p className="text-gray-500 text-xs mt-0.5">{new Date(w.createdAt).toLocaleDateString()}</p>
                  {w.adminNote && <p className="text-red-400 text-xs mt-1">Admin note: {w.adminNote}</p>}
                </div>
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wider ${
                  w.status === "approved" ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/30" :
                  w.status === "rejected" ? "text-red-400 bg-red-500/10 border-red-500/30" :
                  "text-yellow-400 bg-yellow-500/10 border-yellow-500/30"
                }`}>
                  {w.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Projects Header */}
      <div className="flex justify-between items-end mb-6 border-b border-white/5 pb-4">
        <h1 className="text-3xl font-black text-white">Your Projects</h1>
        <Link href="/dashboard/submit" className="btn-emerald">Submit New Project</Link>
      </div>

      {/* Projects Grid */}
      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {projects.length === 0 ? (
          <div className="col-span-full glass-panel p-16 text-center text-gray-500">
            You haven't submitted any projects yet.
          </div>
        ) : (
          projects.map((project) => (
            <div key={project._id} className="glass-panel p-6 flex flex-col h-full hover:-translate-y-1 transition-transform">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-bold text-white line-clamp-1">{project.title}</h3>
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wider ${getStatusColor(project.status)}`}>
                  {project.status.replace("_", " ")}
                </span>
              </div>
              <p className="text-gray-400 text-sm mb-6 line-clamp-2 flex-grow">{project.description}</p>

              <div className="space-y-3 border-t border-white/5 bg-black/20 -mx-6 px-6 pb-6 pt-4 mt-auto rounded-b-2xl">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Your Share</span>
                  <span className="font-bold text-emerald-400">
                    ${(project.revenue * (project.memberPercentage / 100)).toLocaleString()}
                    <span className="text-gray-500 font-normal text-xs ml-1">({project.memberPercentage}%)</span>
                  </span>
                </div>
                <div className="flex justify-between text-sm items-center">
                  <span className="text-gray-500">Deadline</span>
                  <div className="text-right">
                    <span className="text-gray-300 font-medium block">{new Date(project.deadline).toLocaleDateString()}</span>
                    {project.status === "active" && (
                      <span className={`text-[10px] uppercase tracking-wider font-bold ${getTimeLeft(project.deadline) === "Overdue" ? "text-red-400" : "text-emerald-500"}`}>
                        {getTimeLeft(project.deadline)}
                      </span>
                    )}
                  </div>
                </div>

                {project.extensionRequest?.status === "pending" && (
                  <div className="mt-3 p-3 rounded bg-yellow-500/10 border border-yellow-500/20 text-xs">
                    <span className="text-yellow-400 font-bold block mb-1">Admin Requested Extension</span>
                    <span className="text-gray-300 block">New Date: {new Date(project.extensionRequest.date).toLocaleDateString()}</span>
                    <span className="text-gray-400 block mb-2">Reason: {project.extensionRequest.reason}</span>
                    <div className="flex gap-2">
                      <button onClick={() => handleExtensionResponse(project._id, "approved")} className="flex-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30 py-1.5 rounded transition-colors font-medium">Accept</button>
                      <button onClick={() => handleExtensionResponse(project._id, "rejected")} className="flex-1 bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 py-1.5 rounded transition-colors font-medium">Reject</button>
                    </div>
                  </div>
                )}

                {project.pdfUrl && (
                  <button
                    onClick={async () => {
                      try {
                        const res = await axiosInstance.get(project.pdfUrl, { responseType: "blob" });
                        const url = URL.createObjectURL(res.data);
                        window.open(url, "_blank");
                      } catch {
                        setWithdrawalMsg({ type: "error", text: "Could not load PDF." });
                      }
                    }}
                    className="block w-full py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-center rounded-lg text-sm text-emerald-400 transition-colors border border-emerald-500/20 mt-3 font-medium"
                  >
                    View Project PDF
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
