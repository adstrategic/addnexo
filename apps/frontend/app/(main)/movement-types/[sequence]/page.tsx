import { MovementTypeDetail } from "@/features/movement-types";

interface Props {
  params: {
    sequence: string;
  };
}

export default async function MovementTypeDetailsPage({ params }: Props) {
  const sequence = parseInt(params.sequence);

  if (isNaN(sequence)) {
    return (
      <div className="p-8 text-center">
        <h1 className="text-2xl font-bold text-red-600">
          Invalid Movement Type
        </h1>
        <p className="text-muted-foreground mt-2">
          The movement type sequence number is invalid.
        </p>
      </div>
    );
  }

  return <MovementTypeDetail sequence={sequence} />;
}
