import { useState, useCallback, useMemo } from "react";
import { useProducts } from "@/features/catalog";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import type { Producto } from "@/features/catalog";

interface UseProductSelectorOptions {
  grupoNro?: number;
  /** Filter products by origin country (server-side). */
  paisId?: number;
}

export const useProductSelector = (
  initialProducto: Producto | null,
  options?: UseProductSelectorOptions,
) => {
  const { grupoNro, paisId } = options || {};
  const [productoQuery, setProductoQuery] = useState(
    initialProducto?.CKDescripcion || "",
  );
  const [openProductos, setOpenProductos] = useState(false);
  const [hasUserInteracted, setHasUserInteracted] = useState(false);
  const [selectedProducto, setSelectedProducto] = useState<Producto | null>(
    initialProducto || null,
  );

  const debouncedQuery = useDebouncedValue(productoQuery, 300);

  const shouldFetch = hasUserInteracted && debouncedQuery === productoQuery;

  const initialData =
    initialProducto && !hasUserInteracted
      ? {
          data: [initialProducto],
          pagination: {
            page: 1,
            limit: 10,
            totalItems: 1,
            totalPages: 1,
          },
        }
      : undefined;

  const {
    data: productosData,
    isFetching: loadingProductos,
    isFetched,
  } = useProducts({
    search: shouldFetch ? debouncedQuery : undefined,
    ...(grupoNro !== undefined
      ? { grupoNro }
      : { excludeGrupoNro: 999 }),
    ...(paisId !== undefined && paisId > 0 ? { paisId } : {}),
    initialData,
  });

  const productos = useMemo(
    () => productosData?.data || [],
    [productosData],
  );

  const handleProductoSearch = useCallback((query: string) => {
    setProductoQuery(query);
    setHasUserInteracted((prev) => {
      if (!prev) return true;
      return prev;
    });
  }, []);

  const toggleProductoPopover = useCallback(
    (open: boolean) => {
      setOpenProductos(open);
      if (!open) {
        setProductoQuery(selectedProducto?.CKDescripcion || "");
      }
    },
    [selectedProducto],
  );

  const handleProductoSelect = useCallback((producto: Producto | null) => {
    setSelectedProducto(producto);
    setOpenProductos(false);
    setProductoQuery(producto?.CKDescripcion || "");
  }, []);

  const clearSelectedProducto = useCallback(() => {
    setSelectedProducto(null);
    setProductoQuery("");
  }, []);

  return {
    productoQuery,
    openProductos,
    productos,
    loadingProductos,
    isFetched,
    hasUserInteracted,
    selectedProducto,
    handleProductoSearch,
    handleProductoSelect,
    clearSelectedProducto,
    toggleProductoPopover,
  };
};
