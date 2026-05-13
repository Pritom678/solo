"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axiosInstance from "../../lib/axios";

export default function AdminDashboard() {
  const router = useRouter();
  const [users, setUsers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("users"); // "users", "projects"

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [usersRes, projectsRes] = await Promise.all([
        axiosInstance.get("/admin/pending-users"),
        axiosInstance.get("/projects")
      ]);
      setUsers(usersRes.data.users);
      setProjects(projectsRes.data.projects);
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

  // User Actions
  const handleApproveUser = async (userId) => {
    try {
      await axiosInstance.patch(`/admin/users/${userId}/approve`);
      setUsers(users.filter((user) => user._id !== userId));
    } catch (err) {
      alert("Failed to approve user");
    }
  };

  const handleRejectUser = async (userId) => {
    try {
      await axiosInstance.patch(`/admin/users/${userId}/reject`);
      setUsers(users.filter((user) => user._id !== userId));
    } catch (err) {
      alert("Failed to reject user");
    }
  };

  // Project Actions
  const handleApproveProject = async (projectId) => {
    const percentage = prompt("Enter member percentage cut (0-100):", "50");
    if (percentage === null || percentage === "") return;
    const num = Number(percentage);
    if (isNaN(num) || num < 0 || num > 100) return alert("Invalid percentage");

    try {
      await axiosInstance.patch(`/projects/${projectId}/status`, { 
        status: "active", 
        memberPercentage: num
      });
      fetchData();
    } catch (err) {
      alert("Failed to approve project");
    }
  };

  const handleProjectStatus = async (projectId, status) => {
    try {
      await axiosInstance.patch(`/projects/${projectId}/status`, { status });
      fetchData();
    } catch (err) {
      alert("Failed to update project status");
    }
  };

  // Extension Actions
  const handleRequestExtension = async (projectId) => {
    const date = prompt("Enter new deadline date (YYYY-MM-DD):");
    if (!date) return;
    const reason = prompt("Enter reason for extension:");
    if (!reason) return;

    try {
      await axiosInstance.post(`/projects/${projectId}/extension`, { date, reason });
      fetchData();
    } catch (err) {
      alert("Failed to request extension");
    }
  };

  if (loading) return <div className="flex min-h-[60vh] items-center justify-center"><div className="w-8 h-8 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin"></div></div>;

  const adminTotalEarned = projects
    .filter(p => p.status === "completed")
    .reduce((sum, p) => sum + (p.revenue * ((100 - p.memberPercentage) / 100)), 0);

  const adminPendingEarned = projects
    .filter(p => ["active", "pending_approval"].includes(p.status))
    .reduce((sum, p) => sum + (p.revenue * ((100 - (p.memberPercentage || 0)) / 100)), 0);

  return (
    <div className="min-h-screen pt-8 relative">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-600/10 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="max-w-6xl mx-auto relative z-10">
        <h1 className="text-4xl font-black mb-2 text-white">Admin Dashboard</h1>
        <p className="text-emerald-400 mb-8 font-medium tracking-wide">Agency Command Center</p>
        
        {error && <div className="p-4 mb-6 bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg text-sm">{error}</div>}

        {/* Admin Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="glass-panel p-6 border-l-4 border-emerald-500">
            <p className="text-gray-400 text-sm font-medium mb-1">Total Agency Profit</p>
            <h2 className="text-4xl font-black text-white">${adminTotalEarned.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</h2>
          </div>
          <div className="glass-panel p-6 border-l-4 border-yellow-500">
            <p className="text-gray-400 text-sm font-medium mb-1">Pending Agency Profit</p>
            <h2 className="text-4xl font-black text-white">${adminPendingEarned.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</h2>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-8 border-b border-white/10 pb-4">
          <button 
            onClick={() => setActiveTab("users")}
            className={`px-6 py-2 rounded-lg text-sm font-bold transition-colors ${activeTab === "users" ? "bg-emerald-500 text-black" : "text-gray-400 hover:text-white hover:bg-white/5"}`}
          >
            Pending Users ({users.length})
          </button>
          <button 
            onClick={() => setActiveTab("projects")}
            className={`px-6 py-2 rounded-lg text-sm font-bold transition-colors ${activeTab === "projects" ? "bg-emerald-500 text-black" : "text-gray-400 hover:text-white hover:bg-white/5"}`}
          >
            All Projects ({projects.length})
          </button>
        </div>

        <div className="glass-panel overflow-hidden">
          
          {/* USERS TAB */}
          {activeTab === "users" && (
            <>
              <div className="px-8 py-5 border-b border-white/5 bg-black/20 flex justify-between items-center">
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

          {/* PROJECTS TAB */}
          {activeTab === "projects" && (
            <>
              <div className="px-8 py-5 border-b border-white/5 bg-black/20 flex justify-between items-center">
                <h2 className="text-lg font-semibold text-white flex items-center gap-3">Project Management</h2>
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
                        <th className="px-8 py-4 font-medium">Status & Requests</th>
                        <th className="px-8 py-4 font-medium text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {projects.map((project) => (
                        <tr key={project._id} className="hover:bg-white/[0.02] transition-colors">
                          <td className="px-8 py-4">
                            <div className="font-semibold text-white">{project.title}</div>
                            <div className="text-xs text-gray-500 mt-1 line-clamp-1 max-w-[200px]">{project.description}</div>
                            {project.pdfUrl && <a href={`http://localhost:8080${project.pdfUrl}`} target="_blank" className="text-emerald-400 text-xs mt-2 inline-block hover:underline">View PDF</a>}
                          </td>
                          <td className="px-8 py-4">
                            <div className="text-gray-300 font-medium">{project.createdBy.fullName}</div>
                            <div className="text-xs text-gray-500">{project.createdBy.email}</div>
                          </td>
                          <td className="px-8 py-4">
                            <div className="text-white">${project.revenue.toLocaleString()}</div>
                            <div className="text-xs text-emerald-400 mt-1">{project.memberPercentage}% share</div>
                          </td>
                          <td className="px-8 py-4">
                            <span className={`px-2 py-1 rounded text-xs font-bold uppercase tracking-wider ${
                              project.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                              project.status === 'completed' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                              project.status === 'rejected' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                              'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                            }`}>
                              {project.status.replace("_", " ")}
                            </span>
                            
                            {/* Extension Display */}
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
                                <button onClick={() => handleApproveProject(project._id)} className="btn-emerald px-4 py-1.5 text-xs">Approve & Set Terms</button>
                              </div>
                            )}
                            {project.status === "active" && (
                              <div className="flex justify-end gap-2 flex-col items-end">
                                <button onClick={() => handleProjectStatus(project._id, "completed")} className="px-4 py-1.5 text-xs font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded hover:bg-blue-500/30 transition-colors w-full max-w-[120px]">
                                  Mark Completed
                                </button>
                                {!project.extensionRequest?.status && (
                                  <button onClick={() => handleRequestExtension(project._id)} className="px-4 py-1.5 text-xs text-yellow-400 border border-yellow-500/30 rounded hover:bg-yellow-500/10 transition-colors w-full max-w-[120px]">
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

        </div>
      </div>
    </div>
  );
}
