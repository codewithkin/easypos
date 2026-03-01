import type { Context } from "hono";

export class AppError extends Error {
  constructor(
    public status: number,
    message: string,
    public details?: unknown,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export function notFound(resource = "Resource"): AppError {
  return new AppError(404, `${resource} not found`);
}

export function unauthorized(message = "Unauthorized"): AppError {
  return new AppError(401, message);
}

export function forbidden(message = "Forbidden"): AppError {
  return new AppError(403, message);
}

export function conflict(message: string): AppError {
  return new AppError(409, message);
}

export function badRequest(message: string, details?: unknown): AppError {
  return new AppError(400, message, details);
}

export function handleError(err: unknown, c: Context) {
  if (err instanceof AppError) {
    return c.json(
      { error: err.message, ...(err.details ? { details: err.details } : {}) },
      err.status as 400,
    );
  }

  console.error("[Server Error]", err);
  return c.json({ error: "Internal server error" }, 500);
}
