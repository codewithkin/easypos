import { validator } from "hono/validator";
import type { z } from "zod";

export function zBody<T extends z.ZodType>(schema: T) {
  return validator("json" as const, (value, c) => {
    const result = schema.safeParse(value);
    if (!result.success) {
      return c.json(
        { error: "Validation failed", details: result.error.issues },
        400 as const,
      );
    }
    return result.data as z.infer<T>;
  });
}

export function zQuery<T extends z.ZodType>(schema: T) {
  return validator("query" as const, (value, c) => {
    const result = schema.safeParse(value);
    if (!result.success) {
      return c.json(
        { error: "Validation failed", details: result.error.issues },
        400 as const,
      );
    }
    return result.data as z.infer<T>;
  });
}
