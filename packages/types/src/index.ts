import { z } from "zod";

// ── Enums ──────────────────────────────────────────────────────────

export const roleSchema = z.enum(["ADMIN", "MANAGER", "STAFF"]);
export type Role = z.infer<typeof roleSchema>;

export const paymentMethodSchema = z.enum(["CASH", "MOBILE_MONEY", "SWIPE", "CREDIT"]);
export type PaymentMethod = z.infer<typeof paymentMethodSchema>;

export const saleStatusSchema = z.enum(["COMPLETED", "VOIDED", "REFUNDED"]);
export type SaleStatus = z.infer<typeof saleStatusSchema>;

export const planSchema = z.enum(["none", "starter", "growth", "enterprise"]);
export type Plan = z.infer<typeof planSchema>;

// ── Plan Limits & Billing Constants ────────────────────────────────

export const PLAN_LIMITS = {
  none: { users: 1, monthlyInvoices: 0, products: 0, categories: 0, branches: 0, price: 0 },
  starter: { users: 5, monthlyInvoices: 1000, products: 300, categories: 50, branches: 1, price: 49 },
  growth: { users: 12, monthlyInvoices: 2500, products: 700, categories: 150, branches: 3, price: 99 },
  enterprise: { users: 20, monthlyInvoices: 10000, products: 1850, categories: 500, branches: 10, price: 249 },
} as const;

export type PlanLimits = (typeof PLAN_LIMITS)[Plan];

export const OVERAGE_RATE = 0.02; // USD per overage unit

// ── Entity Schemas ─────────────────────────────────────────────────

export const organizationSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  currency: z.string(),
  logoUrl: z.string().nullable(),
  receiptHeader: z.string().nullable(),
  receiptFooter: z.string().nullable(),
  plan: planSchema,
  maxUsers: z.number(),
  maxMonthlyInvoices: z.number(),
  maxProducts: z.number(),
  maxCategories: z.number(),
  maxBranches: z.number(),
  currentMonthInvoices: z.number(),
  currentMonthOverageInvoices: z.number(),
  currentMonthOverageProducts: z.number(),
  currentMonthOverageCategories: z.number(),
  pendingOverageCharges: z.number(),
  billingCycleStart: z.coerce.date(),
  nextBillingDate: z.coerce.date(),
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

export const tagSchema = z.object({
  id: z.string(),
  name: z.string(),
  orgId: z.string(),
  createdAt: z.coerce.date(),
});
export type Tag = z.infer<typeof tagSchema>;

export const productSchema = z.object({
  id: z.string(),
  name: z.string(),
  sku: z.string(),
  imageUrl: z.string().nullable().optional(),
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
  subtotal: z.number(), // alias of total column
  total: z.number(),
});
export type SaleItem = z.infer<typeof saleItemSchema>;

export const saleSchema = z.object({
  id: z.string(),
  receiptNumber: z.string(),
  subtotal: z.number(),
  discount: z.number(),
  tax: z.number(),
  total: z.number(),
  amountTendered: z.number().nullable(),
  change: z.number().nullable(),
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
  org: organizationSchema.pick({
    id: true, name: true, slug: true, currency: true, logoUrl: true,
    plan: true, maxUsers: true, maxMonthlyInvoices: true, maxProducts: true,
    maxCategories: true, maxBranches: true, currentMonthInvoices: true,
    pendingOverageCharges: true, billingCycleStart: true, nextBillingDate: true,
  }),
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
  logoUrl: z.string().url().optional(),
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
  role: z.enum(["MANAGER", "STAFF"]),
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

export const inviteUserRequestSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2),
  role: z.enum(["MANAGER", "STAFF"]),
  branchId: z.string().optional(),
});
export type InviteUserRequest = z.infer<typeof inviteUserRequestSchema>;

export const createCategoryRequestSchema = z.object({
  name: z.string().min(1),
});
export type CreateCategoryRequest = z.infer<typeof createCategoryRequestSchema>;

export const createProductRequestSchema = z.object({
  name: z.string().min(1),
  imageUrl: z.string().url().optional(),
  price: z.number().positive(),
  cost: z.number().nonnegative().optional(),
  categoryId: z.string().optional(),
  isActive: z.boolean().optional(),
  tagIds: z.array(z.string()).optional(),
});
export type CreateProductRequest = z.infer<typeof createProductRequestSchema>;

// On update, sku is editable; image, cost, etc. are optional
export const updateProductRequestSchema = createProductRequestSchema.extend({
  sku: z.string().min(1).optional(),
}).partial();
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
  customerId: z.string().optional(),
  tax: z.number().min(0).optional(),
  discount: z.number().min(0).optional(),
  amountTendered: z.number().positive().optional(),
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
  pageSize: z.coerce.number().int().positive().max(200).optional().default(20),
  search: z.string().optional(),
  active: z.coerce.boolean().optional(),
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

// ── Billing / Subscription Types ───────────────────────────────────

export const intermediatePaymentSchema = z.object({
  id: z.string(),
  planName: z.string(),
  amount: z.number(),
  currency: z.string(),
  pollUrl: z.string().nullable(),
  paid: z.boolean(),
  failureReason: z.string().nullable(),
  userId: z.string(),
  orgId: z.string(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});
export type IntermediatePayment = z.infer<typeof intermediatePaymentSchema>;

export const createIntermediatePaymentRequestSchema = z.object({
  plan: planSchema,
});
export type CreateIntermediatePaymentRequest = z.infer<typeof createIntermediatePaymentRequestSchema>;

export const billingUsageSchema = z.object({
  plan: planSchema,
  limits: z.object({
    users: z.number(),
    monthlyInvoices: z.number(),
    products: z.number(),
    categories: z.number(),
    branches: z.number(),
  }),
  usage: z.object({
    users: z.number(),
    monthlyInvoices: z.number(),
    products: z.number(),
    categories: z.number(),
    branches: z.number(),
  }),
  pendingOverageCharges: z.number(),
  nextBillingDate: z.coerce.date(),
  billingCycleStart: z.coerce.date(),
});
export type BillingUsage = z.infer<typeof billingUsageSchema>;
