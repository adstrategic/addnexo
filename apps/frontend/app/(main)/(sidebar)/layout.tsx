import { LayoutWrapper } from "@/components/layout-wrapper";

export default function SidebarLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <LayoutWrapper>{children}</LayoutWrapper>;
}
