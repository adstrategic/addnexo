import { z } from "zod";

// Payment detail schemas (bank fields are bank IDs from Bank table)
const walletPaymentDetailsSchema = z.object({
  WPBancoId: z
    .number({ error: "Bank is required" })
    .int()
    .positive("Bank is required"),
  WPNombreWallet: z.string().min(1, "Wallet name is required").max(100),
  WPTelefonoOClave: z.string().min(1, "Phone or key is required").max(50),
});

const creditCardPaymentDetailsSchema = z.object({
  CCPBancoId: z
    .number({ error: "Bank is required" })
    .int()
    .positive("Bank is required"),
  CCPMarca: z.enum(["VISA", "MASTERCARD", "AMEX", "DISCOVER", "OTHER"], {
    error: "Card brand is required",
  }),
  CCPUltimos4Digitos: z
    .string()
    .length(4, "Must be exactly 4 digits")
    .regex(/^\d{4}$/, "Must contain only digits"),
});

const transferPaymentDetailsSchema = z.object({
  TPBancoId: z
    .number({ error: "Bank is required" })
    .int()
    .positive("Bank is required"),
  TPTipoCuenta: z.enum(["CHECKING", "SAVINGS", "OTHER"], {
    error: "Account type is required",
  }),
  TPNumeroCuenta: z.string().min(1, "Account number is required").max(50),
});

const checkPaymentDetailsSchema = z.object({
  CHPBancoId: z
    .number({ error: "Bank is required" })
    .int()
    .positive("Bank is required"),
  CHPNumeroCheque: z.string().min(1, "Check number is required").max(50),
  CHPFechaCheque: z.date({ error: "Check date is required" }),
});

// Enhanced payment form schema
export const paymentFormSchema = z
  .object({
    MCValor: z
      .number({
        error: "Payment amount is required",
      })
      .positive("Payment amount must be greater than 0")
      .refine((val) => val > 0 && val <= 9999999.99, {
        message: "Payment amount must be greater than 0",
      }),

    MCTipoPago: z.enum(
      [
        "CONTADO",
        "CANJE",
        "CREDITO",
        "WALLET",
        "CREDIT_CARD",
        "TRANSFER",
        "CHECK",
      ],
      { error: "Payment type is required" },
    ),

    MCNroDocumento: z
      .string({ error: "Document number is required" })
      .trim()
      .min(1, "Document number is required")
      .max(40, "Document number cannot exceed 40 characters"),

    MCDescripcion: z
      .string({
        error: "Description is required",
      })
      .min(1, "Description is required")
      .max(255, "Description cannot exceed 255 characters"),

    MCFecha: z.date({
      error: "Date of registration is required",
    }),

    // Optional payment details
    walletDetails: walletPaymentDetailsSchema.optional(),
    creditCardDetails: creditCardPaymentDetailsSchema.optional(),
    transferDetails: transferPaymentDetailsSchema.optional(),
    checkDetails: checkPaymentDetailsSchema.optional(),
  })
  .superRefine((data, ctx) => {
    // Conditional validation - add errors to both parent and individual fields
    if (data.MCTipoPago === "WALLET" && !data.walletDetails) {
      // Parent-level error for section display
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Wallet payment details are required",
        path: ["walletDetails"],
      });
      // Individual field errors for granular feedback
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Bank is required",
        path: ["walletDetails", "WPBancoId"],
      });
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Wallet name is required",
        path: ["walletDetails", "WPNombreWallet"],
      });
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Phone or key is required",
        path: ["walletDetails", "WPTelefonoOClave"],
      });
    }
    if (data.MCTipoPago === "CREDIT_CARD" && !data.creditCardDetails) {
      // Parent-level error for section display
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Credit card details are required",
        path: ["creditCardDetails"],
      });
      // Individual field errors
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Bank is required",
        path: ["creditCardDetails", "CCPBancoId"],
      });
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Card brand is required",
        path: ["creditCardDetails", "CCPMarca"],
      });
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Last 4 digits are required",
        path: ["creditCardDetails", "CCPUltimos4Digitos"],
      });
    }
    if (data.MCTipoPago === "TRANSFER" && !data.transferDetails) {
      // Parent-level error for section display
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Transfer details are required",
        path: ["transferDetails"],
      });
      // Individual field errors
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Bank is required",
        path: ["transferDetails", "TPBancoId"],
      });

      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Account type is required",
        path: ["transferDetails", "TPTipoCuenta"],
      });
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Account number is required",
        path: ["transferDetails", "TPNumeroCuenta"],
      });
    }
    if (data.MCTipoPago === "CHECK" && !data.checkDetails) {
      // Parent-level error for section display
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Check details are required",
        path: ["checkDetails"],
      });
      // Individual field errors
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Bank is required",
        path: ["checkDetails", "CHPBancoId"],
      });
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Check number is required",
        path: ["checkDetails", "CHPNumeroCheque"],
      });
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Check date is required",
        path: ["checkDetails", "CHPFechaCheque"],
      });
    }
  });

// Debit note form validation schema
export const debitNoteFormSchema = z.object({
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
    .string({
      error: "Description is required",
    })
    .min(1, "Description is required")
    .max(255, "Description cannot exceed 255 characters"),

  MCFecha: z.date({ error: "Date of registration is required" }),
});

// Credit note form validation schema (simple)
export const creditNoteFormSchema = z.object({
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
    .string({ error: "Description is required" })
    .min(1, "Description is required")
    .max(255, "Description cannot exceed 255 characters"),
  MCFecha: z.date({ error: "Date of registration is required" }),
});

// Credit note with return form validation
export const creditNoteWithReturnFormSchema = z.object({
  MCNroDocumento: z
    .string({ error: "Document number is required" })
    .trim()
    .min(1, "Document number is required")
    .max(40, "Document number cannot exceed 40 characters"),
  MCDescripcion: z
    .string({ error: "Description is required" })
    .min(1, "Description is required")
    .max(255, "Description cannot exceed 255 characters"),
  MCFecha: z.date({ error: "Date of registration is required" }),
  items: z
    .array(
      z.object({
        FUId: z.number(),
        cantidad: z.number().positive(),
      }),
    )
    .min(1, "At least one item is required"),
});

// Infer types from schemas
export type PaymentFormData = z.infer<typeof paymentFormSchema>;
export type DebitNoteFormData = z.infer<typeof debitNoteFormSchema>;
export type CreditNoteFormData = z.infer<typeof creditNoteFormSchema>;
export type CreditNoteWithReturnFormData = z.infer<
  typeof creditNoteWithReturnFormSchema
>;

// Wire payloads sent to the API. The form keeps `MCFecha` as a `Date`, but it is
// serialized to a string (via `combineDateWithCurrentTimeUTC`) before being sent.
export type PaymentSubmitData = Omit<PaymentFormData, "MCFecha"> & {
  MCFecha: string;
};
export type DebitNoteSubmitData = Omit<DebitNoteFormData, "MCFecha"> & {
  MCFecha: string;
};
export type CreditNoteSubmitData = Omit<CreditNoteFormData, "MCFecha"> & {
  MCFecha: string;
};
export type CreditNoteWithReturnSubmitData = Omit<
  CreditNoteWithReturnFormData,
  "MCFecha"
> & {
  MCFecha: string;
};
