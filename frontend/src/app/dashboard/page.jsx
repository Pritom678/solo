"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axiosInstance from "../../lib/axios";
import Link from "next/link";

export default function Dashboard() {
  const router = useRouter();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const res = await axiosInstance.get("/projects");
      setProjects(res.data.projects);
    } catch (err) {
      console.error(err);
      if (err.response?.status === 401) {
        router.push("/login");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleExtensionResponse = async (projectId, status) => {
    try {
      await axiosInstance.patch(`/projects/${projectId}/extension`, { status });
      fetchProjects();
    } catch (err) {
      alert("Failed to respond to extension");
    }
  };

  const getTimeLeft = (deadlineDate) => {
    const total = Date.parse(deadlineDate) - Date.parse(new Date());
    if (total <= 0) return "Overdue";
    const days = Math.floor(total / (1000 * 60 * 60 * 24));
    if (days > 0) return `${days} day${days > 1 ? 's' : ''} left`;
    const hours = Math.floor((total / (1000 * 60 * 60)) % 24);
    return `${hours} hr${hours > 1 ? 's' : ''} left`;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "active": return "text-emerald-400 bg-emerald-500/10 border-emerald-500/30";
      case "completed": return "text-blue-400 bg-blue-500/10 border-blue-500/30";
      case "rejected": return "text-red-400 bg-red-500/10 border-red-500/30";
      default: return "text-yellow-400 bg-yellow-500/10 border-yellow-500/30";
    }
  };

  const totalEarned = projects
    .filter(p => p.status === "completed")
    .reduce((sum, p) => sum + (p.revenue * (p.memberPercentage / 100)), 0);

  const pendingEarned = projects
    .filter(p => ["active", "pending_approval"].includes(p.status))
    .reduce((sum, p) => sum + (p.revenue * (p.memberPercentage / 100)), 0);

  if (loading) return <div className="flex min-h-[60vh] items-center justify-center"><div className="w-8 h-8 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin"></div></div>;

  return (
    <div className="max-w-6xl mx-auto w-full pt-8 relative z-10">
      
      {/* Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
        <div className="glass-panel p-6 border-l-4 border-emerald-500">
          <p className="text-gray-400 text-sm font-medium mb-1">Total Earned</p>
          <h2 className="text-4xl font-black text-white">${totalEarned.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</h2>
        </div>
        <div className="glass-panel p-6 border-l-4 border-yellow-500">
          <p className="text-gray-400 text-sm font-medium mb-1">Pending Revenue</p>
          <h2 className="text-4xl font-black text-white">${pendingEarned.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</h2>
        </div>
      </div>

      <div className="flex justify-between items-end mb-6 border-b border-white/5 pb-4">
        <div>
          <h1 className="text-3xl font-black text-white">Your Projects</h1>
        </div>
        <Link href="/dashboard/submit" className="btn-emerald">
          Submit New Project
        </Link>
      </div>

      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {projects.length === 0 ? (
          <div className="col-span-full glass-panel p-16 text-center text-gray-500">
            You haven't submitted any projects yet.
          </div>
        ) : (
          projects.map((project) => (
            <div key={project._id} className="glass-panel p-6 flex flex-col h-full hover:-translate-y-1 transition-transform relative">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-bold text-white line-clamp-1">{project.title}</h3>
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wider ${getStatusColor(project.status)}`}>
                  {project.status.replace("_", " ")}
                </span>
              </div>
              <p className="text-gray-400 text-sm mb-6 line-clamp-2 flex-grow">{project.description}</p>

              <div className="space-y-3 pt-4 border-t border-white/5 bg-black/20 -mx-6 px-6 pb-6 pt-4 mt-auto rounded-b-2xl">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Your Share</span>
                  <span className="font-bold text-emerald-400">${(project.revenue * (project.memberPercentage / 100)).toLocaleString()} <span className="text-gray-500 font-normal text-xs">({project.memberPercentage}%)</span></span>
                </div>
                <div className="flex justify-between text-sm items-center">
                  <span className="text-gray-500">Deadline</span>
                  <div className="text-right">
                    <span className="text-gray-300 font-medium block">
                      {new Date(project.deadline).toLocaleDateString()}
                    </span>
                    {project.status === "active" && (
                      <span className={`text-[10px] uppercase tracking-wider font-bold ${getTimeLeft(project.deadline) === 'Overdue' ? 'text-red-400' : 'text-emerald-500'}`}>
                        {getTimeLeft(project.deadline)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Extension Logic */}
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
                  <a
                    href={`http://localhost:8080${project.pdfUrl}`}
                    target="_blank"
                    rel="noreferrer"
                    className="block w-full py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-center rounded-lg text-sm text-emerald-400 transition-colors border border-emerald-500/20 mt-3 font-medium"
                  >
                    View Project PDF
                  </a>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
