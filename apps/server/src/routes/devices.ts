import { Hono } from "hono";
import db from "@easypos/db";
import type { Env } from "../lib/context.js";
import { authMiddleware } from "../middleware/auth.js";

const devices = new Hono<Env>()
  .use(authMiddleware)

  // ── List devices ──────────────────────────────────────────────
  .get("/", async (c) => {
    const orgId = c.get("orgId");

    const items = await db.device.findMany({
      where: { branch: { orgId } },
      include: { branch: { select: { id: true, name: true } } },
      orderBy: { lastSeenAt: "desc" },
    });

    return c.json({ items });
  })

  // ── Register device ───────────────────────────────────────────
  .post("/register", async (c) => {
    const branchId = c.get("branchId");
    if (!branchId) {
      return c.json({ error: "You must be assigned to a branch" }, 400);
    }

    const body = await c.req.json();
    const { name, deviceIdentifier } = body;

    if (!name || !deviceIdentifier) {
      return c.json({ error: "name and deviceIdentifier are required" }, 400);
    }

    const device = await db.device.upsert({
      where: { deviceIdentifier_branchId: { deviceIdentifier, branchId } },
      update: { name, lastSeenAt: new Date() },
      create: { name, deviceIdentifier, branchId, lastSeenAt: new Date() },
    });

    return c.json(device, 201);
  })

  // ── Device heartbeat ──────────────────────────────────────────
  .post("/:id/heartbeat", async (c) => {
    const id = c.req.param("id");

    const device = await db.device.update({
      where: { id },
      data: { lastSeenAt: new Date() },
    });

    return c.json({ ok: true, lastSeenAt: device.lastSeenAt });
  });

export default devices;
