import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  LOG_LEVEL: z
    .enum(["debug", "info", "warn", "error", "silent"])
    .default("info"),
  WEBHOOK_URL: z.url().default("http://localhost:3000/vehicles/webhook"),
});

export const config = envSchema.parse(process.env);
