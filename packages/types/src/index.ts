import { z } from "zod";

// ── Enums ──────────────────────────────────────────────────────────

export const roleSchema = z.enum(["OWNER", "MANAGER", "CASHIER"]);
export type Role = z.infer<typeof roleSchema>;

export const paymentMethodSchema = z.enum(["CASH", "MOBILE_MONEY", "CARD"]);
export type PaymentMethod = z.infer<typeof paymentMethodSchema>;

export const saleStatusSchema = z.enum(["COMPLETED", "VOIDED", "REFUNDED"]);
export type SaleStatus = z.infer<typeof saleStatusSchema>;

// ── Entity Schemas ─────────────────────────────────────────────────

export const organizationSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  currency: z.string(),
  receiptHeader: z.string().nullable(),
  receiptFooter: z.string().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});
export type Organization = z.infer<typeof organizationSchema>;

export const branchSchema = z.object({
  id: z.string(),
  name: z.string(),
  address: z.string().nullable(),
  phone: z.string().nullable(),
  isActive: z.boolean(),
  orgId: z.string(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});
export type Branch = z.infer<typeof branchSchema>;

export const userSchema = z.object({
  id: z.string(),
  email: z.string(),
  name: z.string(),
  role: roleSchema,
  isActive: z.boolean(),
  orgId: z.string(),
  branchId: z.string().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});
export type User = z.infer<typeof userSchema>;

export const categorySchema = z.object({
  id: z.string(),
  name: z.string(),
  orgId: z.string(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});
export type Category = z.infer<typeof categorySchema>;

export const productSchema = z.object({
  id: z.string(),
  name: z.string(),
  sku: z.string(),
  barcode: z.string().nullable(),
  price: z.number(),
  cost: z.number().nullable(),
  isActive: z.boolean(),
  categoryId: z.string().nullable(),
  orgId: z.string(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});
export type Product = z.infer<typeof productSchema>;

export const saleItemSchema = z.object({
  id: z.string(),
  saleId: z.string(),
  productId: z.string(),
  productName: z.string(),
  quantity: z.number().int().positive(),
  unitPrice: z.number(),
  total: z.number(),
});
export type SaleItem = z.infer<typeof saleItemSchema>;

export const saleSchema = z.object({
  id: z.string(),
  receiptNumber: z.string(),
  subtotal: z.number(),
  tax: z.number(),
  total: z.number(),
  paymentMethod: paymentMethodSchema,
  status: saleStatusSchema,
  note: z.string().nullable(),
  cashierId: z.string(),
  branchId: z.string(),
  orgId: z.string(),
  deviceId: z.string().nullable(),
  items: z.array(saleItemSchema).optional(),
  createdAt: z.coerce.date(),
});
export type Sale = z.infer<typeof saleSchema>;

export const deviceSchema = z.object({
  id: z.string(),
  name: z.string(),
  deviceIdentifier: z.string(),
  branchId: z.string(),
  lastSeenAt: z.coerce.date().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});
export type Device = z.infer<typeof deviceSchema>;

// ── Auth User (with org + branch embedded) ─────────────────────────

export const authUserSchema = userSchema.extend({
  org: organizationSchema.pick({ id: true, name: true, slug: true, currency: true }),
  branch: branchSchema.pick({ id: true, name: true }).nullable(),
});
export type AuthUser = z.infer<typeof authUserSchema>;

// ── API Request Schemas ────────────────────────────────────────────

export const loginRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});
export type LoginRequest = z.infer<typeof loginRequestSchema>;

export const registerRequestSchema = z.object({
  orgName: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(2),
});
export type RegisterRequest = z.infer<typeof registerRequestSchema>;

export const refreshTokenRequestSchema = z.object({
  refreshToken: z.string(),
});
export type RefreshTokenRequest = z.infer<typeof refreshTokenRequestSchema>;

export const forgotPasswordRequestSchema = z.object({
  email: z.string().email(),
});
export type ForgotPasswordRequest = z.infer<typeof forgotPasswordRequestSchema>;

export const resetPasswordRequestSchema = z.object({
  email: z.string().email(),
  code: z.string().min(6).max(6),
  newPassword: z.string().min(6),
});
export type ResetPasswordRequest = z.infer<typeof resetPasswordRequestSchema>;

export const createBranchRequestSchema = z.object({
  name: z.string().min(1),
  address: z.string().optional(),
  phone: z.string().optional(),
});
export type CreateBranchRequest = z.infer<typeof createBranchRequestSchema>;

export const updateBranchRequestSchema = createBranchRequestSchema.partial().extend({
  isActive: z.boolean().optional(),
});
export type UpdateBranchRequest = z.infer<typeof updateBranchRequestSchema>;

export const createUserRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(2),
  role: roleSchema,
  branchId: z.string().optional(),
});
export type CreateUserRequest = z.infer<typeof createUserRequestSchema>;

export const updateUserRequestSchema = z.object({
  name: z.string().min(2).optional(),
  role: roleSchema.optional(),
  branchId: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
});
export type UpdateUserRequest = z.infer<typeof updateUserRequestSchema>;

export const createCategoryRequestSchema = z.object({
  name: z.string().min(1),
});
export type CreateCategoryRequest = z.infer<typeof createCategoryRequestSchema>;

export const createProductRequestSchema = z.object({
  name: z.string().min(1),
  sku: z.string().min(1),
  barcode: z.string().optional(),
  price: z.number().positive(),
  cost: z.number().positive().optional(),
  categoryId: z.string().optional(),
  isActive: z.boolean().optional(),
});
export type CreateProductRequest = z.infer<typeof createProductRequestSchema>;

export const updateProductRequestSchema = createProductRequestSchema.partial();
export type UpdateProductRequest = z.infer<typeof updateProductRequestSchema>;

export const createSaleRequestSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.string(),
        quantity: z.number().int().positive(),
      }),
    )
    .min(1),
  paymentMethod: paymentMethodSchema,
  tax: z.number().min(0).optional(),
  note: z.string().optional(),
  deviceId: z.string().optional(),
});
export type CreateSaleRequest = z.infer<typeof createSaleRequestSchema>;

export const voidSaleRequestSchema = z.object({
  reason: z.string().min(1),
});
export type VoidSaleRequest = z.infer<typeof voidSaleRequestSchema>;

// ── API Response Schemas ───────────────────────────────────────────

export const authResponseSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  user: authUserSchema,
});
export type AuthResponse = z.infer<typeof authResponseSchema>;

export const messageResponseSchema = z.object({
  message: z.string(),
});
export type MessageResponse = z.infer<typeof messageResponseSchema>;

export const apiErrorSchema = z.object({
  error: z.string(),
  details: z.unknown().optional(),
});
export type ApiErrorResponse = z.infer<typeof apiErrorSchema>;

// ── Pagination ─────────────────────────────────────────────────────

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  pageSize: z.coerce.number().int().positive().max(100).optional().default(20),
  search: z.string().optional(),
});
export type PaginationQuery = z.infer<typeof paginationQuerySchema>;

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// ── Report Types ───────────────────────────────────────────────────

export const dailySummarySchema = z.object({
  date: z.string(),
  totalRevenue: z.number(),
  totalTransactions: z.number(),
  averageTicket: z.number(),
  byPaymentMethod: z.array(
    z.object({
      method: paymentMethodSchema,
      count: z.number(),
      total: z.number(),
    }),
  ),
  topProducts: z.array(
    z.object({
      productId: z.string(),
      productName: z.string(),
      quantity: z.number(),
      revenue: z.number(),
    }),
  ),
});
export type DailySummary = z.infer<typeof dailySummarySchema>;
