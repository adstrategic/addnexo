"use client";

import { useProduct } from "../hooks/useCatalog";
import { useProductManager } from "../hooks/useCatalogManager";
import { useProductDelete } from "../hooks/useCatalogDelete";
import { ProductFormModal } from "../forms/CatalogFormModal";
import {
  EntityDetails,
  EntitySection,
} from "@/components/shared/EntityDetails";
import {
  Package,
  DollarSign,
  Tag,
  BarChart3,
  FileText,
  Ruler,
  TrendingUp,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { EntityDeleteModal } from "@/components/shared/EntityDeleteModal";

interface ProductDetailProps {
  productSecuencia: number;
}

export function ProductDetail({ productSecuencia }: ProductDetailProps) {
  const { data: product, isLoading, error } = useProduct(productSecuencia);

  const router = useRouter();

  // Hook para Formulario
  const productManager = useProductManager();

  // Hook para Eliminación con redirección
  const productDelete = useProductDelete({
    onAfterDelete: () => router.push("/catalog"),
    redirectOnDelete: true,
  });

  const handleViewInventory = () => {
    // TODO: Implement navigation to product inventory
    console.log("View product inventory:", product?.CKId);
  };

  const handleViewSales = () => {
    // TODO: Implement navigation to product sales
    console.log("View product sales:", product?.CKId);
  };

  const handleViewKardex = () => {
    // TODO: Implement navigation to product kardex
    console.log("View product kardex:", product?.CKId);
  };

  const handleViewReports = () => {
    // TODO: Implement navigation to product reports
    console.log("View product reports:", product?.CKId);
  };

  // Prepare information sections
  const sections: EntitySection[] = product
    ? [
        {
          title: "General Information",
          icon: <Package className="h-5 w-5" />,
          fields: [
            {
              label: "Description",
              value: product.CKDescripcion,
              icon: <Package className="h-4 w-4 text-muted-foreground" />,
            },
            {
              label: "Origin country",
              value:
                product.origenPais?.nombre ?? `#${String(product.CKOrigenId)}`,
              icon: <Tag className="h-4 w-4 text-muted-foreground" />,
            },
            {
              label: "Average weight (kg)",
              value: String(product.CKPesoPromedioKg),
              icon: <Ruler className="h-4 w-4 text-muted-foreground" />,
            },
            {
              label: "Unit of Measure",
              value: product.unidadDeMedida.UMNombre,
              icon: <Ruler className="h-4 w-4 text-muted-foreground" />,
            },
          ],
        },
        {
          title: "Pricing Information",
          icon: <DollarSign className="h-5 w-5" />,
          fields: [
            {
              label: "Public Price",
              value: `$${product.CKPrecioPublico}`,
              icon: <DollarSign className="h-4 w-4 text-muted-foreground" />,
            },
            {
              label: "Sale Price 1",
              value: `$${product.CKPrecioVenta1}`,
              icon: <DollarSign className="h-4 w-4 text-muted-foreground" />,
            },
            {
              label: "Sale Price 2",
              value: `$${product.CKPrecioVenta2}`,
              icon: <DollarSign className="h-4 w-4 text-muted-foreground" />,
            },
            {
              label: "Margin Percentage",
              value: `${product.CKPorcenMargen}%`,
              icon: <TrendingUp className="h-4 w-4 text-muted-foreground" />,
            },
            {
              label: "Discount Limit",
              value: `${product.CKTopeDescuento}%`,
              icon: <BarChart3 className="h-4 w-4 text-muted-foreground" />,
            },
          ],
        },
        {
          title: "Tax Information",
          icon: <FileText className="h-5 w-5" />,
          fields: [
            {
              label: "VAT Rate",
              value: `${product.CKIva}%`,
              icon: <FileText className="h-4 w-4 text-muted-foreground" />,
            },
            {
              label: "Tax Exempt",
              value: product.CKExento ? "Yes" : "No",
              icon: <FileText className="h-4 w-4 text-muted-foreground" />,
            },
          ],
        },
      ]
    : [];

  return (
    <>
      <EntityDetails
        title={product?.CKDescripcion || ""}
        subtitle={
          product
            ? `Group: ${product.grupo.GNro} - ${product.grupo.GDescripcion} | Code: ${product.CKCodigo}`
            : ""
        }
        sections={sections}
        isLoading={isLoading}
        error={error}
        onEdit={() =>
          product && productManager.openEdit(product.CKOrgSecuencia)
        }
        onDelete={() =>
          product &&
          productDelete.openDeleteModal(product.CKId, product.CKDescripcion)
        }
        notFoundMessage="The product you are looking for does not exist or has been deleted."
        notFoundIcon={<Package className="h-12 w-12 text-muted-foreground" />}
      />

      {/* Product Form Modal */}
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

      {/* Delete Confirmation Modal */}
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
