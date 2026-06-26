import { useState, useEffect, useMemo } from "react";
import { useDispatchOrder } from "../../hooks/useDispatchOrders";

interface UseDispatchOrderRealTimeProps {
  mode: "create" | "edit" | "emit";
  sequence?: number;
}

export function useDispatchOrderRealTime({
  mode,
  sequence,
}: UseDispatchOrderRealTimeProps) {
  const [isHeaderCreated, setIsHeaderCreated] = useState(
    mode === "edit" || mode === "emit",
  );
  const [currentOrderId, setCurrentOrderId] = useState<number | null>(
    mode === "edit" || mode === "emit" ? (sequence ?? null) : null,
  );

  const dispatchOrderQueryEdit = useDispatchOrder(
    mode === "edit" || mode === "emit" ? (sequence ?? 0) : 0,
    mode === "edit" || mode === "emit",
  );

  const dispatchOrderQueryCreate = useDispatchOrder(
    currentOrderId || 0,
    mode === "create" ? !!currentOrderId : false,
  );

  const dispatchOrder = useMemo(() => {
    if (mode === "edit" || mode === "emit") {
      return dispatchOrderQueryEdit.data;
    }
    return dispatchOrderQueryCreate.data;
  }, [mode, dispatchOrderQueryEdit.data, dispatchOrderQueryCreate.data]);

  const isLoading = useMemo(() => {
    if (mode === "edit" || mode === "emit") {
      return dispatchOrderQueryEdit.isLoading;
    }
    return dispatchOrderQueryCreate.isLoading;
  }, [
    mode,
    dispatchOrderQueryEdit.isLoading,
    dispatchOrderQueryCreate.isLoading,
  ]);

  const isError = useMemo(() => {
    if (mode === "edit" || mode === "emit") {
      return dispatchOrderQueryEdit.isError;
    }
    return dispatchOrderQueryCreate.isError;
  }, [mode, dispatchOrderQueryEdit.isError, dispatchOrderQueryCreate.isError]);

  const error = useMemo(() => {
    if (mode === "edit" || mode === "emit") {
      return dispatchOrderQueryEdit.error;
    }
    return dispatchOrderQueryCreate.error;
  }, [mode, dispatchOrderQueryEdit.error, dispatchOrderQueryCreate.error]);

  useEffect(() => {
    if ((mode === "edit" || mode === "emit") && dispatchOrder) {
      setCurrentOrderId(dispatchOrder.DOGOrgSecuencia);
      setIsHeaderCreated(true);
    }
  }, [mode, dispatchOrder]);

  return {
    dispatchOrder,
    isLoading,
    isError,
    error,
    isHeaderCreated,
    currentOrderId,
  };
}
