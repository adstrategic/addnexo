import { TipoPago } from "@repo/db";
import { z } from "zod";

// ===== ESQUEMAS DE VALIDACIÓN (para middleware) =====

// Esquema para listado de facturas
export const listFacturasSchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  search: z.string().optional(),
  estado: z.enum(["ACTIVE", "PAID", "OVERDUE", "ANULATED"]).optional(),
  clienteId: z.coerce.number().int().positive().optional(),
  vendedorId: z.coerce.number().int().positive().optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
});

// Esquema para obtener factura por ID
export const getFacturaByIdSchema = z.object({
  id: z.coerce.number().int().positive("The ID must be a positive number"),
});

// Esquema para obtener factura por secuencia
export const getFacturaBySecuenciaSchema = z.object({
  secuencia: z.coerce
    .number()
    .int()
    .positive("The sequence must be a positive number"),
});

// Esquema para enviar statement por email
export const sendStatementSchema = z.object({
  clienteId: z.coerce.number().int().positive("Cliente is required"),
  email: z.email("Valid email is required"),
});

// Esquema para descargar PDF de statement (query)
export const getStatementPdfSchema = z.object({
  clienteId: z.coerce.number().int().positive("Cliente is required"),
});

// Base schema for facturas (without refinements)
export const crearFacturaSchema = z.object({
  dispatchOrderId: z.coerce
    .number()
    .int()
    .positive("The dispatch order ID is required"),
  diasParaVencimiento: z.coerce
    .number()
    .int()
    .min(1, "Days must be 1 or greater")
    .max(365, "Days cannot exceed 365"),
  // pago: z.enum(["CONTADO", "CANJE", "CREDITO"], {
  //   error: "Payment type is required",
  // }),
  pago: z.enum(TipoPago, {
    error: "Payment type is required",
  }),
});

// Esquema para crear devoluciones
export const crearFacturaDevolucionesSchema = z.object({
  devoluciones: z
    .array(
      z.object({
        DOUId: z.number().int().positive("Item ID is required"),
        DOUCantidad: z
          .number()
          .int()
          .positive("Quantity must be greater than 0")
          .max(999999, "Quantity cannot exceed 999999"),
      }),
    )
    .min(1, "At least one return item is required"),
});

// Payment detail schemas (bank fields are bank IDs from Bank table)
export const walletPaymentDetailsSchema = z.object({
  WPBancoId: z.coerce.number().int().positive("Bank is required"),
  WPNombreWallet: z.string().min(1, "Wallet name is required").max(100),
  WPTelefonoOClave: z.string().min(1, "Phone or key is required").max(50),
});

export const creditCardPaymentDetailsSchema = z.object({
  CCPBancoId: z.coerce.number().int().positive("Bank is required"),
  CCPMarca: z.enum(["VISA", "MASTERCARD", "AMEX", "DISCOVER", "OTHER"], {
    error: "Card brand is required",
  }),
  CCPUltimos4Digitos: z
    .string()
    .length(4, "Must be exactly 4 digits")
    .regex(/^\d{4}$/, "Must contain only digits"),
});

export const transferPaymentDetailsSchema = z.object({
  TPBancoId: z.coerce.number().int().positive("Bank is required"),
  TPTipoCuenta: z.enum(["CHECKING", "SAVINGS", "OTHER"], {
    error: "Account type is required",
  }),
  TPNumeroCuenta: z.string().min(1, "Account number is required").max(50),
});

export const checkPaymentDetailsSchema = z.object({
  CHPBancoId: z.coerce.number().int().positive("Bank is required"),
  CHPNumeroCheque: z.string().min(1, "Check number is required").max(50),
  CHPFechaCheque: z.coerce.date({ error: "Check date is required" }),
});

