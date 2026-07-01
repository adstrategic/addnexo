import { prisma, Prisma } from "@repo/db";
import { Request, Response, Router } from "express";

const router: Router = Router();

/**
 * GET /api/v1/public/invitations/:id
 * Returns minimal, non-sensitive info for a pending, unexpired invitation.
 * Used by the frontend so unauthenticated invitees can see org/role/email
 * before being redirected to sign-up with the correct email pre-filled.
 */
router.get(
  "/invitations/:id",
  async (req: Request<{ id: string }>, res: Response) => {
    const { id } = req.params;

    const invitation = await prisma.invitation.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        role: true,
        status: true,
        expiresAt: true,
        organization: {
          select: { name: true },
        },
        user: {
          select: { name: true },
        },
      },
    });

    if (!invitation) {
      return res.status(404).json({ error: "Invitation not found or expired." });
    }

    if (invitation.status !== "pending") {
      return res.status(404).json({ error: "Invitation not found or expired." });
    }

    if (new Date(invitation.expiresAt) < new Date()) {
      return res.status(404).json({ error: "Invitation not found or expired." });
    }

    return res.json({
      id: invitation.id,
      email: invitation.email,
      role: invitation.role,
      organizationName: invitation.organization.name,
      inviterName: invitation.user.name,
      expiresAt: invitation.expiresAt,
    });
  },
);

// GET /api/v1/public/search/ciudades - Buscar ciudades para autocompletado
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
