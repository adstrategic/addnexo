import type { CreateVendorDto, VendorResponse } from "../schemas/VendorSchema";

// Transform API data to form format (for editing)
export function transformFromApiFormat(apiData: VendorResponse): CreateVendorDto {
  return {
    VNombre: apiData.VNombre,
    VCorreo: apiData.VCorreo,
    VTelefono: apiData.VTelefono,
    VNitCedula: apiData.VNitCedula,
  };
}
