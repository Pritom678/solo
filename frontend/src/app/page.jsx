import Link from "next/link";

export default function Home() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center min-h-[70vh]">
      <div className="max-w-4xl text-center space-y-8 animate-float">
        <div className="inline-block px-4 py-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-sm font-medium tracking-wide mb-4 animate-pulse-glow">
          Next Generation Finance Tracking
        </div>
        <h1 className="text-6xl md:text-7xl font-extrabold tracking-tight">
          Manage your revenue with <br/>
          <span className="text-emerald-gradient">precision & style.</span>
        </h1>
        <p className="text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
          Your premium project revenue sharing dashboard. Track earnings, manage submissions, and streamline administrative approvals effortlessly.
        </p>
        <div className="flex justify-center gap-6 pt-8">
          <Link href="/signup" className="btn-emerald text-lg px-8 py-4">
            Get Started Free
          </Link>
          <Link href="/login" className="btn-outline-emerald text-lg px-8 py-4">
            Access Dashboard
          </Link>
        </div>
      </div>
      
      <div className="absolute top-[20%] left-[10%] w-72 h-72 bg-emerald-600/20 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[20%] right-[10%] w-96 h-96 bg-emerald-900/30 rounded-full blur-[150px] pointer-events-none"></div>
    </div>
  );
}
