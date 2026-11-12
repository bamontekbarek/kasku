import { z } from "zod";

/** NOT-04: any subset of the settings can be saved (each toggle saves on its own). */
export const notificationSettingsSchema = z
  .object({
    budgetNear: z.boolean(),
    budgetThreshold: z.union([z.literal(70), z.literal(80), z.literal(90)]),
    budgetOver: z.boolean(),
    dailyReminder: z.boolean(),
    reminderTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
    weeklySummary: z.boolean(),
    monthlyReport: z.boolean(),
  })
  .partial();

export type NotificationSettingsPatch = z.infer<typeof notificationSettingsSchema>;
