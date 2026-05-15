"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import axiosInstance from "../../lib/axios";
import { useAuth } from "../../lib/useAuth";
import toast from "react-hot-toast";

// Recharts touches browser APIs — must be loaded client-side only
const AnalyticsTab = dynamic(() => import("./AnalyticsTab"), { ssr: false, loading: () => (
  <div className="p-16 flex items-center justify-center">
    <div className="w-7 h-7 border-2 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
  </div>
) });

// ─── Modal Components ─────────────────────────────────────────────────────────

function ModalOverlay({ children, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div className="glass-panel p-8 w-full max-w-md relative z-10" onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}

function ApproveProjectModal({ project, onConfirm, onClose }) {
  const [percentage, setPercentage] = useState("50");
  const [err, setErr] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    const num = Number(percentage);
    if (isNaN(num) || num < 0 || num > 100) { setErr("Enter a number between 0 and 100."); return; }
    onConfirm(project._id, num);
  };

  return (
    <ModalOverlay onClose={onClose}>
      <h3 className="text-xl font-bold text-white mb-1">Approve Project</h3>
      <p className="text-gray-400 text-sm mb-6">Set the member revenue share for <span className="text-emerald-400 font-semibold">{project.title}</span>.</p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Member Percentage Cut (0–100)</label>
          <input type="number" min="0" max="100" step="1" className="input-emerald" value={percentage}
            onChange={(e) => { setPercentage(e.target.value); setErr(""); }} autoFocus />
          {err && <p className="text-red-400 text-xs mt-1">{err}</p>}
        </div>
        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className="btn-outline-emerald flex-1">Cancel</button>
          <button type="submit" className="btn-emerald flex-1">Approve & Activate</button>
        </div>
      </form>
    </ModalOverlay>
  );
}

function ExtensionModal({ project, onConfirm, onClose }) {
  const [date, setDate] = useState("");
  const [reason, setReason] = useState("");
  const [err, setErr] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!date || !reason.trim()) { setErr("Both date and reason are required."); return; }
    onConfirm(project._id, date, reason);
  };

  return (
    <ModalOverlay onClose={onClose}>
      <h3 className="text-xl font-bold text-white mb-1">Request Deadline Extension</h3>
      <p className="text-gray-400 text-sm mb-6">For project: <span className="text-emerald-400 font-semibold">{project.title}</span></p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">New Deadline</label>
          <input type="date" className="input-emerald" value={date} onChange={(e) => { setDate(e.target.value); setErr(""); }} autoFocus />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Reason</label>
          <textarea rows="3" className="input-emerald" value={reason} onChange={(e) => { setReason(e.target.value); setErr(""); }} placeholder="Explain why the extension is needed..." />
        </div>
        {err && <p className="text-red-400 text-xs">{err}</p>}
        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className="btn-outline-emerald flex-1">Cancel</button>
          <button type="submit" className="btn-emerald flex-1">Send Request</button>
        </div>
      </form>
    </ModalOverlay>
  );
}

// ─── Deadline Countdown ───────────────────────────────────────────────────────

function useCountdown(targetDate) {
  const calc = () => {
    const diff = new Date(targetDate) - new Date();
    if (diff <= 0) return null;
    return {
      days: Math.floor(diff / (1000 * 60 * 60 * 24)),
      hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((diff / (1000 * 60)) % 60),
      seconds: Math.floor((diff / 1000) % 60),
      total: diff,
    };
  };

  const [time, setTime] = useState(calc);

  useEffect(() => {
    const id = setInterval(() => setTime(calc()), 1000);
    return () => clearInterval(id);
  }, [targetDate]);

  return time;
}

