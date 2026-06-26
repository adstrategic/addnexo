import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Edit, Eye, MoreHorizontal, Trash2 } from "lucide-react";
import type { Factura } from "../schemas/BalanceInvoicesResponseSchema";

interface BalanceInvoiceRowActionsProps {
  factura: Factura;
  isEditable: boolean;
  onDelete?: (payload: { sequence: number; number: number }) => void;
}

export function BalanceInvoiceRowActions({
  factura,
  isEditable,
  onDelete,
}: BalanceInvoiceRowActionsProps) {
  const sequence = factura.FGOrgSecuencia;
  const label = `Actions for balance invoice #${factura.FGNro}`;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="size-8 cursor-pointer"
          aria-label={label}
        >
          <MoreHorizontal className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuItem
          asChild
          className="cursor-pointer text-blue-800 focus:text-blue-800 dark:text-blue-400 dark:focus:text-blue-400"
        >
          <Link
            href={`/balance-invoices/${sequence}`}
            className="flex items-center gap-2"
          >
            <Eye
              className="size-4 text-blue-800 dark:text-blue-400"
              aria-hidden
            />
            View details
          </Link>
        </DropdownMenuItem>

        {isEditable ? (
          <>
            <DropdownMenuItem
              asChild
              className="cursor-pointer text-amber-600 focus:text-amber-600 dark:text-amber-400 dark:focus:text-amber-400"
            >
              <Link
                href={`/balance-invoices/${sequence}/edit`}
                className="flex items-center gap-2"
              >
                <Edit
                  className="size-4 text-amber-600 dark:text-amber-400"
                  aria-hidden
                />
                Edit
              </Link>
            </DropdownMenuItem>
            {onDelete ? (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  variant="destructive"
                  className="cursor-pointer"
                  onClick={() =>
                    onDelete({
                      sequence,
                      number: factura.FGNro,
                    })
                  }
                >
                  <Trash2 className="size-4" aria-hidden />
                  Delete
                </DropdownMenuItem>
              </>
            ) : null}
          </>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
