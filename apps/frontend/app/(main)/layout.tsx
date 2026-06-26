import type React from "react";
import { MainLayoutGuard } from "@/components/MainLayoutGuard";

export default function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <MainLayoutGuard>{children}</MainLayoutGuard>;
}
