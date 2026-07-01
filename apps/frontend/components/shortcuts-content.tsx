"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search,
  Home,
  Wallet,
  ShoppingCart,
  Store,
  LucideHandCoins,
  Calculator,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SettingsModal } from "@/components/settings-modal";
import { useRole } from "@/hooks/useRole";

import { SearchPages } from "./search-pages";
import Image from "next/image";

// const searchOptions = [
//   { title: "Quick Info", href: "/", category: "Pages" },
//   { title: "Receivables", href: "/cartera", category: "Pages" },
//   {
//     title: "Accounts Receivable",
//     href: "/accounts-receivable",
//     category: "Pages",
//   },
//   { title: "Billing", href: "/create-invoice", category: "Pages" },
//   { title: "Accounts Payable", href: "/accounts-payable", category: "Pages" },
//   { title: "Users / Admins", href: "/user-administration", category: "Pages" },
//   { title: "Inventory", href: "/inventory", category: "Pages" },
//   { title: "Liquidations", href: "/liquidations", category: "Pages" },
//   {
//     title: "Account and settings",
//     href: "/account-settings",
//     category: "Settings",
//   },
//   { title: "New invoice", href: "/create-invoice", category: "Actions" },
//   { title: "New client", href: "#", category: "Actions" },
//   { title: "New supplier", href: "#", category: "Actions" },
//   { title: "New product", href: "#", category: "Actions" },
// ];

export function ShortcutsContent() {
  const router = useRouter();
  const { canAccessPath, isLoading: isRoleLoading } = useRole();

  // const filteredOptions = searchOptions.filter((option) =>
  //   option.title.toLowerCase().includes(searchValue.toLowerCase())
  // );

  // const groupedOptions = filteredOptions.reduce((acc, option) => {
  //   if (!acc[option.category]) acc[option.category] = [];
  //   acc[option.category].push(option);
  //   return acc;
  // }, {} as Record<string, typeof searchOptions>);

  const handleShortcutClick = (href: string, group: string) => {
    // Store the group to expand in localStorage
    router.push(href);
  };

  const access = [
    // {
    //   title: "General",
    //   icon: Home,
    //   href: "/quick-info",
    //   color: "bg-[#1ECAD3]",
    //   description: "Quick access to general information",
    //   group: "general",
    // },
    // {
    //   title: "Wallet",
    //   icon: Wallet,
    //   href: "/invoice-alerts",
    //   color: "bg-[#1ECAD3]",
    //   description: "Manage suppliers, clients and finances",
    //   group: "wallet",
    // },
    {
      title: "Orders",
      icon: ShoppingCart,
      href: "/accounts-payable",
      color: "bg-[#1ECAD3]",
      description: "Handle accounts payable and orders",
      group: "orders",
    },
    {
      title: "Store",
      icon: Store,
      href: "/inventory",
      color: "bg-[#1ECAD3]",
      description: "Inventory and catalog management",
      group: "store",
    },
    {
      title: "Billing",
      icon: LucideHandCoins,
      href: "/dispatch-orders",
      color: "bg-[#1ECAD3]",
      description: "Billing consultation and notes",
      group: "billing",
    },
    {
      title: "Liquidations",
      icon: Calculator,
      href: "/liquidations",
      color: "bg-[#1ECAD3]",
      description: "Process and manage liquidations",
      group: "liquidations",
    },
  ];

  // Single source of truth: the same role policy that drives the sidebar and
  // route guard (lib/access-policy.ts). To grant a role a new module, edit only
  // that policy — this page, the sidebar and the guard all update automatically.
  const visibleAccess = access.filter((item) => canAccessPath(item.href));

  return (
    <div className="min-h-screen bg-linear-to-b from-[#F8FAFC] via-[#E6FAFB] to-[#B8F0F3]">
      {/* Header con funcionalidades */}
      <header className="flex h-16 items-center justify-between border-b px-4 bg-white shadow-sm">
        <div className="flex items-center gap-4">
          <div className="flex items-center justify-center">
            <Image
              src="/addnexo-negro.png"
              alt="Logo"
              className="h-14 w-auto"
              width={420}
              height={180}
            />
          </div>
        </div>
      </header>

      {/* Contenido principal */}
      <div className="p-8 max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-800 mb-4">
            Quick Access
          </h1>
          <p className="text-xl text-gray-600">
            Select the section you want to access
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {(isRoleLoading ? [] : visibleAccess).map((item, index) => (
            <div key={index} className="block">
              <div onClick={() => handleShortcutClick(item.href, item.group)}>
                <Card className="h-full hover:shadow-xl transition-all duration-300 border-2 hover:border-[#1ECAD3] overflow-hidden group cursor-pointer transform hover:scale-105">
                  <CardContent className="p-0">
                    <div className="flex flex-col h-full min-h-[200px]">
                      <div
                        className={`${item.color} h-3 w-full group-hover:h-4 transition-all`}
                      ></div>
                      <div className="p-8 flex flex-col items-center justify-center text-center h-full gap-6">
                        <div
                          className={`${item.color} text-white p-6 rounded-full group-hover:scale-110 transition-transform shadow-lg`}
                        >
                          <item.icon className="h-12 w-12" />
                        </div>
                        <div>
                          <h3 className="text-2xl font-bold mb-3 group-hover:text-[#1ECAD3] transition-colors">
                            {item.title}
                          </h3>
                          <p className="text-gray-500 text-base group-hover:text-gray-700 transition-colors">
                            {item.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
