import "./globals.css";
import { Inter } from "next/font/google";
import Navbar from "../components/Navbar";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Solo - Premium Finance Tracker",
  description: "Financial management app for freelancers and agencies",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`h-full antialiased ${inter.className}`}>
      <body className="min-h-full flex flex-col relative overflow-x-hidden">
        <div className="fixed inset-0 z-[-1] bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-emerald-900/20 via-[#030303] to-[#030303]"></div>
        
        <Navbar />
        
        <main className="flex-grow p-8 z-10 flex flex-col">
          {children}
        </main>
      </body>
    </html>
  );
}
