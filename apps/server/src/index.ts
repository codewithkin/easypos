import { env } from "@easypos/env/server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { handleError } from "./lib/errors.js";

import auth from "./routes/auth.js";
import branches from "./routes/branches.js";
import users from "./routes/users.js";
import products from "./routes/products.js";
import categories from "./routes/categories.js";
import sales from "./routes/sales.js";
import devices from "./routes/devices.js";
import reports from "./routes/reports.js";
import billing, { billingWebhook } from "./routes/billing.js";

const app = new Hono()
  .basePath("/api")
  .use(logger())
  .use(
    "/*",
    cors({
      origin: env.CORS_ORIGIN,
      allowMethods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
      allowHeaders: ["Content-Type", "Authorization"],
    }),
  )
  .onError(handleError)
  .get("/health", (c) => c.json({ status: "ok", timestamp: new Date().toISOString() }))
  .route("/auth", auth)
  .route("/branches", branches)
  .route("/users", users)
  .route("/products", products)
  .route("/categories", categories)
  .route("/sales", sales)
  .route("/devices", devices)
  .route("/reports", reports)
  .route("/billing", billing)
  // Webhook handler (no auth required - Paynow calls this directly)
  .route("/", billingWebhook);

export type AppType = typeof app;
export default app;
