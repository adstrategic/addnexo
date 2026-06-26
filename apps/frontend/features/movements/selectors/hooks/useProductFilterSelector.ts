"use client";

import { useState, useCallback, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { productsService } from "@/features/catalog/service/CatalogService";
import { productKeys } from "@/features/catalog/hooks/useCatalog";
import type { Producto } from "@/features/catalog";

function useProductById(id: number | undefined, enabled: boolean) {
  return useQuery({
    queryKey: [...productKeys.all, "filterById", id] as const,
    queryFn: async () => {
      const response = await productsService.list({ limit: 100, page: 1 });
      return response.data.find((product) => product.CKId === id) ?? null;
    },
    enabled: enabled && id != null,
    staleTime: 5 * 60 * 1000,
  });
}

export function useProductFilterSelector(value?: number) {
  const [productQuery, setProductQuery] = useState("");
  const [openProducts, setOpenProducts] = useState(false);
  const [hasUserInteracted, setHasUserInteracted] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Producto | null>(null);

  const debouncedQuery = useDebouncedValue(productQuery, 300);

  const shouldFetch =
    openProducts && (!hasUserInteracted || debouncedQuery === productQuery);

  const {
    data: productsData,
    isFetching: loadingProducts,
    isFetched,
  } = useQuery({
    queryKey: productKeys.list({
      search: shouldFetch ? debouncedQuery || undefined : undefined,
      limit: 50,
      excludeGrupoNro: 999,
    }),
    queryFn: () =>
      productsService.list({
        search: debouncedQuery || undefined,
        limit: 50,
        page: 1,
        excludeGrupoNro: 999,
      }),
    enabled: shouldFetch,
    staleTime: 30 * 1000,
  });

  const { data: resolvedProduct } = useProductById(
    value,
    value != null && selectedProduct?.CKId !== value,
  );

  useEffect(() => {
    if (value == null) {
      setSelectedProduct(null);
      return;
    }

    if (resolvedProduct) {
      setSelectedProduct(resolvedProduct);
    }
  }, [value, resolvedProduct]);

  const handleProductSearch = useCallback((query: string) => {
    setProductQuery(query);
    setHasUserInteracted(true);
  }, []);

  const toggleProductPopover = useCallback(
    (open: boolean) => {
      setOpenProducts(open);
      if (!open) {
        setProductQuery(selectedProduct?.CKDescripcion ?? "");
        setHasUserInteracted(false);
      }
    },
    [selectedProduct],
  );

  const handleProductSelect = useCallback((product: Producto | null) => {
    setSelectedProduct(product);
    setOpenProducts(false);
    setProductQuery(product?.CKDescripcion ?? "");
    setHasUserInteracted(false);
  }, []);

  return {
    productQuery,
    openProducts,
    products: productsData?.data ?? [],
    loadingProducts,
    isFetched,
    selectedProduct,
    handleProductSearch,
    handleProductSelect,
    toggleProductPopover,
  };
}
