"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
// import { useRole } from "@/hooks/useRole";
import {
  Calculator,
  ChevronDown,
  ChevronRight,
  CreditCard,
  Settings,
  ShoppingBag,
  TrendingUp,
  Users,
  FileText,
  Grid,
  Package,
  Home,
  Wallet,
  ShoppingCart,
  Store,
  LucideHandCoins,
  ReceiptIcon,
  NotepadText,
  LucideWarehouse,
  Truck,
  Gauge,
  Forklift,
  NotebookPen,
  NotebookText,
  PackageOpen,
  Boxes,
  Earth,
  FileUser,
  BookUser,
  Building2,
  FileWarning,
  ChartNoAxesCombined,
  SwatchBook,
  TicketPercent,
  UserPlus,
  UserCog,
} from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import Image from "next/image";

// Tipos para la configuración del sidebar
interface SidebarItem {
  path: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface SidebarGroupConfig {
  key: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  items: SidebarItem[];
}

// Configuración centralizada del sidebar
const sidebarConfig: SidebarGroupConfig[] = [
  {
    key: "general",
    label: "General",
    icon: Home,
    color: "text-cyan-400",
    items: [
      { path: "/", label: "Shortcuts", icon: Grid },
      { path: "/quick-info", label: "Quick Info", icon: TrendingUp },
    ],
  },
  {
    key: "wallet",
    label: "Wallet",
    icon: Wallet,
    color: "text-cyan-400",
    items: [
      { path: "/invoice-alerts", label: "Invoice Alerts", icon: FileWarning },
      { path: "/sales", label: "Sales", icon: ShoppingBag },
      {
        path: "/accounts-receivable",
        label: "Accounts Receivable",
        icon: FileText,
      },
    ],
  },
  {
    key: "orders",
    label: "Orders",
    icon: ShoppingCart,
    color: "text-cyan-400",
    items: [
      {
        path: "/accounts-payable",
        label: "Accounts Payable",
        icon: CreditCard,
      },
    ],
  },
  {
    key: "store",
    label: "Store",
    icon: Store,
    color: "text-cyan-400",
    items: [
      { path: "/warehouses", label: "Warehouses", icon: LucideWarehouse },
      { path: "/inventory-groups", label: "Inventory Groups", icon: Boxes },
      { path: "/measurement-types", label: "Measurement types", icon: Gauge },
      { path: "/catalog", label: "Catalog", icon: NotepadText },
      { path: "/movement-types", label: "Movement types", icon: Truck },
      { path: "/movements", label: "Movements", icon: TrendingUp },
      { path: "/suppliers", label: "Suppliers", icon: FileUser },
      { path: "/kardex", label: "Kardex", icon: Forklift },
      { path: "/inventory", label: "Inventory", icon: Package },
    ],
  },
  {
    key: "documents",
    label: "Documents",
    icon: FileText,
    color: "text-cyan-400",
    items: [{ path: "/documents", label: "Documents", icon: FileText }],
  },
  {
    key: "billing",
    label: "Billing",
    icon: LucideHandCoins,
    color: "text-cyan-400",
    items: [
      {
        path: "/billing-consultation",
        label: "Billing Consultation",
        icon: Package,
      },
      { path: "/vendors", label: "Vendors", icon: Users },
      { path: "/clients", label: "Clients", icon: BookUser },
      { path: "/banks", label: "Banks", icon: Building2 },
      { path: "/geographic-zones", label: "Geographic Zones", icon: Earth },
      { path: "/credit-note", label: "Credit Note", icon: NotebookPen },
      { path: "/debit-note", label: "Debit Note", icon: NotebookText },
      { path: "/dispatch-orders", label: "Dispatch Orders", icon: PackageOpen },
      { path: "/invoices", label: "Invoices", icon: ReceiptIcon },
      {
        path: "/balance-invoices",
        label: "Balance Invoices",
        icon: ReceiptIcon,
      },
    ],
  },
  {
    key: "liquidations",
    label: "Liquidations",
    icon: Calculator,
    color: "text-cyan-400",
    items: [
      {
        path: "/liquidations-stats",
        label: "liquidation stats",
        icon: ChartNoAxesCombined,
      },
      { path: "/cost-types", label: "Costs Type", icon: SwatchBook },
      { path: "/cost-per-order", label: "Cost per Order", icon: TicketPercent },
      { path: "/liquidations-content", label: "Liquidation", icon: Calculator },
    ],
  },
  {
    key: "organization",
    label: "Organization",
    icon: Users,
    color: "text-cyan-400",
    items: [
      {
        path: "/organizations",
        label: "organizations",
        icon: UserCog,
      },
    ],
  },
];

// Hook personalizado para manejar el estado del sidebar
function useSidebarState() {
  const [openGroups, setOpenGroups] = useState<Set<string>>(new Set());
  const [isLoaded, setIsLoaded] = useState(false);

  const toggleGroup = useCallback((groupKey: string) => {
    setOpenGroups((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(groupKey)) {
        newSet.delete(groupKey);
      } else {
        newSet.add(groupKey);
      }
      return newSet;
    });
  }, []);

  const openGroup = useCallback((groupKey: string) => {
    setOpenGroups((prev) => new Set([...prev, groupKey]));
  }, []);

  const closeAllGroups = useCallback(() => {
    setOpenGroups(new Set());
  }, []);

  const isGroupOpen = useCallback(
    (groupKey: string) => openGroups.has(groupKey),
    [openGroups],
  );

  return {
    openGroups,
    isLoaded,
    setIsLoaded,
    toggleGroup,
    openGroup,
    closeAllGroups,
    isGroupOpen,
  };
}

