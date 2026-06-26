"use client";

import { useEffect, useState } from "react";
import { Check, ChevronsUpDown, Loader2 } from "lucide-react";

import { usePeriod } from "@/lib/context/period-context";
import { periodApi, type AvailablePeriod } from "@/lib/api/period";
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
import { cn } from "@/lib/utils";

export function PeriodDropdown() {
  const { mes, ano, label, setActivePeriod } = usePeriod();
  const [open, setOpen] = useState(false);
  const [periods, setPeriods] = useState<AvailablePeriod[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;

    let alive = true;
    setLoadingList(true);
    periodApi
      .listAvailable()
      .then((data) => {
        if (alive) setPeriods(data);
      })
      .catch(() => {
        if (alive) setPeriods([]);
      })
      .finally(() => {
        if (alive) setLoadingList(false);
      });

    return () => {
      alive = false;
    };
  }, [open]);

  const handleSelect = async (period: AvailablePeriod) => {
    if (period.mes === mes && period.ano === ano) {
      setOpen(false);
      return;
    }

    setSaving(true);
    try {
      await setActivePeriod(period.mes, period.ano);
      setOpen(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="min-w-[180px] justify-between"
          disabled={saving}
        >
          <span className="truncate">{label}</span>
          {saving ? (
            <Loader2 className="ml-2 h-4 w-4 shrink-0 animate-spin" />
          ) : (
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[240px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Search period..." />
          <CommandList>
            {loadingList ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            ) : (
              <>
                <CommandEmpty>No periods found.</CommandEmpty>
                <CommandGroup>
                  {periods.map((period) => (
                    <CommandItem
                      key={`${period.mes}-${period.ano}`}
                      value={period.label}
                      onSelect={() => void handleSelect(period)}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          period.mes === mes && period.ano === ano
                            ? "opacity-100"
                            : "opacity-0",
                        )}
                      />
                      <span className="flex-1">{period.label}</span>
                      {period.closed && (
                        <span className="text-xs text-muted-foreground">
                          Closed
                        </span>
                      )}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
