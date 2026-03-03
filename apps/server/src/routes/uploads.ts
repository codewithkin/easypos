import { Hono } from "hono";
import { z } from "zod";
import { getPresignedUploadUrl, generateKey } from "@easypos/uploads";
import { zBody } from "../lib/validate.js";

const ALLOWED_CONTENT_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
type AllowedContentType = (typeof ALLOWED_CONTENT_TYPES)[number];

const ALLOWED_FOLDERS = ["logos", "products", "avatars"] as const;
type AllowedFolder = (typeof ALLOWED_FOLDERS)[number];

const presignSchema = z.object({
  folder: z.enum(ALLOWED_FOLDERS),
  contentType: z.enum(ALLOWED_CONTENT_TYPES),
});

const uploads = new Hono()

  // ── GET presigned upload URL (public — no auth required) ───────────
  // Used during onboarding (logo upload before account exists)
  // and by authenticated screens for product images etc.
  .post("/presign", zBody(presignSchema), async (c) => {
    const { folder, contentType } = c.req.valid("json") as {
      folder: AllowedFolder;
      contentType: AllowedContentType;
    };

    const key = generateKey(folder, contentType);
    const result = await getPresignedUploadUrl({ key, contentType });

    return c.json(result, 201);
  });

export default uploads;
