import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { useState } from "react";
import Link from "next/link";

const searchOptions = [
  // Main Pages
  { title: "Quick Info", href: "/quick-info", category: "Pages" },
  {
    title: "Accounts Receivable",
    href: "/accounts-receivable",
    category: "Pages",
  },
  { title: "Billing", href: "/create-invoice", category: "Pages" },
  { title: "Accounts Payable", href: "/accounts-payable", category: "Pages" },
  { title: "Users / Admins", href: "/user-administration", category: "Pages" },
  { title: "Inventory", href: "/inventory", category: "Pages" },
  { title: "Liquidations", href: "/liquidations", category: "Pages" },

  // Invoice Management
  { title: "Invoice Management", href: "/invoice", category: "Pages" },
  { title: "Invoice Issued", href: "/invoice-issued", category: "Pages" },
  { title: "Invoice Unissued", href: "/invoice-unissued", category: "Pages" },
  { title: "Invoice Alerts", href: "/invoice-alerts", category: "Pages" },
  {
    title: "Billing Consultation",
    href: "/billing-consultation",
    category: "Pages",
  },

  // Dispatch Management
  { title: "Dispatch Orders", href: "/dispatch-orders", category: "Pages" },

  // Documents
  { title: "Documents", href: "/documents", category: "Pages" },

  // Liquidations
  {
    title: "Liquidations Issued",
    href: "/liquidations-issued",
    category: "Pages",
  },
  {
    title: "Liquidations Unissued",
    href: "/liquidations-unissued",
    category: "Pages",
  },
  {
    title: "Liquidations Stats",
    href: "/liquidations-stats",
    category: "Pages",
  },
  {
    title: "Liquidations Content",
    href: "/liquidations-content",
    category: "Pages",
  },

  // Notes
  { title: "Credit Notes", href: "/credit-notes", category: "Pages" },
  { title: "Debit Notes", href: "/debit-notes", category: "Pages" },

  // Sales
  { title: "Sales", href: "/sales", category: "Pages" },

  // Inventory Management
  { title: "Kardex", href: "/kardex", category: "Pages" },
  { title: "Catalog", href: "/catalog", category: "Pages" },
  { title: "Inventory Groups", href: "/inventory-groups", category: "Pages" },
  { title: "Movement Types", href: "/movement-types", category: "Pages" },
  { title: "Warehouses", href: "/warehouses", category: "Pages" },
  { title: "Measurement Types", href: "/measurement-types", category: "Pages" },

  // Clients & Suppliers
  { title: "Clients", href: "/clients", category: "Pages" },
  { title: "Suppliers", href: "/suppliers", category: "Pages" },
  { title: "Vendors", href: "/vendors", category: "Pages" },

  // Cost Management
  { title: "Cost Types", href: "/cost-types", category: "Pages" },
  { title: "Cost Per Order", href: "/cost-per-order", category: "Pages" },

  // Reports & Geography
  { title: "Reports", href: "/reports", category: "Pages" },
  { title: "Geography", href: "/geography", category: "Pages" },

  // Onboarding
  { title: "Onboarding", href: "/onboarding", category: "Pages" },

  // Settings
  {
    title: "Account and Settings",
    href: "/account-settings",
    category: "Settings",
  },
];

export function SearchPages() {
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");

  const filteredOptions = searchOptions.filter((option) =>
    option.title.toLowerCase().includes(searchValue.toLowerCase()),
  );

  const groupedOptions = filteredOptions.reduce(
    (acc, option) => {
      const key = option.category;
      const group = acc[key] ?? [];
      group.push(option);
      acc[key] = group;
      return acc;
    },
    {} as Record<string, (typeof searchOptions)[number][]>,
  );

  return (
    <Popover open={searchOpen} onOpenChange={setSearchOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon">
          <Search className="h-5 w-5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <Command>
          <CommandInput
            placeholder="Search pages, actions, reports..."
            value={searchValue}
            onValueChange={setSearchValue}
          />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            {Object.entries(groupedOptions).map(([category, options]) => (
              <CommandGroup key={category} heading={category}>
                {options.map((option) => (
                  <CommandItem key={option.href} asChild>
                    <Link
                      href={option.href}
                      className="w-full"
                      onClick={() => setSearchOpen(false)}
                    >
                      {option.title}
                    </Link>
                  </CommandItem>
                ))}
              </CommandGroup>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
