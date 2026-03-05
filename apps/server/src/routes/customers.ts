import { Hono } from "hono";
import db from "@easypos/db";
import { paginationQuerySchema } from "@easypos/types";
import { getPaginationMeta, getPaginationSkip } from "@easypos/utils";
import { zBody, zQuery } from "../lib/validate.js";
import { z } from "zod";
import type { Env } from "../lib/context.js";
import { authMiddleware } from "../middleware/auth.js";

const createCustomerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  gender: z.enum(["MALE", "FEMALE"]).optional(),
  notes: z.string().optional(),
});

const updateCustomerSchema = createCustomerSchema.partial();

const customers = new Hono<Env>()
  .use(authMiddleware)

  // ── List customers (paginated) ────────────────────────────────
  .get("/", zQuery(paginationQuerySchema), async (c) => {
    const orgId = c.get("orgId");
    const { page, pageSize, search } = c.req.valid("query");

    const where: any = { orgId };
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { phone: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }

    const [items, total] = await Promise.all([
      db.customer.findMany({
        where,
        include: { _count: { select: { sales: true } } },
        skip: getPaginationSkip(page, pageSize),
        take: pageSize,
        orderBy: { name: "asc" },
      }),
      db.customer.count({ where }),
    ]);

    return c.json({ items, ...getPaginationMeta(total, page, pageSize) });
  })

  // ── Get customer by ID ────────────────────────────────────────
  .get("/:id", async (c) => {
    const orgId = c.get("orgId");
    const id = c.req.param("id");

    const customer = await db.customer.findFirst({
      where: { id, orgId },
      include: {
        _count: { select: { sales: true } },
        sales: {
          include: {
            cashier: { select: { id: true, name: true } },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!customer) return c.json({ error: "Customer not found" }, 404);
    return c.json(customer);
  })

  // ── Create customer ───────────────────────────────────────────
  .post("/", zBody(createCustomerSchema), async (c) => {
    const orgId = c.get("orgId");
    const data = c.req.valid("json");

    const customer = await db.customer.create({
      data: {
        name: data.name,
        phone: data.phone || null,
        email: data.email || null,
        gender: data.gender || null,
        notes: data.notes || null,
        orgId,
      },
      include: { _count: { select: { sales: true } } },
    });

    return c.json(customer, 201);
  })

  // ── Update customer ───────────────────────────────────────────
  .put("/:id", zBody(updateCustomerSchema), async (c) => {
    const orgId = c.get("orgId");
    const id = c.req.param("id");
    const data = c.req.valid("json");

    const existing = await db.customer.findFirst({ where: { id, orgId } });
    if (!existing) return c.json({ error: "Customer not found" }, 404);

    const customer = await db.customer.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.phone !== undefined && { phone: data.phone || null }),
        ...(data.email !== undefined && { email: data.email || null }),
        ...(data.gender !== undefined && { gender: data.gender || null }),
        ...(data.notes !== undefined && { notes: data.notes || null }),
      },
      include: { _count: { select: { sales: true } } },
    });

    return c.json(customer);
  })

  // ── Delete customer ───────────────────────────────────────────
  .delete("/:id", async (c) => {
    const orgId = c.get("orgId");
    const id = c.req.param("id");

    const existing = await db.customer.findFirst({ where: { id, orgId } });
    if (!existing) return c.json({ error: "Customer not found" }, 404);

    await db.customer.delete({ where: { id } });
    return c.json({ success: true });
  });

export default customers;