// variant="table" → compact single-line for the projects table
// variant="panel" → full 4-box display for the detail panel
function DeadlineCountdown({ deadline, status, variant = "table" }) {
  const time = useCountdown(deadline);

  // Only show live countdown for active projects
  if (status !== "active") {
    const label = new Date(deadline).toLocaleDateString();
    if (variant === "panel") {
      return (
        <div>
          <p className="text-white font-bold">{label}</p>
          {status === "completed" && <p className="text-xs text-blue-400 mt-1 uppercase tracking-wider font-bold">Completed</p>}
          {status === "rejected" && <p className="text-xs text-red-400 mt-1 uppercase tracking-wider font-bold">Rejected</p>}
          {status === "pending_approval" && <p className="text-xs text-yellow-400 mt-1 uppercase tracking-wider font-bold">Awaiting approval</p>}
        </div>
      );
    }
    return <span className="text-gray-400 text-sm">{label}</span>;
  }

  if (!time) {
    // Overdue
    if (variant === "panel") {
      return (
        <div>
          <p className="text-white font-bold">{new Date(deadline).toLocaleDateString()}</p>
          <p className="text-xs text-red-400 mt-1 uppercase tracking-wider font-bold animate-pulse">⚠ Overdue</p>
        </div>
      );
    }
    return (
      <div className="flex items-center gap-1.5">
        <span className="text-gray-400 text-sm">{new Date(deadline).toLocaleDateString()}</span>
        <span className="text-[10px] font-bold text-red-400 uppercase tracking-wider animate-pulse">Overdue</span>
      </div>
    );
  }

  const isUrgent = time.total < 3 * 24 * 60 * 60 * 1000; // under 3 days
  const color = isUrgent ? "text-red-400" : time.total < 7 * 24 * 60 * 60 * 1000 ? "text-yellow-400" : "text-emerald-400";

  if (variant === "panel") {
    return (
      <div>
        <p className="text-white font-bold mb-2">{new Date(deadline).toLocaleDateString()}</p>
        <div className="grid grid-cols-4 gap-1.5">
          {[
            { value: time.days, label: "Days" },
            { value: time.hours, label: "Hrs" },
            { value: time.minutes, label: "Min" },
            { value: time.seconds, label: "Sec" },
          ].map(({ value, label }) => (
            <div key={label} className={`bg-black/40 border ${isUrgent ? "border-red-500/30" : "border-white/10"} rounded-lg p-2 text-center`}>
              <p className={`text-lg font-black tabular-nums ${color}`}>{String(value).padStart(2, "0")}</p>
              <p className="text-[9px] text-gray-500 uppercase tracking-wider">{label}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // table variant — compact
  return (
    <div>
      <p className="text-gray-400 text-sm">{new Date(deadline).toLocaleDateString()}</p>
      <p className={`text-[11px] font-bold tabular-nums mt-0.5 ${color}`}>
        {time.days > 0
          ? `${time.days}d ${String(time.hours).padStart(2, "0")}h ${String(time.minutes).padStart(2, "0")}m`
          : `${String(time.hours).padStart(2, "0")}h ${String(time.minutes).padStart(2, "0")}m ${String(time.seconds).padStart(2, "0")}s`}
      </p>
    </div>
  );
}

// ─── Project Detail Panel ─────────────────────────────────────────────────────

function ProjectDetailPanel({ project, onClose, onApprove, onReject, onComplete, onExtend, onLoadPdf }) {
  const statusColors = {
    active: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
    completed: "text-blue-400 bg-blue-500/10 border-blue-500/30",
    rejected: "text-red-400 bg-red-500/10 border-red-500/30",
    pending_approval: "text-yellow-400 bg-yellow-500/10 border-yellow-500/30",
  };

  const memberEarning = project.revenue * (project.memberPercentage / 100);
  const agencyEarning = project.revenue - memberEarning;

  return (
    // Backdrop
    <div className="fixed inset-0 z-50 flex justify-end" onClick={onClose}>
      {/* dim left side */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Panel */}
      <div
        className="relative z-10 h-full w-full max-w-xl bg-[#0a0a0a] border-l border-emerald-500/15 flex flex-col overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-8 border-b border-white/5 sticky top-0 bg-[#0a0a0a] z-10">
          <div className="flex-1 pr-4">
            <h2 className="text-2xl font-black text-white leading-tight">{project.title}</h2>
            <div className="flex items-center gap-3 mt-2">
              <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wider ${statusColors[project.status]}`}>
                {project.status.replace("_", " ")}
              </span>
              <span className="text-gray-500 text-xs">
                Submitted {new Date(project.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-white transition-colors text-xl font-bold w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/5"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 p-8 space-y-8">

          {/* Member */}
          <section>
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Submitted By</h3>
            <div className="glass-panel p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 font-black text-lg">
                {project.createdBy.fullName.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-white font-semibold">{project.createdBy.fullName}</p>
                <p className="text-gray-500 text-sm">{project.createdBy.email}</p>
              </div>
            </div>
          </section>

          {/* Description */}
          <section>
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Description</h3>
            <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">{project.description}</p>
          </section>

          {/* Financials */}
          <section>
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Financials</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="glass-panel p-4">
                <p className="text-gray-500 text-xs mb-1">Total Revenue</p>
                <p className="text-white font-black text-xl">${project.revenue.toLocaleString()}</p>
              </div>
              <div className="glass-panel p-4">
                <p className="text-gray-500 text-xs mb-1">Member Share</p>
                <p className="text-emerald-400 font-black text-xl">
                  {project.memberPercentage > 0
                    ? `$${memberEarning.toLocaleString()} (${project.memberPercentage}%)`
                    : <span className="text-gray-600 text-sm font-normal">Not set yet</span>}
                </p>
              </div>
              <div className="glass-panel p-4">
                <p className="text-gray-500 text-xs mb-1">Agency Cut</p>
                <p className="text-blue-400 font-black text-xl">
                  {project.memberPercentage > 0
                    ? `$${agencyEarning.toLocaleString()} (${100 - project.memberPercentage}%)`
                    : <span className="text-gray-600 text-sm font-normal">Not set yet</span>}
                </p>
              </div>
              <div className="glass-panel p-4">
                <p className="text-gray-500 text-xs mb-1">Deadline</p>
                <DeadlineCountdown deadline={project.deadline} status={project.status} variant="panel" />
              </div>
            </div>
          </section>

          {/* Extension Request */}
          {project.extensionRequest?.date && (
            <section>
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Extension Request</h3>
              <div className={`glass-panel p-4 border ${
                project.extensionRequest.status === "pending" ? "border-yellow-500/30" :
                project.extensionRequest.status === "approved" ? "border-emerald-500/30" :
                "border-red-500/30"
              }`}>
                <div className="flex justify-between items-start mb-2">
                  <span className="text-gray-300 text-sm font-medium">
                    New date: <span className="text-white font-bold">{new Date(project.extensionRequest.date).toLocaleDateString()}</span>
                  </span>
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                    project.extensionRequest.status === "pending" ? "text-yellow-400 bg-yellow-500/10 border-yellow-500/30" :
                    project.extensionRequest.status === "approved" ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/30" :
                    "text-red-400 bg-red-500/10 border-red-500/30"
                  }`}>
                    {project.extensionRequest.status}
                  </span>
                </div>
                <p className="text-gray-400 text-sm">{project.extensionRequest.reason}</p>
              </div>
            </section>
          )}

          {/* PDF */}
          {project.pdfUrl && (
            <section>
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Proposal Document</h3>
              <button
                onClick={() => onLoadPdf(project.pdfUrl)}
                className="w-full glass-panel p-4 flex items-center gap-3 hover:border-emerald-500/40 transition-colors text-left group"
              >
                <div className="w-10 h-10 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 font-bold text-xs flex-shrink-0">
                  PDF
                </div>
                <div className="flex-1">
                  <p className="text-white text-sm font-medium group-hover:text-emerald-400 transition-colors">View Project Proposal</p>
                  <p className="text-gray-500 text-xs">Opens in new tab</p>
                </div>
                <span className="text-gray-600 group-hover:text-emerald-400 transition-colors">→</span>
              </button>
            </section>
          )}
        </div>

        {/* Action Footer */}
        <div className="p-8 border-t border-white/5 bg-black/30 space-y-3 sticky bottom-0">
          {project.status === "pending_approval" && (
            <div className="flex gap-3">
              <button
                onClick={() => onReject(project._id)}
                className="flex-1 py-3 rounded-xl text-sm font-semibold text-red-400 border border-red-500/30 hover:bg-red-500/10 transition-colors"
              >
                Reject Project
              </button>
              <button
                onClick={() => onApprove(project)}
                className="btn-emerald flex-1 py-3 text-sm"
              >
                Approve & Set Terms
              </button>
            </div>
          )}
          {project.status === "active" && (
            <div className="flex gap-3">
              {project.extensionRequest?.status !== "pending" && (
                <button
                  onClick={() => onExtend(project)}
                  className="flex-1 py-3 rounded-xl text-sm font-semibold text-yellow-400 border border-yellow-500/30 hover:bg-yellow-500/10 transition-colors"
                >
                  Request Extension
                </button>
              )}
              <button
                onClick={() => onComplete(project._id)}
                className="flex-1 py-3 rounded-xl text-sm font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30 hover:bg-blue-500/30 transition-colors"
              >
                Mark Completed
              </button>
            </div>
          )}
          {(project.status === "completed" || project.status === "rejected") && (
            <p className="text-center text-gray-600 text-sm">No actions available for this project.</p>
          )}
        </div>
      </div>
    </div>
  );
}

function RejectWithdrawalModal({ withdrawal, onConfirm, onClose }) {
  const [adminNote, setAdminNote] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    onConfirm(withdrawal._id, adminNote);
  };

  return (
    <ModalOverlay onClose={onClose}>
      <h3 className="text-xl font-bold text-white mb-1">Reject Withdrawal</h3>
      <p className="text-gray-400 text-sm mb-6">
        Rejecting <span className="text-emerald-400 font-semibold">${withdrawal.amount.toFixed(2)}</span> for{" "}
        <span className="text-white font-semibold">{withdrawal.user?.fullName}</span>.
        The amount will be refunded to their balance.
      </p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Reason <span className="text-gray-500">(optional)</span></label>
          <textarea rows="2" className="input-emerald" value={adminNote} onChange={(e) => setAdminNote(e.target.value)} placeholder="e.g. Invalid payment details" autoFocus />
        </div>
        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className="btn-outline-emerald flex-1">Cancel</button>
          <button type="submit" className="w-full flex-1 py-3 rounded-xl font-semibold bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 transition-colors">Reject & Refund</button>
        </div>
      </form>
    </ModalOverlay>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AdminDashboard() {
  const router = useRouter();
  const { loading: authLoading } = useAuth("admin");
  const [users, setUsers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [adminBalance, setAdminBalance] = useState(0);
  const [adminWithdrawals, setAdminWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("users");

  // Modal state
  const [approveModal, setApproveModal] = useState(null);
  const [extensionModal, setExtensionModal] = useState(null);
  const [rejectWithdrawalModal, setRejectWithdrawalModal] = useState(null);
  const [detailPanel, setDetailPanel] = useState(null);
  const [showAdminWithdrawModal, setShowAdminWithdrawModal] = useState(false);

  // Track which projects have already triggered a deadline notification this session
  const notifiedRef = useRef(new Set());

  useEffect(() => {
    fetchData();
  }, []);

  // Fire toast notifications for active projects within 2 days of deadline
  useEffect(() => {
    if (!projects.length) return;

    const TWO_DAYS_MS = 2 * 24 * 60 * 60 * 1000;

    projects.forEach((project) => {
      if (project.status !== "active") return;
      if (notifiedRef.current.has(project._id)) return;

      const timeLeft = new Date(project.deadline) - new Date();

      if (timeLeft <= 0) {
        // Already overdue
        notifiedRef.current.add(project._id);
        toast.error(
          (t) => (
            <div className="flex flex-col gap-1">
              <span className="font-bold text-white">⚠ Project Overdue</span>
              <span className="text-sm text-gray-300">
                <span className="text-red-400 font-semibold">{project.title}</span> passed its deadline.
              </span>
              <button
                onClick={() => toast.dismiss(t.id)}
                className="text-xs text-gray-500 hover:text-white mt-1 text-left"
              >
                Dismiss
              </button>
            </div>
          ),
          {
            duration: Infinity,
            style: {
              background: "#1a0a0a",
              border: "1px solid rgba(239,68,68,0.4)",
              color: "#fff",
              maxWidth: "340px",
            },
            icon: null,
          }
        );
      } else if (timeLeft <= TWO_DAYS_MS) {
        // Within 2 days
        notifiedRef.current.add(project._id);

        const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
        const hours = Math.floor((timeLeft / (1000 * 60 * 60)) % 24);
        const timeStr = days > 0 ? `${days}d ${hours}h` : `${hours}h`;

        toast(
          (t) => (
            <div className="flex flex-col gap-1">
              <span className="font-bold text-white">⏰ Deadline Approaching</span>
              <span className="text-sm text-gray-300">
                <span className="text-yellow-400 font-semibold">{project.title}</span> is due in{" "}
                <span className="text-white font-bold">{timeStr}</span>.
              </span>
              <span className="text-xs text-gray-500">
                Member: {project.createdBy?.fullName}
              </span>
              <button
                onClick={() => toast.dismiss(t.id)}
                className="text-xs text-gray-500 hover:text-white mt-1 text-left"
              >
                Dismiss
              </button>
            </div>
          ),
          {
            duration: Infinity,
            style: {
              background: "#111a0a",
              border: "1px solid rgba(234,179,8,0.4)",
              color: "#fff",
              maxWidth: "340px",
            },
            icon: null,
          }
        );
      }
    });
  }, [projects]);

  const fetchData = async () => {
    try {
      const [usersRes, projectsRes, withdrawalsRes, meRes, adminHistRes] = await Promise.all([
        axiosInstance.get("/admin/pending-users"),
        axiosInstance.get("/projects"),
        axiosInstance.get("/withdrawals"),
        axiosInstance.get("/api/auth/me"),
        axiosInstance.get("/withdrawals/admin-history"),
      ]);
      setUsers(usersRes.data.users);
      setProjects(projectsRes.data.projects);
      setWithdrawals(withdrawalsRes.data.withdrawals);
      setAdminBalance(meRes.data.balance ?? 0);
      setAdminWithdrawals(adminHistRes.data.withdrawals);
    } catch (err) {
      console.error(err);
      if (err.response?.status === 401 || err.response?.status === 403) {
        router.push("/login");
        return;
      }
      setError("Failed to fetch admin data.");
    } finally {
      setLoading(false);
    }
  };

  // ── User Actions ──────────────────────────────────────────────────────────

  const handleApproveUser = async (userId) => {
    try {
      await axiosInstance.patch(`/admin/users/${userId}/approve`);
      setUsers((prev) => prev.filter((u) => u._id !== userId));
    } catch { setError("Failed to approve user."); }
  };

  const handleRejectUser = async (userId) => {
    try {
      await axiosInstance.patch(`/admin/users/${userId}/reject`);
      setUsers((prev) => prev.filter((u) => u._id !== userId));
    } catch { setError("Failed to reject user."); }
  };

  // ── Project Actions ───────────────────────────────────────────────────────

  const handleApproveProject = async (projectId, memberPercentage) => {
    try {
      await axiosInstance.patch(`/projects/${projectId}/status`, { status: "active", memberPercentage });
      setApproveModal(null);
      setDetailPanel(null);
      fetchData();
    } catch { setError("Failed to approve project."); setApproveModal(null); }
  };

  const handleProjectStatus = async (projectId, status) => {
    try {
      await axiosInstance.patch(`/projects/${projectId}/status`, { status });
      setDetailPanel(null);
      fetchData();
    } catch { setError("Failed to update project status."); }
  };

  // ── Extension Actions ─────────────────────────────────────────────────────

  const handleRequestExtension = async (projectId, date, reason) => {
    try {
      await axiosInstance.post(`/projects/${projectId}/extension`, { date, reason });
      setExtensionModal(null);
      setDetailPanel(null);
      fetchData();
    } catch { setError("Failed to request extension."); setExtensionModal(null); }
  };

  // ── PDF loader ────────────────────────────────────────────────────────────

  const handleLoadPdf = async (pdfUrl) => {
    try {
      const res = await axiosInstance.get(pdfUrl, { responseType: "blob" });
      window.open(URL.createObjectURL(res.data), "_blank");
    } catch { setError("Could not load PDF."); }
  };

  // ── Withdrawal Actions ────────────────────────────────────────────────────

  const handleApproveWithdrawal = async (withdrawalId) => {
    try {
      await axiosInstance.patch(`/withdrawals/${withdrawalId}/approve`);
      fetchData();
    } catch { setError("Failed to approve withdrawal."); }
  };

  const handleRejectWithdrawal = async (withdrawalId, adminNote) => {
    try {
      await axiosInstance.patch(`/withdrawals/${withdrawalId}/reject`, { adminNote });
      setRejectWithdrawalModal(null);
      fetchData();
    } catch { setError("Failed to reject withdrawal."); setRejectWithdrawalModal(null); }
  };

  if (authLoading || loading) return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="w-8 h-8 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin"></div>
    </div>
  );

  const adminTotalEarned = projects
    .filter((p) => p.status === "completed")
    .reduce((sum, p) => sum + p.revenue * ((100 - p.memberPercentage) / 100), 0);

  const adminPendingEarned = projects
    .filter((p) => p.status === "active")
    .reduce((sum, p) => sum + p.revenue * ((100 - p.memberPercentage) / 100), 0);

  const pendingWithdrawals = withdrawals.filter((w) => w.status === "pending");

  return (
    <div className="min-h-screen pt-8 relative">
      {/* Modals */}
      {approveModal && <ApproveProjectModal project={approveModal} onConfirm={handleApproveProject} onClose={() => setApproveModal(null)} />}
      {extensionModal && <ExtensionModal project={extensionModal} onConfirm={handleRequestExtension} onClose={() => setExtensionModal(null)} />}
      {rejectWithdrawalModal && <RejectWithdrawalModal withdrawal={rejectWithdrawalModal} onConfirm={handleRejectWithdrawal} onClose={() => setRejectWithdrawalModal(null)} />}
      {detailPanel && (
        <ProjectDetailPanel
          project={detailPanel}
          onClose={() => setDetailPanel(null)}
          onApprove={(project) => { setDetailPanel(null); setApproveModal(project); }}
          onReject={(projectId) => { setDetailPanel(null); handleProjectStatus(projectId, "rejected"); }}
          onComplete={(projectId) => { setDetailPanel(null); handleProjectStatus(projectId, "completed"); }}
          onExtend={(project) => { setDetailPanel(null); setExtensionModal(project); }}
          onLoadPdf={handleLoadPdf}
        />
      )}

      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-600/10 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="max-w-6xl mx-auto relative z-10">
        <h1 className="text-4xl font-black mb-2 text-white">Admin Dashboard</h1>
        <p className="text-emerald-400 mb-8 font-medium tracking-wide">Agency Command Center</p>

        {error && (
          <div className="p-4 mb-6 bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg text-sm flex justify-between items-center">
            {error}
            <button onClick={() => setError(null)} className="ml-4 font-bold">✕</button>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="glass-panel p-6 border-l-4 border-emerald-500">
            <p className="text-gray-400 text-sm font-medium mb-1">Total Agency Profit</p>
            <h2 className="text-4xl font-black text-white">${adminTotalEarned.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h2>
          </div>
          <div className="glass-panel p-6 border-l-4 border-yellow-500">
            <p className="text-gray-400 text-sm font-medium mb-1">Pending Agency Profit</p>
            <h2 className="text-4xl font-black text-white">${adminPendingEarned.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h2>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-8 border-b border-white/10 pb-4 flex-wrap">
          {[
            { key: "users", label: `Pending Users (${users.length})` },
            { key: "projects", label: `All Projects (${projects.length})` },
            { key: "withdrawals", label: `Withdrawals${pendingWithdrawals.length > 0 ? ` (${pendingWithdrawals.length} pending)` : ""}` },
            { key: "analytics", label: "Analytics" },
          ].map((tab) => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={`px-6 py-2 rounded-lg text-sm font-bold transition-colors ${activeTab === tab.key ? "bg-emerald-500 text-black" : "text-gray-400 hover:text-white hover:bg-white/5"}`}>
              {tab.label}
            </button>
          ))}
        </div>

        <div className="glass-panel overflow-hidden">

          {/* ── USERS TAB ── */}
          {activeTab === "users" && (
            <>
              <div className="px-8 py-5 border-b border-white/5 bg-black/20">
                <h2 className="text-lg font-semibold text-white flex items-center gap-3">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse-glow"></span>
                  Pending Approvals
                </h2>
              </div>
              {users.length === 0 ? (
                <div className="p-16 text-center text-gray-500">No pending registrations at the moment.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-white/5 text-sm text-gray-400 uppercase tracking-wider">
                        <th className="px-8 py-4 font-medium">User Profile</th>
                        <th className="px-8 py-4 font-medium">Contact</th>
                        <th className="px-8 py-4 font-medium">Date Applied</th>
                        <th className="px-8 py-4 font-medium text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {users.map((user) => (
                        <tr key={user._id} className="hover:bg-white/[0.02] transition-colors">
                          <td className="px-8 py-4">
                            <div className="font-semibold text-white">{user.fullName}</div>
                            <div className="text-xs text-emerald-500/70 uppercase tracking-wider mt-1">{user.role}</div>
                          </td>
                          <td className="px-8 py-4 text-gray-300">{user.email}</td>
                          <td className="px-8 py-4 text-gray-400 text-sm">{new Date(user.createdAt).toLocaleDateString()}</td>
                          <td className="px-8 py-4 text-right">
                            <div className="flex justify-end gap-3">
                              <button onClick={() => handleRejectUser(user._id)} className="px-4 py-2 text-sm font-medium text-red-400 hover:text-white hover:bg-red-500/20 rounded-lg transition-colors">Reject</button>
                              <button onClick={() => handleApproveUser(user._id)} className="btn-emerald px-6 py-2 text-sm">Approve</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}

          {/* ── PROJECTS TAB ── */}
          {activeTab === "projects" && (
            <>
              <div className="px-8 py-5 border-b border-white/5 bg-black/20">
                <h2 className="text-lg font-semibold text-white">Project Management</h2>
              </div>
              {projects.length === 0 ? (
                <div className="p-16 text-center text-gray-500">No projects submitted yet.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-white/5 text-sm text-gray-400 uppercase tracking-wider">
                        <th className="px-8 py-4 font-medium">Project</th>
                        <th className="px-8 py-4 font-medium">Member</th>
                        <th className="px-8 py-4 font-medium">Financials</th>
                        <th className="px-8 py-4 font-medium">Deadline</th>
                        <th className="px-8 py-4 font-medium">Status</th>
                        <th className="px-8 py-4 font-medium text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {projects.map((project) => (
                        <tr key={project._id} className="hover:bg-white/[0.02] transition-colors">
                          <td className="px-8 py-4">
                            <button
                              onClick={() => setDetailPanel(project)}
                              className="font-semibold text-white hover:text-emerald-400 transition-colors text-left"
                            >
                              {project.title}
                            </button>
                            <div className="text-xs text-gray-500 mt-1 line-clamp-1 max-w-[200px]">{project.description}</div>
                            {project.pdfUrl && (
                              <button
                                onClick={async () => handleLoadPdf(project.pdfUrl)}
                                className="text-emerald-400 text-xs mt-2 inline-block hover:underline bg-transparent border-none cursor-pointer p-0"
                              >View PDF</button>
                            )}
                          </td>
                          <td className="px-8 py-4">
                            <div className="text-gray-300 font-medium">{project.createdBy.fullName}</div>
                            <div className="text-xs text-gray-500">{project.createdBy.email}</div>
                          </td>
                          <td className="px-8 py-4">
                            <div className="text-white">${project.revenue.toLocaleString()}</div>
                            <div className="text-xs text-emerald-400 mt-1">{project.memberPercentage}% member share</div>
                          </td>
                          <td className="px-8 py-4">
                            <DeadlineCountdown deadline={project.deadline} status={project.status} variant="table" />
                          </td>
                          <td className="px-8 py-4">
                            <span className={`px-2 py-1 rounded text-xs font-bold uppercase tracking-wider ${
                              project.status === "active" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" :
                              project.status === "completed" ? "bg-blue-500/10 text-blue-400 border border-blue-500/20" :
                              project.status === "rejected" ? "bg-red-500/10 text-red-400 border border-red-500/20" :
                              "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20"
                            }`}>
                              {project.status.replace("_", " ")}
                            </span>
                            {project.extensionRequest?.status === "pending" && (
                              <div className="mt-3 p-2 bg-yellow-500/10 border border-yellow-500/30 rounded text-xs">
                                <span className="text-yellow-400 font-bold block mb-1">Extension Requested!</span>
                                <span className="text-gray-400 block">Waiting for member to approve.</span>
                              </div>
                            )}
                          </td>
                          <td className="px-8 py-4 text-right">
                            <div className="flex justify-end gap-2 flex-col items-end">
                              <button
                                onClick={() => setDetailPanel(project)}
                                className="px-4 py-1.5 text-xs text-gray-400 border border-white/10 rounded hover:bg-white/5 hover:text-white transition-colors w-full max-w-[130px]"
                              >
                                View Details
                              </button>
                              {project.status === "pending_approval" && (
                                <div className="flex gap-2 w-full max-w-[130px]">
                                  <button onClick={() => handleProjectStatus(project._id, "rejected")} className="flex-1 py-1.5 text-xs text-red-400 hover:bg-red-500/20 rounded transition-colors border border-red-500/20">Reject</button>
                                  <button onClick={() => setApproveModal(project)} className="flex-1 btn-emerald py-1.5 text-xs">Approve</button>
                                </div>
                              )}
                              {project.status === "active" && (
                                <>
                                  <button onClick={() => handleProjectStatus(project._id, "completed")} className="px-4 py-1.5 text-xs font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded hover:bg-blue-500/30 transition-colors w-full max-w-[130px]">
                                    Mark Completed
                                  </button>
                                  {project.extensionRequest?.status !== "pending" && (
                                    <button onClick={() => setExtensionModal(project)} className="px-4 py-1.5 text-xs text-yellow-400 border border-yellow-500/30 rounded hover:bg-yellow-500/10 transition-colors w-full max-w-[130px]">
                                      Extend Deadline
                                    </button>
                                  )}
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}

          {/* ── WITHDRAWALS TAB ── */}
          {activeTab === "withdrawals" && (
            <>
              <div className="px-8 py-5 border-b border-white/5 bg-black/20">
                <h2 className="text-lg font-semibold text-white">Withdrawal Requests</h2>
              </div>
              {withdrawals.length === 0 ? (
                <div className="p-16 text-center text-gray-500">No withdrawal requests yet.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-white/5 text-sm text-gray-400 uppercase tracking-wider">
                        <th className="px-8 py-4 font-medium">Member</th>
                        <th className="px-8 py-4 font-medium">Amount</th>
                        <th className="px-8 py-4 font-medium">Note / Payment Info</th>
                        <th className="px-8 py-4 font-medium">Date</th>
                        <th className="px-8 py-4 font-medium">Status</th>
                        <th className="px-8 py-4 font-medium text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {withdrawals.map((w) => (
                        <tr key={w._id} className="hover:bg-white/[0.02] transition-colors">
                          <td className="px-8 py-4">
                            <div className="text-white font-semibold">{w.user?.fullName}</div>
                            <div className="text-xs text-gray-500">{w.user?.email}</div>
                            <div className="text-xs text-emerald-400 mt-1">Balance: ${w.user?.balance?.toFixed(2)}</div>
                          </td>
                          <td className="px-8 py-4">
                            <span className="text-white font-bold text-lg">${w.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                          </td>
                          <td className="px-8 py-4 text-gray-400 text-sm max-w-[200px]">
                            {w.note || <span className="text-gray-600 italic">No note</span>}
                            {w.adminNote && <p className="text-red-400 text-xs mt-1">Rejection reason: {w.adminNote}</p>}
                          </td>
                          <td className="px-8 py-4 text-gray-400 text-sm">{new Date(w.createdAt).toLocaleDateString()}</td>
                          <td className="px-8 py-4">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wider ${
                              w.status === "approved" ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/30" :
                              w.status === "rejected" ? "text-red-400 bg-red-500/10 border-red-500/30" :
                              "text-yellow-400 bg-yellow-500/10 border-yellow-500/30"
                            }`}>
                              {w.status}
                            </span>
                          </td>
                          <td className="px-8 py-4 text-right">
                            {w.status === "pending" && (
                              <div className="flex justify-end gap-2">
                                <button onClick={() => setRejectWithdrawalModal(w)} className="px-3 py-1.5 text-xs text-red-400 hover:bg-red-500/20 rounded transition-colors">Reject</button>
                                <button onClick={() => handleApproveWithdrawal(w._id)} className="btn-emerald px-4 py-1.5 text-xs">Approve</button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}

          {/* ── ANALYTICS TAB ── */}
          {activeTab === "analytics" && (
            <AnalyticsTab projects={projects} withdrawals={withdrawals} />
          )}

        </div>
      </div>
    </div>
  );
}
