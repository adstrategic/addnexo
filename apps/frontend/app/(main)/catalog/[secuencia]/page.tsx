import { LoadingComponent } from "@/components/loading-component";
import { ProductDetail } from "@/features/catalog";
import { Suspense } from "react";

interface ProductPageProps {
  params: Promise<{
    secuencia: string;
  }>;
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { secuencia } = await params;
  const sequenceParsed = Number(secuencia);

  return (
    <Suspense
      fallback={
        <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <LoadingComponent variant="dashboard" rows={8} />
        </div>
      }
    >
      {" "}
      <ProductDetail productSecuencia={sequenceParsed} />{" "}
    </Suspense>
  );
}
