import { z } from "zod";

export const updateReminderConfigSchema = z.object({
  statementScheduledRemindersEnabled: z.boolean().optional(),
  statementClientScope: z.enum(["overdue", "balance"]).optional(),
});

export type UpdateReminderConfigBody = z.infer<
  typeof updateReminderConfigSchema
>;
