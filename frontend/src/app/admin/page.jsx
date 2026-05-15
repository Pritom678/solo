"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axiosInstance from "../../lib/axios";
import { useAuth } from "../../lib/useAuth";

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("users");

  // Modal state
  const [approveModal, setApproveModal] = useState(null);
  const [extensionModal, setExtensionModal] = useState(null);
  const [rejectWithdrawalModal, setRejectWithdrawalModal] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [usersRes, projectsRes, withdrawalsRes] = await Promise.all([
        axiosInstance.get("/admin/pending-users"),
        axiosInstance.get("/projects"),
        axiosInstance.get("/withdrawals"),
      ]);
      setUsers(usersRes.data.users);
      setProjects(projectsRes.data.projects);
      setWithdrawals(withdrawalsRes.data.withdrawals);
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
      fetchData();
    } catch { setError("Failed to approve project."); setApproveModal(null); }
  };

  const handleProjectStatus = async (projectId, status) => {
    try {
      await axiosInstance.patch(`/projects/${projectId}/status`, { status });
      fetchData();
    } catch { setError("Failed to update project status."); }
  };

  // ── Extension Actions ─────────────────────────────────────────────────────

  const handleRequestExtension = async (projectId, date, reason) => {
    try {
      await axiosInstance.post(`/projects/${projectId}/extension`, { date, reason });
      setExtensionModal(null);
      fetchData();
    } catch { setError("Failed to request extension."); setExtensionModal(null); }
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
                        <th className="px-8 py-4 font-medium">Status</th>
                        <th className="px-8 py-4 font-medium text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {projects.map((project) => (
                        <tr key={project._id} className="hover:bg-white/[0.02] transition-colors">
                          <td className="px-8 py-4">
                            <div className="font-semibold text-white">{project.title}</div>
                            <div className="text-xs text-gray-500 mt-1 line-clamp-1 max-w-[200px]">{project.description}</div>
                            {project.pdfUrl && (
                              <button
                                onClick={async () => {
                                  try {
                                    const res = await axiosInstance.get(project.pdfUrl, { responseType: "blob" });
                                    window.open(URL.createObjectURL(res.data), "_blank");
                                  } catch { setError("Could not load PDF."); }
                                }}
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
                            {project.status === "pending_approval" && (
                              <div className="flex justify-end gap-2">
                                <button onClick={() => handleProjectStatus(project._id, "rejected")} className="px-3 py-1 text-xs text-red-400 hover:bg-red-500/20 rounded">Reject</button>
                                <button onClick={() => setApproveModal(project)} className="btn-emerald px-4 py-1.5 text-xs">Approve & Set Terms</button>
                              </div>
                            )}
                            {project.status === "active" && (
                              <div className="flex justify-end gap-2 flex-col items-end">
                                <button onClick={() => handleProjectStatus(project._id, "completed")} className="px-4 py-1.5 text-xs font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded hover:bg-blue-500/30 transition-colors w-full max-w-[130px]">
                                  Mark Completed
                                </button>
                                {project.extensionRequest?.status !== "pending" && (
                                  <button onClick={() => setExtensionModal(project)} className="px-4 py-1.5 text-xs text-yellow-400 border border-yellow-500/30 rounded hover:bg-yellow-500/10 transition-colors w-full max-w-[130px]">
                                    Extend Deadline
                                  </button>
                                )}
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

        </div>
      </div>
    </div>
  );
}
