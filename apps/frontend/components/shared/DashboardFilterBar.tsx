"use client";

import { useState } from "react";
import { Check, ChevronsUpDown, Loader2, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { PeriodDropdown } from "@/components/shared/PeriodDropdown";
import { useProductSelector } from "@/components/shared/selectors/hooks/useProductSelector";
import { usePaisSelector } from "@/components/shared/selectors/hooks/usePaisSelector";
import { useGroupSelector } from "@/features/catalog/selectors/hooks/useGroupSelector";
import type { KardexDataFilters } from "@/features/inventory/schemas/InventorySchemas";
import { cn } from "@/lib/utils";

interface DashboardFilterBarProps {
  filters: KardexDataFilters;
  onFiltersChange: (filters: KardexDataFilters) => void;
  onReset: () => void;
}

const triggerCls = (active: boolean) =>
  cn(
    "h-9 min-w-[150px] max-w-[220px] justify-between text-sm font-normal",
    active && "border-primary bg-primary/10 text-primary",
  );

function FilterSlot({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="ml-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      {children}
    </div>
  );
}

function SelectorLoading() {
  return (
    <div className="flex items-center justify-center gap-2 py-3 text-sm text-muted-foreground">
      <Loader2 size={14} className="animate-spin" /> Loading...
    </div>
  );
}

function ProductFilter({
  value,
  selectedId,
  onChange,
}: {
  value: string;
  selectedId: number | null;
  onChange: (name: string, id: number | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const {
    productoQuery,
    productos,
    loadingProductos,
    hasUserInteracted,
    isFetched,
    handleProductoSearch,
  } = useProductSelector(null);

  return (
    <FilterSlot label="Product">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            type="button"
            role="combobox"
            aria-expanded={open}
            className={triggerCls(value !== "All")}
          >
            <span className="truncate">
              {value !== "All" ? value : "All Products"}
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[300px] p-0" align="start">
          <Command shouldFilter={false}>
            <CommandInput
              placeholder="Search product..."
              value={productoQuery}
              onValueChange={handleProductoSearch}
            />
            <CommandList>
              {(loadingProductos || isFetched) && (
                <CommandEmpty>
                  {loadingProductos ? <SelectorLoading /> : "No products found."}
                </CommandEmpty>
              )}
              <CommandGroup>
                <CommandItem
                  value="All"
                  onSelect={() => {
                    onChange("All", null);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      selectedId === null && value === "All"
                        ? "opacity-100 text-primary"
                        : "opacity-0",
                    )}
                  />
                  All Products
                </CommandItem>
                {!hasUserInteracted && (
                  <CommandItem disabled className="text-xs text-muted-foreground">
                    Type to search...
                  </CommandItem>
                )}
                {!loadingProductos &&
                  productos.map((p) => (
                    <CommandItem
                      key={p.CKId}
                      value={`${p.CKId}-${p.CKDescripcion}`}
                      onSelect={() => {
                        onChange(p.CKDescripcion, p.CKId);
                        setOpen(false);
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          selectedId === p.CKId
                            ? "opacity-100 text-primary"
                            : "opacity-0",
                        )}
                      />
                      <span className="flex-1 truncate">{p.CKDescripcion}</span>
                      {p.origenPais?.nombre && (
                        <span className="ml-2 shrink-0 text-[11px] text-muted-foreground">
                          {p.origenPais.nombre}
                        </span>
                      )}
                    </CommandItem>
                  ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </FilterSlot>
  );
}

function GroupFilter({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const {
    groupQuery,
    groups,
    loadingGroups,
    hasUserInteracted,
    isFetched,
    handleGroupSearch,
  } = useGroupSelector(null);

  return (
    <FilterSlot label="Group">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            type="button"
            role="combobox"
            aria-expanded={open}
            className={triggerCls(value !== "All")}
          >
            <span className="truncate">
              {value !== "All" ? value : "All Groups"}
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[220px] p-0" align="start">
          <Command shouldFilter={false}>
            <CommandInput
              placeholder="Search group..."
              value={groupQuery}
              onValueChange={handleGroupSearch}
            />
            <CommandList>
              {(loadingGroups || isFetched) && (
                <CommandEmpty>
                  {loadingGroups ? <SelectorLoading /> : "No groups found."}
                </CommandEmpty>
              )}
              <CommandGroup>
                <CommandItem
                  value="All"
                  onSelect={() => {
                    onChange("All");
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === "All" ? "opacity-100 text-primary" : "opacity-0",
                    )}
                  />
                  All Groups
                </CommandItem>
                {!hasUserInteracted && (
                  <CommandItem disabled className="text-xs text-muted-foreground">
                    Type to search...
                  </CommandItem>
                )}
                {!loadingGroups &&
                  groups.map((g) => (
                    <CommandItem
                      key={g.GId}
                      value={g.GDescripcion}
                      onSelect={() => {
                        onChange(g.GDescripcion);
                        setOpen(false);
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          value === g.GDescripcion
                            ? "opacity-100 text-primary"
                            : "opacity-0",
                        )}
                      />
                      {g.GNro} - {g.GDescripcion}
                    </CommandItem>
                  ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </FilterSlot>
  );
}

function OriginFilter({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const {
    paisQuery,
    paises,
    loadingPaises,
    isFetched,
    handlePaisSearch,
    togglePaisPopover,
  } = usePaisSelector(null);

  return (
    <FilterSlot label="Origin">
      <Popover
        open={open}
        onOpenChange={(o) => {
          setOpen(o);
          togglePaisPopover(o);
        }}
      >
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            type="button"
            role="combobox"
            aria-expanded={open}
            className={triggerCls(value !== "All")}
          >
            <span className="truncate">
              {value !== "All" ? value : "All Origins"}
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[200px] p-0" align="start">
          <Command shouldFilter={false}>
            <CommandInput
              placeholder="Search origin..."
              value={paisQuery}
              onValueChange={handlePaisSearch}
            />
            <CommandList>
              {(loadingPaises || isFetched) && (
                <CommandEmpty>
                  {loadingPaises ? <SelectorLoading /> : "No origins found."}
                </CommandEmpty>
              )}
              <CommandGroup>
                <CommandItem
                  value="All"
                  onSelect={() => {
                    onChange("All");
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === "All" ? "opacity-100 text-primary" : "opacity-0",
                    )}
                  />
                  All Origins
                </CommandItem>
                {paises.map((p) => (
                  <CommandItem
                    key={p.id}
                    value={p.nombre}
                    onSelect={() => {
                      onChange(p.nombre);
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === p.nombre
                          ? "opacity-100 text-primary"
                          : "opacity-0",
                      )}
                    />
                    {p.nombre}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </FilterSlot>
  );
}

/**
 * Filter bar shared by the inventory and kardex dashboards: active period,
 * product / group / origin filters and a reset action.
 */
export function DashboardFilterBar({
  filters,
  onFiltersChange,
  onReset,
}: DashboardFilterBarProps) {
  const activeCount = [
    filters.product !== "All",
    filters.group !== "All",
    filters.country !== "All",
  ].filter(Boolean).length;

  return (
    <div className="sticky top-0 z-10 -mt-2 bg-background/80 pb-4 pt-2 backdrop-blur-sm">
      <div className="flex flex-col gap-3 rounded-xl border bg-card p-3 shadow-sm transition-all duration-300 hover:border-primary hover:shadow-md xl:flex-row xl:items-end xl:justify-between">
        <div className="flex flex-1 flex-wrap gap-3">
          <FilterSlot label="Period">
            <PeriodDropdown />
          </FilterSlot>
          <ProductFilter
            value={filters.product}
            selectedId={filters.invcaruniId}
            onChange={(name, id) =>
              onFiltersChange({ ...filters, product: name, invcaruniId: id })
            }
          />
          <GroupFilter
            value={filters.group}
            onChange={(v) => onFiltersChange({ ...filters, group: v })}
          />
          <OriginFilter
            value={filters.country}
            onChange={(v) => onFiltersChange({ ...filters, country: v })}
          />
        </div>
        <div className="mt-2 flex items-center gap-2 xl:mt-0 xl:border-l xl:pl-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={onReset}
            disabled={activeCount === 0}
            className="h-9 font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive disabled:opacity-40"
          >
            <RotateCcw size={16} className="mr-1" />
            Reset
            {activeCount > 0 && (
              <span className="ml-1 rounded-full bg-primary/15 px-1.5 py-0.5 text-[10px] text-primary">
                {activeCount}
              </span>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
