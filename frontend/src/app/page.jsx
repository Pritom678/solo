import Link from "next/link";

const features = [
  {
    icon: "◈",
    title: "Revenue Tracking",
    desc: "Real-time project earnings with automatic balance crediting on completion.",
  },
  {
    icon: "⬡",
    title: "Smart Approvals",
    desc: "Admin-controlled project pipeline with configurable revenue splits.",
  },
  {
    icon: "◎",
    title: "Withdrawal System",
    desc: "Request payouts with full audit trail and admin approval workflow.",
  },
];

export default function Home() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center min-h-[75vh] relative">

      {/* Grid lines */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute left-1/4 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-emerald-500/8 to-transparent" />
        <div className="absolute right-1/4 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-emerald-500/8 to-transparent" />
        <div className="absolute top-1/3 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-500/8 to-transparent" />
      </div>

      {/* Hero */}
      <div className="max-w-4xl text-center space-y-6 animate-fade-up relative z-10">

        {/* System tag */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded border border-emerald-500/25 bg-emerald-500/5 text-emerald-400 text-xs font-mono tracking-widest uppercase animate-pulse-glow">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" />
          System Online — v2.0
        </div>

        <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-[1.05]">
          <span className="text-white">Revenue</span>{" "}
          <span className="text-emerald-gradient">Intelligence</span>
          <br />
          <span className="text-white">Platform</span>
          <span className="text-emerald-400 animate-blink">_</span>
        </h1>

        <p className="text-base md:text-lg text-slate-400 max-w-xl mx-auto leading-relaxed font-light">
          Track project earnings, manage revenue splits, and process withdrawals —
          all in one command center built for modern agencies.
        </p>

        <div className="flex justify-center gap-4 pt-4 flex-wrap">
          <Link href="/signup" className="btn-emerald text-sm px-7 py-3">
            Get Access
          </Link>
          <Link href="/login" className="btn-outline-emerald text-sm px-7 py-3">
            Sign In
          </Link>
        </div>

        {/* Terminal hint */}
        <p className="text-xs text-slate-600 font-mono tracking-wider pt-2">
          $ solo --init --mode=agency
        </p>
      </div>

      {/* Feature cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-20 w-full max-w-4xl animate-fade-up relative z-10" style={{ animationDelay: "0.15s" }}>
        {features.map((f) => (
          <div key={f.title} className="glass-panel corner-bracket p-6 group hover:-translate-y-1 transition-transform duration-300">
            <div className="text-2xl text-emerald-400 mb-3 font-mono">{f.icon}</div>
            <h3 className="text-white font-bold text-sm mb-2 tracking-wide">{f.title}</h3>
            <p className="text-slate-500 text-xs leading-relaxed">{f.desc}</p>
          </div>
        ))}
      </div>

      {/* Ambient blobs */}
      <div className="absolute top-[15%] left-[5%] w-64 h-64 bg-emerald-600/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[10%] right-[5%] w-80 h-80 bg-emerald-900/15 rounded-full blur-[120px] pointer-events-none" />
    </div>
  );
}
