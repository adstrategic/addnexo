"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BarChart3,
  DollarSign,
  FileText,
  Globe,
  Package,
  Ruler,
  Tag,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useProduct } from "../hooks/useCatalog";
import { useProductManager } from "../hooks/useCatalogManager";
import { useProductDelete } from "../hooks/useCatalogDelete";
import { ProductFormModal } from "../forms/CatalogFormModal";
import { EntityDeleteModal } from "@/components/shared/EntityDeleteModal";
import { ErrorBoundary } from "@/components/error-boundary";
import {
  CatalogDetailsView,
  formatCurrency,
  renderExemptBadge,
} from "./CatalogDetailsView";

interface ProductDetailProps {
  productSecuencia: number;
}

export function ProductDetail({ productSecuencia }: ProductDetailProps) {
  const { data: product, isLoading, error } = useProduct(productSecuencia);
  const router = useRouter();

  const productManager = useProductManager();
  const productDelete = useProductDelete({
    onAfterDelete: () => router.push("/catalog"),
    redirectOnDelete: true,
  });

  const handleEdit = () => {
    if (product) {
      productManager.openEdit(product.CKOrgSecuencia);
    }
  };

  const handleDelete = () => {
    if (product) {
      productDelete.openDeleteModal(product.CKId, product.CKDescripcion);
    }
  };

  if (error) {
    return (
      <div className="p-4 md:p-8">
        <ErrorBoundary error={error} entityName="Product" />
      </div>
    );
  }

  if (!isLoading && !product) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 p-4 text-center md:p-8">
        <Package className="size-12 text-muted-foreground" aria-hidden />
        <div className="space-y-1">
          <h2 className="text-lg font-semibold">Product not found</h2>
          <p className="text-sm text-muted-foreground">
            The product you are looking for does not exist or has been deleted.
          </p>
        </div>
        <Button asChild variant="outline" className="cursor-pointer">
          <Link href="/catalog">
            <ArrowLeft className="mr-2 size-4" aria-hidden />
            Back to products
          </Link>
        </Button>
      </div>
    );
  }

  const sections = product
    ? [
        {
          title: "General Information",
          icon: <Package className="size-5" aria-hidden />,
          fields: [
            {
              label: "Description",
              value: product.CKDescripcion,
              icon: <Package className="size-4" aria-hidden />,
            },
            {
              label: "Group",
              value: `${product.grupo.GNro} - ${product.grupo.GDescripcion}`,
              icon: <Tag className="size-4" aria-hidden />,
            },
            {
              label: "Code",
              value: String(product.CKCodigo),
              icon: <Tag className="size-4" aria-hidden />,
            },
            {
              label: "Origin country",
              value:
                product.origenPais?.nombre ?? `#${String(product.CKOrigenId)}`,
              icon: <Globe className="size-4" aria-hidden />,
            },
            {
              label: "Average weight (kg)",
              value: String(product.CKPesoPromedioKg),
              icon: <Ruler className="size-4" aria-hidden />,
            },
            {
              label: "Unit of measure",
              value: `${product.unidadDeMedida.UMNombre} - ${product.unidadDeMedida.UMDescripcion}`,
              icon: <Ruler className="size-4" aria-hidden />,
            },
          ],
        },
        {
          title: "Pricing Information",
          icon: <DollarSign className="size-5" aria-hidden />,
          fields: [
            {
              label: "Public price",
              value: formatCurrency(product.CKPrecioPublico),
              icon: <DollarSign className="size-4" aria-hidden />,
            },
            {
              label: "Sale price 1",
              value: formatCurrency(product.CKPrecioVenta1),
              icon: <DollarSign className="size-4" aria-hidden />,
            },
            {
              label: "Sale price 2",
              value: formatCurrency(product.CKPrecioVenta2),
              icon: <DollarSign className="size-4" aria-hidden />,
            },
            {
              label: "Margin percentage",
              value: `${product.CKPorcenMargen}%`,
              icon: <TrendingUp className="size-4" aria-hidden />,
            },
            {
              label: "Discount limit",
              value: `${product.CKTopeDescuento}%`,
              icon: <BarChart3 className="size-4" aria-hidden />,
            },
          ],
        },
        {
          title: "Tax Information",
          icon: <FileText className="size-5" aria-hidden />,
          fields: [
            {
              label: "VAT rate",
              value: `${product.CKIva}%`,
              icon: <FileText className="size-4" aria-hidden />,
            },
            {
              label: "Tax exempt",
              value: renderExemptBadge(product.CKExento),
              icon: <FileText className="size-4" aria-hidden />,
            },
          ],
        },
      ]
    : [];

  const quickActions = [
    {
      label: "View inventory",
      icon: <Package className="size-5" aria-hidden />,
      onClick: () => {
        // TODO: Navigate to product inventory
      },
    },
    {
      label: "View sales",
      icon: <BarChart3 className="size-5" aria-hidden />,
      onClick: () => {
        // TODO: Navigate to product sales
      },
    },
    {
      label: "View kardex",
      icon: <FileText className="size-5" aria-hidden />,
      onClick: () => {
        // TODO: Navigate to product kardex
      },
    },
  ];

  return (
    <>
      <CatalogDetailsView
        title={product?.CKDescripcion ?? ""}
        subtitle={
          product
            ? `Group ${product.grupo.GNro} · Code ${product.CKCodigo}`
            : undefined
        }
        sections={sections}
        isLoading={isLoading}
        onEdit={handleEdit}
        onDelete={handleDelete}
        quickActions={quickActions}
      />

      <ProductFormModal
        isOpen={productManager.isOpen}
        onClose={productManager.close}
        mode={productManager.mode}
        initialData={productManager.product}
        form={productManager.form}
        onSubmit={productManager.onSubmit}
        isLoading={productManager.isMutating}
        isLoadingProduct={productManager.isLoadingProduct}
        productError={productManager.productError}
      />

      <EntityDeleteModal
        isOpen={productDelete.isDeleteModalOpen}
        onClose={productDelete.closeDeleteModal}
        onConfirm={productDelete.handleDeleteConfirm}
        entity="product"
        entityName={productDelete.productoAEliminar?.CKDescripcion || ""}
        isDeleting={productDelete.isDeleting}
      />
    </>
  );
}
