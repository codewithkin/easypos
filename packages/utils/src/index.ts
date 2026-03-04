// ── Currency Formatting ────────────────────────────────────────────

export function formatCurrency(amount: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-US").format(value);
}

// ── Date / Time Formatting ─────────────────────────────────────────

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(date));
}

export function formatTime(date: Date | string): string {
  return new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(date));
}

export function formatDateTime(date: Date | string): string {
  return `${formatDate(date)}, ${formatTime(date)}`;
}

export function formatRelativeTime(date: Date | string): string {
  const now = new Date();
  const then = new Date(date);
  const diffMs = now.getTime() - then.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffSec < 60) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  return formatDate(date);
}

export function getToday(): string {
  return new Date().toISOString().slice(0, 10);
}

export function getStartOfDay(date?: Date): Date {
  const d = date ? new Date(date) : new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export function getEndOfDay(date?: Date): Date {
  const d = date ? new Date(date) : new Date();
  d.setHours(23, 59, 59, 999);
  return d;
}

// ── Receipt Helpers ────────────────────────────────────────────────

export function generateReceiptNumber(): string {
  const now = new Date();
  const date = now.toISOString().slice(2, 10).replace(/-/g, "");
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `RCP-${date}-${rand}`;
}

export function generateSku(productName: string): string {
  const prefix = productName
    .toUpperCase()
    .replace(/[^A-Z0-9\s]/g, "")
    .trim()
    .split(/\s+/)
    .slice(0, 3)
    .map((w) => w.slice(0, 4))
    .join("-");
  const rand = Math.random().toString(36).substring(2, 5).toUpperCase();
  return `${prefix || "PROD"}-${rand}`;
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/--+/g, "-")
    .trim();
}

// ── Pagination Helpers ─────────────────────────────────────────────

export function getPaginationMeta(total: number, page: number, pageSize: number) {
  return {
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

export function getPaginationSkip(page: number, pageSize: number) {
  return (page - 1) * pageSize;
}

// ── Label Maps ─────────────────────────────────────────────────────

export const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Admin",
  MANAGER: "Manager",
  STAFF: "Staff",
};

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  CASH: "Cash",
  MOBILE_MONEY: "Mobile Money",
  SWIPE: "Swipe",
  CREDIT: "Credit",
};

export const SALE_STATUS_LABELS: Record<string, string> = {
  COMPLETED: "Completed",
  VOIDED: "Voided",
  REFUNDED: "Refunded",
};
