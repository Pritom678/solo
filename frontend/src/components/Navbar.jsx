"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import axiosInstance from "../lib/axios";

export default function Navbar() {
  const [user, setUser] = useState(null);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    checkUser();
  }, [pathname]);

  const checkUser = async () => {
    try {
      const res = await axiosInstance.get("/api/auth/me");
      setUser(res.data);
    } catch {
      setUser(null);
    }
  };

  const handleLogout = async () => {
    try {
      await axiosInstance.post("/api/auth/logout");
      setUser(null);
      router.push("/login");
    } catch (err) {
      console.error("Logout failed", err);
    }
  };

  const navLink = (href, label) => {
    const active = pathname === href || pathname.startsWith(href + "/");
    return (
      <Link
        href={href}
        className={`relative text-xs font-semibold tracking-widest uppercase transition-colors px-1 py-0.5 ${
          active ? "text-emerald-400" : "text-slate-400 hover:text-slate-200"
        }`}
      >
        {label}
        {active && (
          <span className="absolute -bottom-1 left-0 right-0 h-px bg-emerald-400 rounded-full" />
        )}
      </Link>
    );
  };

  return (
    <header className="sticky top-0 z-50 px-6 md:px-8 pt-4 pb-2">
      <nav className="glass-panel px-5 py-3 flex items-center justify-between">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-6 h-6 rounded border border-emerald-500/40 bg-emerald-500/10 flex items-center justify-center">
            <span className="text-emerald-400 text-[10px] font-black font-mono">S</span>
          </div>
          <span className="text-sm font-black tracking-[0.15em] uppercase text-white group-hover:text-emerald-400 transition-colors font-mono">
            SOLO
          </span>
          <span className="text-emerald-500/50 text-xs font-mono hidden sm:inline">v2</span>
        </Link>

        {/* Nav links + user */}
        <div className="flex items-center gap-5">
          {user ? (
            <>
              {user.role !== "admin" && navLink("/dashboard", "Dashboard")}
              {user.role === "admin" && navLink("/admin", "Admin")}

              <div className="w-px h-4 bg-slate-700 mx-1" />

              {/* User chip */}
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center text-emerald-400 text-[10px] font-black font-mono">
                  {user.fullName.charAt(0).toUpperCase()}
                </div>
                <div className="hidden sm:flex flex-col leading-none">
                  <span className="text-xs text-white font-semibold">{user.fullName}</span>
                  <span className="text-[9px] text-emerald-500/70 uppercase tracking-widest font-mono">{user.role}</span>
                </div>
              </div>

              <button
                onClick={handleLogout}
                className="text-[10px] font-bold tracking-widest uppercase text-slate-500 hover:text-red-400 transition-colors border border-slate-700 hover:border-red-500/40 rounded px-2.5 py-1.5"
              >
                Exit
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="text-xs font-semibold tracking-widest uppercase text-slate-400 hover:text-slate-200 transition-colors">
                Sign In
              </Link>
              <Link href="/signup" className="btn-emerald text-[10px] py-2 px-4">
                Get Access
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
