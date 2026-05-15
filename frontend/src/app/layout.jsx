import "./globals.css";
import { Inter, JetBrains_Mono } from "next/font/google";
import Navbar from "../components/Navbar";
import { Toaster } from "react-hot-toast";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono", weight: ["400", "700"] });

export const metadata = {
  title: "SOLO — Revenue Intelligence",
  description: "Project revenue tracking and management platform",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`h-full antialiased ${inter.variable} ${mono.variable} ${inter.className}`}>
      <body className="min-h-full flex flex-col relative overflow-x-hidden">

        {/* Fixed background layers */}
        <div className="fixed inset-0 z-[-2] bg-[#050508]" />
        <div className="fixed inset-0 z-[-1] pointer-events-none">
          {/* Primary glow — top center */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-emerald-500/[0.06] rounded-full blur-[120px]" />
          {/* Secondary glow — bottom right */}
          <div className="absolute bottom-0 right-0 w-[600px] h-[400px] bg-emerald-900/[0.08] rounded-full blur-[100px]" />
          {/* Horizontal rule accent */}
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent" />
        </div>

        <Navbar />

        <main className="flex-grow px-6 md:px-8 py-6 z-10 flex flex-col">
          {children}
        </main>

        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: "rgba(8, 10, 14, 0.95)",
              color: "#e2e8f0",
              border: "1px solid rgba(16, 185, 129, 0.2)",
              borderRadius: "0.5rem",
              backdropFilter: "blur(16px)",
              fontSize: "0.875rem",
            },
            success: {
              iconTheme: { primary: "#10b981", secondary: "#000" },
            },
          }}
        />
      </body>
    </html>
  );
}
