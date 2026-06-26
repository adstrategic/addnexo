import { prisma, Prisma } from "@repo/db";
import { Request, Response, Router } from "express";
// import publicClienteInviteRoutes from "../api/cliente-invite/public-cliente-invite.routes.js";
// import publicSupplierInviteRoutes from "../api/supplier-invite/public-supplier-invite.routes.js";
// import publicVendorInviteRoutes from "../api/vendor-invite/public-vendor-invite.routes.js";

const router: Router = Router();

// router.use("/client-invites", publicClienteInviteRoutes);
// router.use("/supplier-invites", publicSupplierInviteRoutes);
// router.use("/vendor-invites", publicVendorInviteRoutes);

// GET /api/inventario/proveedores/search/ciudades - Buscar ciudades para autocompletado
router.get(
  "/search/ciudades",
  async (req: Request<{}, {}, {}, { search: string }>, res: Response) => {
    const { search } = req.query;

    const where: Prisma.CiudadWhereInput = search
      ? {
          nombre: {
            contains: search,
            mode: "insensitive",
          },
        }
      : {};

    const ciudades = await prisma.ciudad.findMany({
      where,
      include: {
        estado: {
          include: {
            pais: true,
          },
        },
      },
      take: 10,
      orderBy: { nombre: "asc" },
    });

    res.status(200).json({
      data: ciudades,
      pagination: {
        page: 1,
        limit: 10,
        totalItems: ciudades.length,
        totalPages: Math.ceil(ciudades.length / 10),
      },
    });
  },
);

export default router;