// Componente para un item del sidebar
function SidebarItem({
  item,
  isActive,
}: {
  item: SidebarItem;
  isActive: boolean;
}) {
  return (
    <SidebarMenuItem>
      <Link href={item.path} className="w-full">
        <SidebarMenuButton
          className={`flex items-center gap-2 px-4 w-full hover:bg-white/10 transition-colors ${
            isActive ? "bg-white/20" : ""
          }`}
        >
          <item.icon className="h-4 w-4" />
          <span>{item.label}</span>
          <ChevronRight className="ml-auto h-4 w-4" />
        </SidebarMenuButton>
      </Link>
    </SidebarMenuItem>
  );
}

// Componente para un grupo del sidebar
function SidebarGroupSection({
  group,
  isOpen,
  onToggle,
  currentPath,
  // canAccessPath,
}: {
  group: SidebarGroupConfig;
  isOpen: boolean;
  onToggle: () => void;
  currentPath: string;
  // canAccessPath: (path: string) => boolean;
}) {
  // Filter items based on path access
  const accessibleItems = group.items.filter(
    (item) =>
      // canAccessPath(item.path)
      true,
  );

  // Don't render group if no items are accessible
  if (accessibleItems.length === 0) {
    return null;
  }

  return (
    <Collapsible open={isOpen} onOpenChange={onToggle}>
      <div>
        <CollapsibleTrigger asChild>
          <SidebarMenuButton className="flex items-center gap-2 px-4 w-full hover:bg-white/10 transition-colors">
            <group.icon className={`h-4 w-4 ${group.color}`} />
            <span className="font-medium">{group.label}</span>
            <ChevronDown
              className={`ml-auto h-4 w-4 transition-transform ${
                isOpen ? "rotate-180" : ""
              }`}
            />
          </SidebarMenuButton>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="ml-6 space-y-1">
            {accessibleItems.map((item) => (
              <SidebarItem
                key={item.path}
                item={item}
                isActive={currentPath === item.path}
              />
            ))}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

export function AppSidebar() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(true);
  const {
    isLoaded,
    setIsLoaded,
    toggleGroup,
    openGroup,
    closeAllGroups,
    isGroupOpen,
  } = useSidebarState();
  // const { canAccessGroup, canAccessPath, isLoading: isRoleLoading } = useRole();

  // // Filter sidebar config based on user roles
  // const filteredSidebarConfig = useMemo(() => {
  //   if (isRoleLoading) {
  //     return []; // Return empty array while loading to prevent flash of all items
  //   }

  //   return sidebarConfig
  //     .map((group) => {
  //       // Check if user has access to this group
  //       // if (!canAccessGroup(group.key)) {
  //       //   return null;
  //       // }

  //       // Filter items within the group based on path access
  //       const accessibleItems = group.items.filter((item) =>
  //         canAccessPath(item.path)
  //       );

  //       // Only return group if it has accessible items
  //       if (accessibleItems.length === 0) {
  //         return null;
  //       }

  //       return {
  //         ...group,
  //         items: accessibleItems,
  //       };
  //     })
  //     .filter((group): group is SidebarGroupConfig => group !== null);
  // }, [canAccessGroup, canAccessPath, isRoleLoading]);

  // // Función para determinar a qué grupo pertenece una ruta
  // const getGroupForRoute = useCallback(
  //   (route: string): string | null => {
  //     const group = filteredSidebarConfig.find((config) =>
  //       config.items.some((item) => item.path === route)
  //     );
  //     return group?.key || null;
  //   },
  //   [filteredSidebarConfig]
  // );

  // useEffect(() => {
  //   setIsLoaded(true);

  //   // Verificar si hay un grupo para expandir desde localStorage (desde shortcuts)
  //   const expandedGroup = localStorage.getItem("expandedSidebarGroup");

  //   if (expandedGroup) {
  //     // Cerrar todos los grupos primero
  //     closeAllGroups();

  //     // Abrir el grupo especificado
  //     openGroup(expandedGroup);

  //     // Limpiar el localStorage
  //     localStorage.removeItem("expandedSidebarGroup");
  //   } else {
  //     // Si no hay navegación por shortcut, verificar la ruta actual y mantener su grupo expandido
  //     const currentGroup = getGroupForRoute(pathname);
  //     if (currentGroup) {
  //       openGroup(currentGroup);
  //     }
  //   }
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, [pathname]); // Only depend on pathname - filteredSidebarConfig changes are handled by getGroupForRoute

  // Don't render while loading roles or sidebar state
  // if (!isLoaded || isRoleLoading) return null;

  return (
    <div className="relative">
      <Sidebar variant="sidebar">
        <SidebarHeader className="flex flex-col p-2">
          <div className="flex h-8 items-center justify-center text-white">
            <Image
              src="/addnexo-blanco.png"
              alt="ADDSTRATEGIC"
              width={160}
              height={32}
            />
          </div>
        </SidebarHeader>

        <SidebarContent className="p-0">
          <Collapsible
            open={menuOpen}
            onOpenChange={setMenuOpen}
            className="group/collapsible"
          >
            <SidebarGroup>
              <SidebarGroupLabel asChild className="px-4">
                <span>MENU</span>
              </SidebarGroupLabel>
              <CollapsibleContent>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {sidebarConfig.map((group) => (
                      <SidebarGroupSection
                        key={group.key}
                        group={group}
                        isOpen={isGroupOpen(group.key)}
                        onToggle={() => toggleGroup(group.key)}
                        currentPath={pathname}
                      />
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </CollapsibleContent>
            </SidebarGroup>
          </Collapsible>
        </SidebarContent>

        <SidebarFooter className="mt-auto p-4">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton className="flex items-center gap-2 transition-colors">
                <Settings className="h-4 w-4" />
                <span className="text-xs">Powered By ADSTRATEGIC LLC</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>

        <SidebarRail />
      </Sidebar>
    </div>
  );
}
