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
import sales, { verifySalePublic } from "./routes/sales.js";
import customers from "./routes/customers.js";
import tags from "./routes/tags.js";
import devices from "./routes/devices.js";
import reports from "./routes/reports.js";
import billing, { billingWebhook } from "./routes/billing.js";
import uploads from "./routes/uploads.js";
import org from "./routes/org.js";

const app = new Hono()
  .basePath("/api")
  .use(logger())
  .use(
    "/*",
    cors({
      origin: "*",
      allowMethods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
      allowHeaders: ["Content-Type", "Authorization"],
    }),
  )
  .onError(handleError)
  .get("/health", (c) => c.json({ status: "ok", timestamp: new Date().toISOString() }))
  // Webhook and callback handlers (no auth required - Paynow calls these directly)
  // These MUST be registered before the main /billing route to take priority
  .route("/", billingWebhook)
  .route("/auth", auth)
  .route("/branches", branches)
  .route("/users", users)
  .route("/products", products)
  .route("/categories", categories)
  .route("/", verifySalePublic)
  .route("/sales", sales)
  .route("/customers", customers)
  .route("/tags", tags)
  .route("/devices", devices)
  .route("/reports", reports)
  .route("/billing", billing)
  .route("/uploads", uploads)
  .route("/org", org);

export type AppType = typeof app;
export default app;