// Esquema para registrar un pago
export const registrarPagoSchema = z
  .object({
    MCValor: z.coerce
      .number({ error: "Payment amount is required" })
      .positive("Payment amount must be greater than 0")
      .refine((val) => val > 0 && val <= 9999999.99, {
        message: "Payment amount must be greater than 0",
      }),
    MCTipoPago: z.enum(TipoPago, {
      error: "Payment type is required",
    }),
    MCNroDocumento: z
      .string({ error: "Document number is required" })
      .trim()
      .min(1, "Document number is required")
      .max(40, "Document number cannot exceed 40 characters"),
    MCDescripcion: z
      .string()
      .min(1, "Description is required")
      .max(255, "Description cannot exceed 255 characters"),

    MCFecha: z.coerce.date({ error: "Payment date is required" }),

    // Optional payment details (conditionally required based on type)
    walletDetails: walletPaymentDetailsSchema.optional(),
    creditCardDetails: creditCardPaymentDetailsSchema.optional(),
    transferDetails: transferPaymentDetailsSchema.optional(),
    checkDetails: checkPaymentDetailsSchema.optional(),
  })
  .superRefine((data, ctx) => {
    // Validate that detailed payment types have their required details
    // Add errors to both parent and individual fields for comprehensive feedback
    if (data.MCTipoPago === "WALLET" && !data.walletDetails) {
      // Parent-level error for section display
      ctx.addIssue({
        code: "custom",
        message: "Wallet payment details are required",
        path: ["walletDetails"],
      });
      // Individual field errors for granular feedback
      ctx.addIssue({
        code: "custom",
        message: "Bank is required",
        path: ["walletDetails", "WPBancoId"],
      });
      ctx.addIssue({
        code: "custom",
        message: "Wallet name is required",
        path: ["walletDetails", "WPNombreWallet"],
      });
      ctx.addIssue({
        code: "custom",
        message: "Phone or key is required",
        path: ["walletDetails", "WPTelefonoOClave"],
      });
    }
    if (data.MCTipoPago === "CREDIT_CARD" && !data.creditCardDetails) {
      // Parent-level error for section display
      ctx.addIssue({
        code: "custom",
        message: "Credit card details are required",
        path: ["creditCardDetails"],
      });
      // Individual field errors
      ctx.addIssue({
        code: "custom",
        message: "Bank is required",
        path: ["creditCardDetails", "CCPBancoId"],
      });
      ctx.addIssue({
        code: "custom",
        message: "Card brand is required",
        path: ["creditCardDetails", "CCPMarca"],
      });
      ctx.addIssue({
        code: "custom",
        message: "Last 4 digits are required",
        path: ["creditCardDetails", "CCPUltimos4Digitos"],
      });
    }
    if (data.MCTipoPago === "TRANSFER" && !data.transferDetails) {
      // Parent-level error for section display
      ctx.addIssue({
        code: "custom",
        message: "Transfer details are required",
        path: ["transferDetails"],
      });
      // Individual field errors
      ctx.addIssue({
        code: "custom",
        message: "Bank is required",
        path: ["transferDetails", "TPBancoId"],
      });
      ctx.addIssue({
        code: "custom",
        message: "Account type is required",
        path: ["transferDetails", "TPTipoCuenta"],
      });
      ctx.addIssue({
        code: "custom",
        message: "Account number is required",
        path: ["transferDetails", "TPNumeroCuenta"],
      });
    }
    if (data.MCTipoPago === "CHECK" && !data.checkDetails) {
      // Parent-level error for section display
      ctx.addIssue({
        code: "custom",
        message: "Check details are required",
        path: ["checkDetails"],
      });
      // Individual field errors
      ctx.addIssue({
        code: "custom",
        message: "Bank is required",
        path: ["checkDetails", "CHPBancoId"],
      });
      ctx.addIssue({
        code: "custom",
        message: "Check number is required",
        path: ["checkDetails", "CHPNumeroCheque"],
      });
      ctx.addIssue({
        code: "custom",
        message: "Check date is required",
        path: ["checkDetails", "CHPFechaCheque"],
      });
    }
  });

// Esquema para registrar una nota débito
export const registrarNotaDebitoSchema = z.object({
  MCValor: z
    .number({
      error: "Payment amount is required",
    })
    .positive("Payment amount must be greater than 0")
    .refine((val) => val > 0 && val <= 9999999.99, {
      message: "Payment amount must be greater than 0",
    }),
  MCNroDocumento: z
    .string({ error: "Document number is required" })
    .trim()
    .min(1, "Document number is required")
    .max(40, "Document number cannot exceed 40 characters"),
  MCDescripcion: z
    .string()
    .min(1, "Description is required")
    .max(255, "Description cannot exceed 255 characters"),
  MCFecha: z.coerce.date({ error: "Date is required" }),
});

// Esquema para registrar una nota crédito (simple)
export const registrarNotaCreditoSchema = z.object({
  MCValor: z
    .number({
      error: "Payment amount is required",
    })
    .positive("Payment amount must be greater than 0")
    .refine((val) => val > 0 && val <= 9999999.99, {
      message: "Payment amount must be greater than 0",
    }),
  MCNroDocumento: z
    .string({ error: "Document number is required" })
    .trim()
    .min(1, "Document number is required")
    .max(40, "Document number cannot exceed 40 characters"),
  MCDescripcion: z
    .string()
    .min(1, "Description is required")
    .max(255, "Description cannot exceed 255 characters"),
  MCFecha: z.coerce.date({ error: "Date is required" }),
});

// Esquema para registrar una nota crédito con devolución de inventario
export const registrarNotaCreditoConDevolucionSchema = z.object({
  MCNroDocumento: z
    .string({ error: "Document number is required" })
    .trim()
    .min(1, "Document number is required")
    .max(40, "Document number cannot exceed 40 characters"),
  MCDescripcion: z
    .string()
    .min(1, "Description is required")
    .max(255, "Description cannot exceed 255 characters"),
  MCFecha: z.coerce.date({ error: "Date is required" }),
  items: z
    .array(
      z.object({
        FUId: z.number().int().positive("Item ID is required"),
        cantidad: z
          .number()
          .positive("Quantity must be greater than 0")
          .max(999999, "Quantity cannot exceed 999999"),
      }),
    )
    .min(1, "At least one item is required"),
});

// Tipos para usar en el resto de la aplicación
export type ListFacturasQuery = z.infer<typeof listFacturasSchema>;
export type CrearFacturaDto = z.infer<typeof crearFacturaSchema>;
export type CrearFacturaDevolucionesDto = z.infer<
  typeof crearFacturaDevolucionesSchema
>;
export type RegistrarPagoDto = z.infer<typeof registrarPagoSchema>;
export type RegistrarNotaDebitoDto = z.infer<typeof registrarNotaDebitoSchema>;
export type RegistrarNotaCreditoDto = z.infer<
  typeof registrarNotaCreditoSchema
>;
export type RegistrarNotaCreditoConDevolucionDto = z.infer<
  typeof registrarNotaCreditoConDevolucionSchema
>;

export type SendStatementDto = z.infer<typeof sendStatementSchema>;
