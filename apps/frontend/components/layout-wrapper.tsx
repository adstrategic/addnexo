"use client";

import type React from "react";

import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { PeriodDropdown } from "@/components/shared/PeriodDropdown";
import { useSidebar } from "@/components/ui/sidebar";

interface LayoutWrapperProps {
  children: React.ReactNode;
}

function LayoutContent({ children }: LayoutWrapperProps) {
  const { open } = useSidebar();

  return (
    <div className="flex h-screen w-full relative">
      {/* Estela verde que aparece/desaparece con el sidebar */}
      <div
        className={`fixed -bottom-11 -left-11 z-50 pointer-events-none transition-all duration-300 ease-in-out ${
          open ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-full"
        }`}
      >
        <div className="w-52 h-52 bg-gradient-to-tr from-[#1ECAD3]/40 via-[#1ECAD3]/20 to-transparent rounded-full blur-2xl"></div>
      </div>

      <AppSidebar />
      <div className="flex flex-1 flex-col overflow-hidden relative z-10 bg-gradient-to-b from-[#F8FAFC] via-[#F8FAFC] to-[#B8F0F3]">
        <header className="flex h-14 shrink-0 items-center justify-between gap-2 border-b border-white/40 bg-white/50 px-4 backdrop-blur-sm">
          <SidebarTrigger />
          <PeriodDropdown />
        </header>
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}

export function LayoutWrapper({ children }: LayoutWrapperProps) {
  return (
    <div className="relative min-h-screen">
      <SidebarProvider>
        <LayoutContent>{children}</LayoutContent>
      </SidebarProvider>
    </div>
  );
}
