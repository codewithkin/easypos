import { create } from "zustand";
import type { Product, PaymentMethod } from "@easypos/types";

// ── Cart item ──────────────────────────────────────────────────────

export interface CartItem {
    product: Product;
    quantity: number;
}

// ── Customer selection ─────────────────────────────────────────────

export interface SaleCustomer {
    id?: string;           // undefined = new customer (will be created inline)
    name: string;
    phone?: string;
    gender?: "MALE" | "FEMALE" | "OTHER";
}

// ── Payment details ────────────────────────────────────────────────

export type BillDenomination = 1 | 2 | 5 | 10 | 20 | 50 | 100;

export interface PaymentDetails {
    method: PaymentMethod;
    bills: Record<BillDenomination, number>;   // e.g. { 1: 0, 5: 2, ... }
    note: string;
    discount: number;
    saveBalanceAsCredit: boolean;
}

// ── Sale wizard state ──────────────────────────────────────────────

export const SALE_STEPS = ["products", "customer", "payment", "summary"] as const;
export type SaleStep = (typeof SALE_STEPS)[number];

interface SaleState {
    // Step management
    step: number;                       // 0..3

    // Step 1: Products
    cart: CartItem[];

    // Step 2: Customer (optional)
    customer: SaleCustomer | null;

    // Step 3: Payment
    payment: PaymentDetails;

    // ── Derived (computed in selectors, but exposed for convenience) ──
    // Kept out of the store — callers compute from cart/payment.

    // ── Actions ────────────────────────────────────────────────────
    // Step
    nextStep: () => void;
    prevStep: () => void;
    goToStep: (step: number) => void;

    // Cart
    addToCart: (product: Product) => void;
    setQuantity: (productId: string, qty: number) => void;
    removeFromCart: (productId: string) => void;
    clearCart: () => void;

    // Customer
    setCustomer: (customer: SaleCustomer | null) => void;

    // Payment
    setPaymentMethod: (method: PaymentMethod) => void;
    setBillCount: (denom: BillDenomination, count: number) => void;
    setNote: (note: string) => void;
    setDiscount: (amount: number) => void;
    setSaveBalanceAsCredit: (value: boolean) => void;

    // Full reset (after sale completes)
    reset: () => void;
}

const INITIAL_BILLS: Record<BillDenomination, number> = {
    1: 0, 2: 0, 5: 0, 10: 0, 20: 0, 50: 0, 100: 0,
};

const INITIAL_PAYMENT: PaymentDetails = {
    method: "CASH",
    bills: { ...INITIAL_BILLS },
    note: "",
    discount: 0,
    saveBalanceAsCredit: false,
};

export const useSaleStore = create<SaleState>((set) => ({
    step: 0,
    cart: [],
    customer: null,
    payment: { ...INITIAL_PAYMENT },

    // ── Step navigation ────────────────────────────────────────────

    nextStep: () => set((s) => ({ step: Math.min(s.step + 1, SALE_STEPS.length - 1) })),
    prevStep: () => set((s) => ({ step: Math.max(s.step - 1, 0) })),
    goToStep: (step) => set({ step }),

    // ── Cart ───────────────────────────────────────────────────────

    addToCart: (product) =>
        set((s) => {
            const existing = s.cart.find((i) => i.product.id === product.id);
            if (existing) return s; // first tap adds, subsequent ignored
            return { cart: [...s.cart, { product, quantity: 1 }] };
        }),

    setQuantity: (productId, qty) =>
        set((s) => ({
            cart: qty <= 0
                ? s.cart.filter((i) => i.product.id !== productId)
                : s.cart.map((i) => (i.product.id === productId ? { ...i, quantity: qty } : i)),
        })),

    removeFromCart: (productId) =>
        set((s) => ({ cart: s.cart.filter((i) => i.product.id !== productId) })),

    clearCart: () => set({ cart: [] }),

    // ── Customer ───────────────────────────────────────────────────

    setCustomer: (customer) => set({ customer }),

    // ── Payment ────────────────────────────────────────────────────

    setPaymentMethod: (method) =>
        set((s) => ({
            payment: {
                ...s.payment,
                method,
                // Reset bills when switching away from CASH
                bills: method !== "CASH" ? { ...INITIAL_BILLS } : s.payment.bills,
                saveBalanceAsCredit: false,
            },
        })),

    setBillCount: (denom, count) =>
        set((s) => ({
            payment: {
                ...s.payment,
                bills: { ...s.payment.bills, [denom]: Math.max(0, count) },
            },
        })),

    setNote: (note) => set((s) => ({ payment: { ...s.payment, note } })),
    setDiscount: (amount) => set((s) => ({ payment: { ...s.payment, discount: Math.max(0, amount) } })),
    setSaveBalanceAsCredit: (value) => set((s) => ({ payment: { ...s.payment, saveBalanceAsCredit: value } })),

    // ── Reset ──────────────────────────────────────────────────────

    reset: () =>
        set({
            step: 0,
            cart: [],
            customer: null,
            payment: { ...INITIAL_PAYMENT },
        }),
}));

// ── Selectors (pure functions, not in the store) ───────────────────

export function cartTotal(cart: CartItem[]): number {
    return cart.reduce((sum, i) => sum + i.product.price * i.quantity, 0);
}

export function cartItemCount(cart: CartItem[]): number {
    return cart.reduce((sum, i) => sum + i.quantity, 0);
}

export function totalTendered(bills: Record<BillDenomination, number>): number {
    return (Object.entries(bills) as [string, number][]).reduce(
        (sum, [denom, count]) => sum + Number(denom) * count,
        0,
    );
}

export function changeDue(total: number, tendered: number): number {
    return Math.max(0, tendered - total);
}
