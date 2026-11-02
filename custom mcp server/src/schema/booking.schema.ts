
import { z } from "zod";

export const inputSchema = z.object({
  packageName: z.string().min(1).max(100).optional(),

  destinationName: z.string().min(1).max(100),

  maxBudget: z.number().finite().nonnegative().optional(),

  minBudget: z.number().finite().nonnegative().optional(),

  days: z.number().int().min(1).max(365).optional(),
}).refine(
  (data) =>
    data.minBudget === undefined ||
    data.maxBudget === undefined ||
    data.minBudget <= data.maxBudget,
  {
    message: "minBudget cannot exceed maxBudget",
    path: ["minBudget"],
  }
);
