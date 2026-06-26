"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
} from "@/components/ui/command";
import { Check, ChevronsUpDown, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useClienteSelector } from "@/components/shared/selectors/hooks/useClienteSelector";
import type { ClienteResponse } from "@/features/clients";

import { invoiceApi, invoiceKeys } from "../services/invoices.api";
import { toast } from "sonner";

interface RemindStatementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RemindStatementDialog({
  open,
  onOpenChange,
}: RemindStatementDialogProps) {
  const [email, setEmail] = useState("");
  const [isSending, setIsSending] = useState(false);

  const { data: outstandingClienteIds = [], isFetching: isOutstandingLoading } =
    useQuery({
      queryKey: invoiceKeys.statementOutstandingClients(),
      queryFn: () => invoiceApi.obtenerClienteIdsConSaldoPendiente(),
      enabled: open,
    });

  const {
    openClientes,
    clientes,
    loadingClientes,
    hasUserInteracted,
    isFetched,
    selectedCliente,
    handleClienteSearch,
    handleClienteSelect,
    toggleClientePopover,
    clienteQuery,
  } = useClienteSelector(null);

  const filteredClientes = clientes.filter((c) =>
    (outstandingClienteIds ?? []).includes(c.CId),
  );

  useEffect(() => {
    if (!open) {
      setEmail("");
    }
  }, [open]);

  useEffect(() => {
    if (selectedCliente) {
      setEmail(selectedCliente.CCorreo1 ?? "");
    } else {
      setEmail("");
    }
  }, [selectedCliente]);

  const handleSubmit = async () => {
    if (!selectedCliente) {
      toast.error("Please select a customer.");
      return;
    }
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      toast.error("Please enter an email address.");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      toast.error("Please enter a valid email address.");
      return;
    }

    setIsSending(true);
    try {
      await invoiceApi.enviarStatement(selectedCliente.CId, trimmedEmail);
      toast.success("Statement sent", {
        description: "The statement has been sent successfully.",
      });
      setEmail("");
      onOpenChange(false);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to send statement.";
      toast.error("Failed to send statement.", {
        description: message,
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Remind statement</DialogTitle>
          <DialogDescription>
            Select a customer with at least one invoice with an outstanding
            balance and enter the email address to send the account statement.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label>Customer</Label>
            <Popover open={openClientes} onOpenChange={toggleClientePopover}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={openClientes}
                  className={cn(
                    "w-full justify-between text-left font-normal",
                    !selectedCliente && "text-muted-foreground",
                  )}
                  type="button"
                >
                  {selectedCliente
                    ? selectedCliente.CRazonSocial
                    : "Select customer..."}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0" align="start">
                <Command shouldFilter={false}>
                  <CommandInput
                    placeholder="Search customer..."
                    value={clienteQuery}
                    onValueChange={handleClienteSearch}
                  />
                  {(loadingClientes ||
                    isOutstandingLoading ||
                    (isFetched && filteredClientes.length === 0)) && (
                    <CommandEmpty>
                      {loadingClientes || isOutstandingLoading ? (
                        <div className="flex items-center justify-center py-4">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span className="ml-2">Loading...</span>
                        </div>
                      ) : clientes.length === 0 ? (
                        "No customers found."
                      ) : (
                        "No customers with invoices with an outstanding balance."
                      )}
                    </CommandEmpty>
                  )}
                  <CommandGroup className="max-h-64 overflow-auto">
                    {!hasUserInteracted && (
                      <CommandItem disabled>
                        Type to search for a customer...
                      </CommandItem>
                    )}
                    {!loadingClientes &&
                      !isOutstandingLoading &&
                      filteredClientes.map((cliente: ClienteResponse) => (
                        <CommandItem
                          key={cliente.CId}
                          value={cliente.CId.toString()}
                          onSelect={() => handleClienteSelect(cliente)}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              selectedCliente?.CId === cliente.CId
                                ? "opacity-100"
                                : "opacity-0",
                            )}
                          />
                          {cliente.CRazonSocial}
                        </CommandItem>
                      ))}
                  </CommandGroup>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="statement-email">Email</Label>
            <Input
              id="statement-email"
              type="email"
              placeholder="email@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isSending}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSending}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={!selectedCliente || !email.trim() || isSending}
          >
            {isSending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              "Send statement"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
