"use client";

import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell,
} from "recharts";

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const CHART_COLORS = { agency: "#10b981", member: "#3b82f6", projects: "#f59e0b", withdrawals: "#a78bfa" };
const PIE_COLORS   = ["#f59e0b", "#10b981", "#3b82f6", "#ef4444"];
const AXIS_STYLE   = { fill: "#475569", fontSize: 10, fontFamily: "monospace" };
const GRID_STYLE   = { stroke: "rgba(255,255,255,0.04)" };

// ── Custom tooltip ────────────────────────────────────────────────────────────

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const isMoney = (name) =>
    ["revenue","profit","withdrawn","member"].some((k) => name.toLowerCase().includes(k));
  return (
    <div className="bg-[#0a0c10] border border-emerald-500/20 rounded-lg p-3 text-xs font-mono shadow-xl min-w-[160px]">
      <p className="text-slate-400 mb-2 uppercase tracking-wider text-[10px]">{label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex justify-between gap-4" style={{ color: p.color }}>
          <span className="text-slate-400">{p.name}</span>
          <span className="font-bold">
            {isMoney(p.name)
              ? `$${Number(p.value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
              : p.value}
          </span>
        </div>
      ))}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function AnalyticsTab({ projects, withdrawals }) {
  // Last 12 calendar months
  const now = new Date();
  const months = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 11 + i, 1);
    return {
      label: `${MONTHS[d.getMonth()]} ${String(d.getFullYear()).slice(2)}`,
      year:  d.getFullYear(),
      month: d.getMonth(),
    };
  });

  // Revenue split per month (completed projects, bucketed by updatedAt)
  const revenueData = months.map(({ label, year, month }) => {
    const done = projects.filter((p) => {
      if (p.status !== "completed") return false;
      const d = new Date(p.updatedAt);
      return d.getFullYear() === year && d.getMonth() === month;
    });
    return {
      month,
      "Agency Profit":  +done.reduce((s, p) => s + p.revenue * ((100 - p.memberPercentage) / 100), 0).toFixed(2),
      "Member Revenue": +done.reduce((s, p) => s + p.revenue * (p.memberPercentage / 100), 0).toFixed(2),
    };
  }).map((d, i) => ({ ...d, month: months[i].label }));

  // Project activity per month
  const activityData = months.map(({ label, year, month }) => ({
    month: label,
    Submitted: projects.filter((p) => { const d = new Date(p.createdAt); return d.getFullYear() === year && d.getMonth() === month; }).length,
    Completed: projects.filter((p) => {
      if (p.status !== "completed") return false;
      const d = new Date(p.updatedAt);
      return d.getFullYear() === year && d.getMonth() === month;
    }).length,
  }));

  // Approved withdrawals per month
  const withdrawalData = months.map(({ label, year, month }) => ({
    month: label,
    Withdrawn: +withdrawals
      .filter((w) => { if (w.status !== "approved") return false; const d = new Date(w.updatedAt); return d.getFullYear() === year && d.getMonth() === month; })
      .reduce((s, w) => s + w.amount, 0)
      .toFixed(2),
  }));

  // Status pie
  const statusCounts = ["pending_approval","active","completed","rejected"]
    .map((s) => ({ name: s.replace("_"," "), value: projects.filter((p) => p.status === s).length }))
    .filter((d) => d.value > 0);

  // KPIs
  const totalRevenue   = projects.filter(p => p.status === "completed").reduce((s, p) => s + p.revenue, 0);
  const totalWithdrawn = withdrawals.filter(w => w.status === "approved").reduce((s, w) => s + w.amount, 0);
  const activeCount    = projects.filter(p => p.status === "active").length;
  const completionRate = projects.length
    ? Math.round((projects.filter(p => p.status === "completed").length / projects.length) * 100)
    : 0;

  const fmt = (n) => n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const fmtK = (v) => v >= 1000 ? `$${(v/1000).toFixed(0)}k` : `$${v}`;

  return (
    <div className="p-6 space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] font-mono text-emerald-500/50 tracking-widest uppercase mb-1">Analytics / Overview</p>
          <h2 className="text-lg font-black text-white">Monthly Performance</h2>
        </div>
        <span className="text-[10px] font-mono text-slate-600 border border-white/10 rounded px-2 py-1">Last 12 months</span>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total Revenue",    value: `$${fmt(totalRevenue)}`,   color: "text-emerald-400", dot: "bg-emerald-400" },
          { label: "Total Withdrawn",  value: `$${fmt(totalWithdrawn)}`, color: "text-purple-400",  dot: "bg-purple-400"  },
          { label: "Active Projects",  value: activeCount,               color: "text-yellow-400",  dot: "bg-yellow-400"  },
          { label: "Completion Rate",  value: `${completionRate}%`,      color: "text-blue-400",    dot: "bg-blue-400"    },
        ].map((k) => (
          <div key={k.label} className="bg-black/30 border border-white/[0.06] rounded-lg p-4">
            <div className="flex items-center gap-1.5 mb-2">
              <span className={`w-1.5 h-1.5 rounded-full ${k.dot}`} />
              <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">{k.label}</p>
            </div>
            <p className={`text-2xl font-black font-mono tabular-nums ${k.color}`}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* Revenue area chart */}
      <div className="bg-black/30 border border-white/[0.06] rounded-lg p-5">
        <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-4">Revenue Split — Completed Projects</p>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={revenueData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="agencyGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#10b981" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0}    />
              </linearGradient>
              <linearGradient id="memberGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}   />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" {...GRID_STYLE} />
            <XAxis dataKey="month" tick={AXIS_STYLE} axisLine={false} tickLine={false} />
            <YAxis tick={AXIS_STYLE} axisLine={false} tickLine={false} tickFormatter={fmtK} width={48} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: 10, fontFamily: "monospace", paddingTop: 12 }} />
            <Area type="monotone" dataKey="Agency Profit"  stroke={CHART_COLORS.agency}   strokeWidth={2} fill="url(#agencyGrad)" dot={false} activeDot={{ r: 4 }} />
            <Area type="monotone" dataKey="Member Revenue" stroke={CHART_COLORS.projects} strokeWidth={2} fill="url(#memberGrad)" dot={false} activeDot={{ r: 4 }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Project activity */}
        <div className="bg-black/30 border border-white/[0.06] rounded-lg p-5">
          <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-4">Project Activity</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={activityData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }} barSize={6} barGap={2}>
              <CartesianGrid strokeDasharray="3 3" {...GRID_STYLE} />
              <XAxis dataKey="month" tick={AXIS_STYLE} axisLine={false} tickLine={false} />
              <YAxis tick={AXIS_STYLE} axisLine={false} tickLine={false} allowDecimals={false} width={24} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 10, fontFamily: "monospace", paddingTop: 8 }} />
              <Bar dataKey="Submitted" fill={CHART_COLORS.projects} radius={[2,2,0,0]} />
              <Bar dataKey="Completed" fill={CHART_COLORS.agency}   radius={[2,2,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Withdrawals */}
        <div className="bg-black/30 border border-white/[0.06] rounded-lg p-5">
          <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-4">Approved Withdrawals</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={withdrawalData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }} barSize={10}>
              <CartesianGrid strokeDasharray="3 3" {...GRID_STYLE} />
              <XAxis dataKey="month" tick={AXIS_STYLE} axisLine={false} tickLine={false} />
              <YAxis tick={AXIS_STYLE} axisLine={false} tickLine={false} tickFormatter={fmtK} width={40} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="Withdrawn" fill={CHART_COLORS.withdrawals} radius={[2,2,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Status donut */}
        <div className="bg-black/30 border border-white/[0.06] rounded-lg p-5 flex flex-col">
          <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-4">Status Breakdown</p>
          {statusCounts.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-slate-600 text-xs font-mono">// no data</div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={statusCounts} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value" strokeWidth={0}>
                    {statusCounts.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-3 space-y-1.5">
                {statusCounts.map((s, i) => (
                  <div key={s.name} className="flex items-center justify-between text-[10px] font-mono">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-sm" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                      <span className="text-slate-400 capitalize">{s.name}</span>
                    </div>
                    <span className="text-white font-bold">{s.value}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

      </div>
    </div>
  );
}
