import "dotenv/config";
import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
  server: {
    DATABASE_URL: z.string().min(1),
    CORS_ORIGIN: z.string().min(1),
    NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
    JWT_SECRET: z.string().min(16),
    JWT_REFRESH_SECRET: z.string().min(16),
  },
  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
});
