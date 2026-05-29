"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ToastProvider } from "@/components/trip-doc/common/Toast";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isDocWizard = pathname.startsWith("/doc-wizard");

  return (
    <ToastProvider>
      {isDocWizard ? (
        <div className="flex min-h-screen flex-col">{children}</div>
      ) : (
        <div className="flex min-h-screen flex-col bg-slate-50">
          <header className="flex h-16 items-center border-b bg-white px-6 gap-0">
            <Link href="/search" className="flex items-center gap-2">
              <img src="/chae_um_logo.png" alt="채움 로고" className="w-8 h-8 rounded-md object-cover" />
              <h1 className="text-xl font-bold text-slate-800 cursor-pointer hover:text-blue-600 transition-colors">
                채움
              </h1>
            </Link>
          </header>
          <main className="flex-1 p-6">{children}</main>
        </div>
      )}
    </ToastProvider>
  );
}
