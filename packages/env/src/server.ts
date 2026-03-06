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
    SMTP_HOST: z.string().min(1),
    SMTP_PORT: z.coerce.number().default(587),
    SMTP_USER: z.string().min(1),
    SMTP_PASS: z.string().min(1),
    SMTP_FROM: z.string().default("EasyPOS <noreply@easypos.app>"),
    APP_URL: z.string().default("https://easypos.app"),
    PAYNOW_INTEGRATION_ID: z.string().min(1),
    PAYNOW_INTEGRATION_KEY: z.string().min(1),
    PAYNOW_RESULT_URL: z.string().url(),
    PAYNOW_RETURN_URL: z.string().min(1), // Can be deep link (easypos://) or HTTP URL
    // Cloudflare R2 (S3-compatible)
    R2_ACCOUNT_ID: z.string().min(1),
    R2_ACCESS_KEY_ID: z.string().min(1),
    R2_SECRET_ACCESS_KEY: z.string().min(1),
    R2_BUCKET_NAME: z.string().min(1),
    R2_PUBLIC_URL: z.string().url(),
  },
  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
});
