import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  Edit,
  Eye,
  FileText,
  MoreHorizontal,
  RefreshCw,
  RotateCcw,
  Send,
  Trash2,
  Truck,
  XCircle,
} from "lucide-react";
import type { DispatchOrderResponse } from "../schemas/dispatch-order-response.schema";
import { INVOICE_CONVERSION_ENABLED } from "../lib/utils";

interface DispatchOrderRowActionsProps {
  dispatchOrder: DispatchOrderResponse;
  onDelete?: (payload: { sequence: number; number: number }) => void;
  onDispatch: (sequence: number) => void;
  onReturn: (dispatchOrder: DispatchOrderResponse) => void;
  onConvertToInvoice: (dispatchOrder: DispatchOrderResponse) => void;
  onAnnul: (dispatchOrder: DispatchOrderResponse) => void;
  onRegeneratePdf: (sequence: number) => void;
  isRegeneratingPdf?: boolean;
}

export function DispatchOrderRowActions({
  dispatchOrder,
  onDelete,
  onDispatch,
  onReturn,
  onConvertToInvoice,
  onAnnul,
  onRegeneratePdf,
  isRegeneratingPdf = false,
}: DispatchOrderRowActionsProps) {
  const isDraft = dispatchOrder.DOGEstado === "DRAFT";
  const isEmitted = dispatchOrder.DOGEstado === "EMITTED";
  const isDispatched = dispatchOrder.DOGEstado === "DISPATCHED";
  const isAnulated = dispatchOrder.DOGEstado === "ANULATED";
  const needsPdfRefresh = Boolean(
    dispatchOrder.DOGEmittedPdfNeedsWarehouseRefresh,
  );
  const sequence = dispatchOrder.DOGOrgSecuencia;
  const label = `Actions for dispatch order #${dispatchOrder.DOGNro}`;

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
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuItem
          asChild
          className="cursor-pointer text-blue-800 focus:text-blue-800 dark:text-blue-400 dark:focus:text-blue-400"
        >
          <Link
            href={`/dispatch-orders/${sequence}`}
            className="flex items-center gap-2"
          >
            <Eye
              className="size-4 text-blue-800 dark:text-blue-400"
              aria-hidden
            />
            View details
          </Link>
        </DropdownMenuItem>

        {!isAnulated ? (
          <>
            {isDraft ? (
              <>
                <DropdownMenuItem
                  asChild
                  className="cursor-pointer text-amber-600 focus:text-amber-600 dark:text-amber-400 dark:focus:text-amber-400"
                >
                  <Link
                    href={`/dispatch-orders/${sequence}/edit`}
                    className="flex items-center gap-2"
                  >
                    <Edit
                      className="size-4 text-amber-600 dark:text-amber-400"
                      aria-hidden
                    />
                    Edit
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem
                  asChild
                  className="cursor-pointer text-violet-600 focus:text-violet-600 dark:text-violet-400 dark:focus:text-violet-400"
                >
                  <Link
                    href={`/dispatch-orders/${sequence}/emit`}
                    className="flex items-center gap-2"
                  >
                    <Send
                      className="size-4 text-violet-600 dark:text-violet-400"
                      aria-hidden
                    />
                    Emit
                  </Link>
                </DropdownMenuItem>
              </>
            ) : null}

            {isEmitted ? (
              <>
                <DropdownMenuItem
                  className="cursor-pointer text-blue-600 focus:text-blue-600 dark:text-blue-400 dark:focus:text-blue-400"
                  disabled={needsPdfRefresh}
                  title={
                    needsPdfRefresh
                      ? "Regenerate the dispatch PDF and notify the warehouse before dispatching."
                      : undefined
                  }
                  onClick={() => {
                    if (!needsPdfRefresh) onDispatch(sequence);
                  }}
                >
                  <Truck
                    className="size-4 text-blue-600 dark:text-blue-400"
                    aria-hidden
                  />
                  Dispatch
                </DropdownMenuItem>
                {needsPdfRefresh ? (
                  <DropdownMenuItem
                    className="cursor-pointer text-amber-700 focus:text-amber-700 dark:text-amber-400 dark:focus:text-amber-400"
                    disabled={isRegeneratingPdf}
                    onClick={() => onRegeneratePdf(sequence)}
                  >
                    <RefreshCw className="size-4" aria-hidden />
                    Regenerate PDF & notify warehouse
                  </DropdownMenuItem>
                ) : null}
              </>
            ) : null}

            {INVOICE_CONVERSION_ENABLED && isDispatched ? (
              <DropdownMenuItem
                className="cursor-pointer"
                onClick={() => onConvertToInvoice(dispatchOrder)}
              >
                <FileText className="size-4" aria-hidden />
                Convert to Invoice
              </DropdownMenuItem>
            ) : null}

            {isDispatched || isEmitted ? (
              <DropdownMenuItem
                className="cursor-pointer text-orange-600 focus:text-orange-600 dark:text-orange-400 dark:focus:text-orange-400"
                onClick={() => onReturn(dispatchOrder)}
              >
                <RotateCcw className="size-4" aria-hidden />
                Return Inventory
              </DropdownMenuItem>
            ) : null}

            {isEmitted || isDispatched ? (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  variant="destructive"
                  className="cursor-pointer"
                  onClick={() => onAnnul(dispatchOrder)}
                >
                  <XCircle className="size-4" aria-hidden />
                  Annul
                </DropdownMenuItem>
              </>
            ) : null}

            {isDraft && onDelete ? (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  variant="destructive"
                  className="cursor-pointer"
                  onClick={() =>
                    onDelete({
                      sequence,
                      number: dispatchOrder.DOGNro,
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
