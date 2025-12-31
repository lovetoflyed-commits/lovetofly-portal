"use client";
import { usePathname } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import MainHeader from "@/components/MainHeader";
import { ReactNode } from "react";

export default function ClientLayoutShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const hideSidebar = pathname.startsWith("/login") || pathname.startsWith("/register");

  return (
    <>
      <MainHeader />
      {hideSidebar ? (
        <main className="min-h-screen">{children}</main>
      ) : (
        <div className="flex min-h-screen">
          <Sidebar />
          <main className="flex-1">{children}</main>
        </div>
      )}
    </>
  );
}
