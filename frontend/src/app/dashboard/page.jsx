"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axiosInstance from "../../lib/axios";
import { useAuth } from "../../lib/useAuth";
import Link from "next/link";
import toast from "react-hot-toast";

// ── Withdrawal Modal ──────────────────────────────────────────────────────────

function WithdrawalModal({ balance, onConfirm, onClose }) {
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [err, setErr] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    const num = Number(amount);
    if (!num || num <= 0) { setErr("Enter a valid amount."); return; }
    if (num > balance) { setErr(`Exceeds balance of $${balance.toFixed(2)}.`); return; }
    onConfirm(num, note);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" />
      <div className="glass-panel corner-bracket p-8 w-full max-w-md relative z-10 animate-fade-up" onClick={(e) => e.stopPropagation()}>
        <p className="text-[10px] font-mono text-emerald-500/60 tracking-widest uppercase mb-3">Withdrawal / Request</p>
        <h3 className="text-xl font-black text-white mb-1">Request Payout</h3>
        <p className="text-slate-500 text-sm mb-6">
          Available: <span className="text-emerald-400 font-mono font-bold">${balance.toFixed(2)}</span>
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest mb-1.5">Amount ($)</label>
            <input type="number" min="1" step="0.01" className="input-emerald font-mono" value={amount}
              onChange={(e) => { setAmount(e.target.value); setErr(""); }} placeholder="0.00" autoFocus />
          </div>
          <div>
            <label className="block text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest mb-1.5">
              Payment Info <span className="text-slate-700 normal-case">(optional)</span>
            </label>
            <textarea rows="2" className="input-emerald font-mono text-sm" value={note}
              onChange={(e) => setNote(e.target.value)} placeholder="e.g. PayPal: you@email.com" />
          </div>
          {err && <p className="text-red-400 text-xs font-mono">✗ {err}</p>}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-outline-emerald flex-1">Cancel</button>
            <button type="submit" className="btn-emerald flex-1">Submit →</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Status helpers ────────────────────────────────────────────────────────────

const STATUS_STYLES = {
  active:           "text-emerald-400 bg-emerald-500/10 border-emerald-500/25",
  completed:        "text-blue-400 bg-blue-500/10 border-blue-500/25",
  rejected:         "text-red-400 bg-red-500/10 border-red-500/25",
  pending_approval: "text-yellow-400 bg-yellow-500/10 border-yellow-500/25",
};

function getTimeLeft(deadlineDate) {
  const total = Date.parse(deadlineDate) - Date.now();
  if (total <= 0) return { label: "Overdue", urgent: true };
  const days = Math.floor(total / (1000 * 60 * 60 * 24));
  if (days > 0) return { label: `${days}d left`, urgent: days <= 2 };
  const hours = Math.floor((total / (1000 * 60 * 60)) % 24);
  return { label: `${hours}h left`, urgent: true };
}

// ── Dashboard ─────────────────────────────────────────────────────────────────

export default function Dashboard() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth("user");
  const [projects, setProjects] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showWithdrawalModal, setShowWithdrawalModal] = useState(false);

  useEffect(() => {
    if (!authLoading && user) fetchData();
  }, [authLoading, user]);

  const fetchData = async () => {
    try {
      const [pRes, wRes] = await Promise.all([
        axiosInstance.get("/projects"),
        axiosInstance.get("/withdrawals/mine"),
      ]);
      setProjects(pRes.data.projects);
      setWithdrawals(wRes.data.withdrawals);
    } catch (err) {
      if (err.response?.status === 401) router.push("/login");
    } finally {
      setLoading(false);
    }
  };

  const handleExtensionResponse = async (projectId, status) => {
    try {
      await axiosInstance.patch(`/projects/${projectId}/extension`, { status });
      toast.success(status === "approved" ? "Extension accepted." : "Extension rejected.");
      fetchData();
    } catch {
      toast.error("Failed to respond to extension.");
    }
  };

  const handleWithdrawalRequest = async (amount, note) => {
    try {
      await axiosInstance.post("/withdrawals", { amount, note });
      setShowWithdrawalModal(false);
      toast.success("Withdrawal request submitted. Awaiting admin approval.");
      fetchData();
    } catch (err) {
      setShowWithdrawalModal(false);
      toast.error(err.response?.data?.message || "Failed to submit withdrawal.");
    }
  };

  const pendingEarned = projects
    .filter((p) => p.status === "active")
    .reduce((sum, p) => sum + p.revenue * (p.memberPercentage / 100), 0);

  const totalWithdrawn = withdrawals
    .filter((w) => w.status === "approved")
    .reduce((sum, w) => sum + w.amount, 0);

  const hasPendingWithdrawal = withdrawals.some((w) => w.status === "pending");

  if (authLoading || loading) return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="w-7 h-7 border-2 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto w-full pt-6 relative z-10">

      {showWithdrawalModal && (
        <WithdrawalModal balance={user?.balance ?? 0} onConfirm={handleWithdrawalRequest} onClose={() => setShowWithdrawalModal(false)} />
      )}

      {/* Page header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="text-[10px] font-mono text-emerald-500/50 tracking-widest uppercase mb-1">Dashboard / Overview</p>
          <h1 className="text-2xl font-black text-white tracking-tight">
            {user?.fullName?.split(" ")[0]}<span className="text-emerald-400">.</span>
          </h1>
        </div>
        <Link href="/dashboard/submit" className="btn-emerald text-xs py-2.5 px-5">
          + New Project
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {/* Balance */}
        <div className="glass-panel p-5 stat-card" style={{ "--tw-text-opacity": 1, color: "#10b981" }}>
          <div className="flex items-start justify-between mb-3">
            <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Available Balance</p>
            <span className="text-[9px] font-mono text-emerald-500/50 border border-emerald-500/15 rounded px-1.5 py-0.5">LIVE</span>
          </div>
          <p className="text-3xl font-black text-white font-mono tabular-nums mb-4">
            ${(user?.balance ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          {(user?.balance ?? 0) === 0 && (
            <p className="text-[10px] font-mono text-slate-600 mb-3">
              {projects.some(p => p.status === "active")
                ? "↳ Credited when active projects complete"
                : "↳ Submit a project to start earning"}
            </p>
          )}
          <button
            onClick={() => setShowWithdrawalModal(true)}
            disabled={!user?.balance || user.balance <= 0 || hasPendingWithdrawal}
            className="btn-emerald w-full py-2 text-[10px] disabled:opacity-30 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
          >
            {hasPendingWithdrawal ? "⏳ Pending..." : "Withdraw →"}
          </button>
        </div>

        <div className="glass-panel p-5">
          <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-3">Pending Revenue</p>
          <p className="text-3xl font-black text-yellow-400 font-mono tabular-nums">
            ${pendingEarned.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className="text-[10px] text-slate-600 font-mono mt-2">from active projects</p>
        </div>

        <div className="glass-panel p-5">
          <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-3">Total Withdrawn</p>
          <p className="text-3xl font-black text-blue-400 font-mono tabular-nums">
            ${totalWithdrawn.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className="text-[10px] text-slate-600 font-mono mt-2">all time</p>
        </div>
      </div>

      {/* Withdrawal history */}
      {withdrawals.length > 0 && (
        <div className="glass-panel mb-8 overflow-hidden">
          <div className="px-5 py-3.5 border-b border-white/5 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
            <h2 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-widest">Withdrawal History</h2>
          </div>
          <div className="divide-y divide-white/[0.04]">
            {withdrawals.map((w) => (
              <div key={w._id} className="px-5 py-3.5 flex items-center justify-between hover:bg-white/[0.015] transition-colors">
                <div>
                  <span className="text-white font-mono font-bold text-sm">
                    ${w.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                  {w.note && <span className="text-slate-600 text-xs font-mono ml-3">{w.note}</span>}
                  <p className="text-slate-600 text-[10px] font-mono mt-0.5">{new Date(w.createdAt).toLocaleDateString()}</p>
                  {w.adminNote && <p className="text-red-400 text-[10px] font-mono mt-0.5">↳ {w.adminNote}</p>}
                </div>
                <span className={`tag ${
                  w.status === "approved" ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/25" :
                  w.status === "rejected" ? "text-red-400 bg-red-500/10 border-red-500/25" :
                  "text-yellow-400 bg-yellow-500/10 border-yellow-500/25"
                }`}>
                  {w.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Projects */}
      <div className="flex items-center justify-between mb-5 pb-4 border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <h2 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-widest">Projects</h2>
          <span className="text-[10px] font-mono text-slate-600 border border-white/10 rounded px-1.5 py-0.5">{projects.length}</span>
        </div>
      </div>

      <div className="glass-panel overflow-hidden mb-8">
        {projects.length === 0 ? (
          <div className="p-16 text-center">
            <p className="text-slate-600 font-mono text-sm">// no projects yet</p>
            <Link href="/dashboard/submit" className="btn-emerald mt-6 inline-flex text-xs py-2.5 px-5">
              Submit First Project →
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/[0.06] text-[10px] font-mono text-slate-500 uppercase tracking-widest">
                  <th className="px-5 py-3 font-medium">Project</th>
                  <th className="px-5 py-3 font-medium">Member</th>
                  <th className="px-5 py-3 font-medium">Revenue</th>
                  <th className="px-5 py-3 font-medium">Member Share</th>
                  <th className="px-5 py-3 font-medium">Deadline</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {projects.map((project) => {
                  const timeLeft = getTimeLeft(project.deadline);
                  const memberEarning = project.revenue * (project.memberPercentage / 100);
                  return (
                    <tr key={project._id} className="hover:bg-white/[0.015] transition-colors group">
                      <td className="px-5 py-4">
                        <p className="text-white font-bold text-sm leading-tight">{project.title}</p>
                        <p className="text-slate-600 text-[10px] font-mono mt-0.5 line-clamp-1 max-w-[180px]">{project.description}</p>
                        {project.pdfUrl && (
                          <button
                            onClick={async () => {
                              try {
                                const res = await axiosInstance.get(project.pdfUrl, { responseType: "blob" });
                                window.open(URL.createObjectURL(res.data), "_blank");
                              } catch {
                                toast.error("Could not load PDF.");
                              }
                            }}
                            className="text-emerald-500/60 hover:text-emerald-400 text-[10px] font-mono mt-1 block transition-colors"
                          >
                            ↗ PDF
                          </button>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <p className="text-slate-300 text-sm font-medium">{project.createdBy?.fullName ?? user?.fullName}</p>
                        <p className="text-slate-600 text-[10px] font-mono mt-0.5">{project.createdBy?.email ?? user?.email}</p>
                      </td>
                      <td className="px-5 py-4">
                        <p className="text-white font-mono font-bold text-sm">${project.revenue.toLocaleString()}</p>
                        <p className="text-slate-600 text-[10px] font-mono mt-0.5">total</p>
                      </td>
                      <td className="px-5 py-4">
                        {project.memberPercentage > 0 ? (
                          <>
                            <p className="text-emerald-400 font-mono font-bold text-sm">
                              ${memberEarning.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </p>
                            <p className="text-slate-600 text-[10px] font-mono mt-0.5">{project.memberPercentage}% of revenue</p>
                          </>
                        ) : (
                          <p className="text-slate-600 text-[10px] font-mono italic">Not set yet</p>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <p className="text-slate-400 font-mono text-xs">{new Date(project.deadline).toLocaleDateString()}</p>
                        {project.status === "active" && (
                          <p className={`text-[10px] font-mono font-bold mt-0.5 ${timeLeft.urgent ? "text-red-400" : "text-emerald-500"}`}>
                            {timeLeft.label}
                          </p>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider border ${STATUS_STYLES[project.status] || STATUS_STYLES.pending_approval}`}>
                          {project.status.replace("_", " ")}
                        </span>
                        {project.status === "rejected" && project.rejectionNote && (
                          <div className="mt-2 p-2 bg-red-500/8 border border-red-500/20 rounded text-[10px]">
                            <span className="text-red-400 font-mono font-bold block mb-0.5">Reason:</span>
                            <span className="text-slate-500 font-mono">{project.rejectionNote}</span>
                          </div>
                        )}
                        {project.extensionRequest?.status === "pending" && (
                          <div className="mt-2 p-2 bg-yellow-500/8 border border-yellow-500/20 rounded text-[10px]">
                            <span className="text-yellow-400 font-mono font-bold block mb-1">⚡ Extension Requested</span>
                            <span className="text-slate-400 font-mono block">→ {new Date(project.extensionRequest.date).toLocaleDateString()}</span>
                            <span className="text-slate-500 font-mono block mb-1.5 text-[9px]">{project.extensionRequest.reason}</span>
                            <div className="flex gap-1.5">
                              <button onClick={() => handleExtensionResponse(project._id, "approved")}
                                className="flex-1 bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 hover:bg-emerald-500/25 py-1 rounded text-[9px] font-mono font-bold transition-colors">
                                Accept
                              </button>
                              <button onClick={() => handleExtensionResponse(project._id, "rejected")}
                                className="flex-1 bg-red-500/15 text-red-400 border border-red-500/25 hover:bg-red-500/25 py-1 rounded text-[9px] font-mono font-bold transition-colors">
                                Reject
                              </button>
                            </div>
                          </div>
                        )}
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
