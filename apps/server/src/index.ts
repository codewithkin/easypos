import { env } from "@easypos/env/server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { swaggerUI } from "@hono/swagger-ui";
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
import admin from "./routes/admin.js";

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
  .get("/doc", swaggerUI({ url: "/api/openapi.json" }))
  .get("/openapi.json", (c) => {
    return c.json({
      openapi: "3.0.0",
      info: {
        title: "EasyPOS API",
        version: "1.0.0",
        description: "Point of Sale Management System API",
      },
      servers: [
        {
          url: "http://localhost:3000",
          description: "Development Server",
        },
      ],
      paths: {
        "/api/admin/setup-plan": {
          post: {
            tags: ["Admin"],
            summary: "Manual plan setup (password protected)",
            description: "Set up an organization with a specific plan, resource limits, and billing cycle. Password-protected endpoint for admin/developer use only.",
            requestBody: {
              required: true,
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    required: ["password", "orgId", "plan"],
                    properties: {
                      password: {
                        type: "string",
                        example: "exyro45610y2627291",
                        description: "Admin password (case-sensitive)",
                      },
                      orgId: {
                        type: "string",
                        example: "org_xxxxxxxxxxxxx",
                        description: "Organization ID to update",
                      },
                      plan: {
                        type: "string",
                        enum: ["starter", "growth", "enterprise"],
                        example: "growth",
                        description: "Plan to assign (starter, growth, or enterprise)",
                      },
                    },
                  },
                },
              },
            },
            responses: {
              "200": {
                description: "Plan successfully set up",
                content: {
                  "application/json": {
                    schema: {
                      type: "object",
                      properties: {
                        success: { type: "boolean", example: true },
                        message: {
                          type: "string",
                          example: 'Organization "Acme Corp" has been set up with the growth plan',
                        },
                        org: {
                          type: "object",
                          properties: {
                            id: { type: "string" },
                            name: { type: "string" },
                            plan: { type: "string" },
                            maxUsers: { type: "number" },
                            maxMonthlyInvoices: { type: "number" },
                            maxProducts: { type: "number" },
                            maxCategories: { type: "number" },
                            maxBranches: { type: "number" },
                            billingCycleStart: { type: "string", format: "date-time" },
                            nextBillingDate: { type: "string", format: "date-time" },
                          },
                        },
                      },
                    },
                  },
                },
              },
              "401": {
                description: "Invalid password",
                content: {
                  "application/json": {
                    schema: {
                      type: "object",
                      properties: {
                        error: { type: "string", example: "Invalid password" },
                      },
                    },
                  },
                },
              },
              "404": {
                description: "Organization not found",
                content: {
                  "application/json": {
                    schema: {
                      type: "object",
                      properties: {
                        error: { type: "string", example: "Organization not found" },
                      },
                    },
                  },
                },
              },
              "400": {
                description: "Validation error",
                content: {
                  "application/json": {
                    schema: {
                      type: "object",
                      properties: {
                        error: { type: "string", example: "Validation error" },
                        details: { type: "array" },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });
  })
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
  .route("/org", org)
  .route("/admin", admin);

export type AppType = typeof app;
export default app;
