import { View, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { Text } from "@/components/ui/text";
import { Separator } from "@/components/ui/separator";
import {
    useSaleStore,
    cartTotal,
    totalTendered,
    changeDue,
} from "@/store/sale";
import { computeTendered } from "@/components/bill-counter";
import { formatCurrency, PAYMENT_METHOD_LABELS } from "@easypos/utils";
import { BRAND } from "@/lib/theme";
import { cn } from "@/lib/utils";

const GENDER_LABELS: Record<string, string> = {
    MALE: "Male",
    FEMALE: "Female",
};

/** Step 4 — Full sale summary before confirming */
export function SummaryStep() {
    const { cart, customer, payment } = useSaleStore();

    const subtotal = cartTotal(cart);
    const discountAmount = payment.discount;
    const finalTotal = Math.max(0, subtotal - discountAmount);
    const tendered = totalTendered(payment.bills);
    const change = changeDue(finalTotal, tendered);
    const isCash = payment.method === "CASH";
    const isCredit = payment.method === "CREDIT";

    return (
        <ScrollView
            className="flex-1"
            contentContainerStyle={{ paddingBottom: 140 }}
        >
            <View className="px-4 py-4 gap-4">
                {/* ── Cart items with brand accent ─────────────────────────────────────────── */}
                <SectionHeader icon="cart-outline" title="Items" />
                <View className="bg-card border-2 border-primary/30 rounded-xl overflow-hidden">
                    {cart.map((item, idx) => (
                        <View key={item.product.id}>
                            {idx > 0 && <Separator />}
                            <View className="flex-row items-center gap-3 px-4 py-3">
                                <View className="flex-1">
                                    <Text className="text-foreground text-sm font-medium">{item.product.name}</Text>
                                    {item.product.sku && (
                                        <Text className="text-muted-foreground text-xs">{item.product.sku}</Text>
                                    )}
                                </View>
                                <View className="items-end">
                                    <Text className="text-primary text-sm font-bold">
                                        {formatCurrency(item.product.price * item.quantity)}
                                    </Text>
                                    <Text className="text-muted-foreground text-xs">
                                        {item.quantity} × {formatCurrency(item.product.price)}
                                    </Text>
                                </View>
                            </View>
                        </View>
                    ))}

                    {/* Subtotal / Discount / Total with brand colors */}
                    <Separator />
                    {discountAmount > 0 && (
                        <>
                            <View className="flex-row justify-between px-4 py-2">
                                <Text className="text-muted-foreground text-sm">Subtotal</Text>
                                <Text className="text-foreground text-sm">{formatCurrency(subtotal)}</Text>
                            </View>
                            <View className="flex-row justify-between px-4 py-2 bg-yellow-50">
                                <Text className="text-yellow-900 text-sm font-semibold">Discount</Text>
                                <Text className="text-yellow-900 text-sm font-semibold">−{formatCurrency(discountAmount)}</Text>
                            </View>
                            <Separator />
                        </>
                    )}
                    <View className="flex-row justify-between px-4 py-3 bg-gradient-to-r from-primary/5 to-transparent">
                        <Text className="text-foreground font-bold text-sm">Total</Text>
                        <Text className="text-foreground font-bold text-base">
                            {formatCurrency(finalTotal)}
                        </Text>
                    </View>
                </View>

                {/* ── Customer ──────────────────────────────────────────── */}
                <SectionHeader icon="person-outline" title="Customer" />
                <View className="bg-card border border-border rounded-xl overflow-hidden">
                    {customer ? (
                        <View className="flex-row items-center gap-3 px-4 py-3.5">
                            <View className="w-9 h-9 rounded-full bg-primary items-center justify-center">
                                <Text className="text-primary-foreground font-bold text-sm">
                                    {customer.name[0].toUpperCase()}
                                </Text>
                            </View>
                            <View className="flex-1">
                                <Text className="text-foreground font-semibold text-sm">
                                    {customer.name}
                                    {!customer.id && (
                                        <Text className="text-xs text-muted-foreground font-normal"> (new)</Text>
                                    )}
                                </Text>
                                {customer.phone && (
                                    <Text className="text-muted-foreground text-xs">{customer.phone}</Text>
                                )}
                                {customer.gender && (
                                    <Text className="text-muted-foreground text-xs">
                                        {GENDER_LABELS[customer.gender]}
                                    </Text>
                                )}
                            </View>
                        </View>
                    ) : (
                        <View className="flex-row items-center gap-3 px-4 py-3.5">
                            <Ionicons name="person-outline" size={18} color={BRAND.mid} />
                            <Text className="text-muted-foreground text-sm">Walk-in / no customer</Text>
                        </View>
                    )}
                </View>

                {/* ── Payment ───────────────────────────────────────────── */}
                <SectionHeader icon="wallet-outline" title="Payment" />
                <View className="bg-card border border-border rounded-xl overflow-hidden">
                    <Row label="Method" value={PAYMENT_METHOD_LABELS[payment.method]} />

                    {isCash && tendered > 0 && (
                        <>
                            <Separator />
                            <Row label="Tendered" value={formatCurrency(tendered)} />
                            {change > 0 && (
                                <>
                                    <Separator />
                                    <Row
                                        label="Change"
                                        value={formatCurrency(change)}
                                        valueClass="text-green-700 font-semibold"
                                    />
                                </>
                            )}
                            {payment.saveBalanceAsCredit && tendered < finalTotal && (
                                <>
                                    <Separator />
                                    <Row
                                        label="Balance (credit)"
                                        value={formatCurrency(finalTotal - tendered)}
                                        valueClass="text-amber-700 font-semibold"
                                    />
                                </>
                            )}
                        </>
                    )}

                    {isCredit && (
                        <>
                            <Separator />
                            <View className="flex-row gap-2 px-4 py-3 bg-amber-50">
                                <Ionicons name="warning-outline" size={16} color="#B45309" />
                                <Text className="text-amber-800 text-xs flex-1">
                                    Recorded as credit — payment due from customer.
                                </Text>
                            </View>
                        </>
                    )}

                    {payment.note.trim().length > 0 && (
                        <>
                            <Separator />
                            <View className="px-4 py-3">
                                <Text className="text-xs text-muted-foreground mb-0.5">Note</Text>
                                <Text className="text-foreground text-sm">{payment.note.trim()}</Text>
                            </View>
                        </>
                    )}
                </View>
            </View>
        </ScrollView>
    );
}

// ── Helpers ─────────────────────────────────────────────────────────

function SectionHeader({ icon, title }: { icon: keyof typeof Ionicons.glyphMap; title: string }) {
    return (
        <View className="flex-row items-center gap-2 mt-1">
            <Ionicons name={icon} size={16} color={BRAND.dark} />
            <Text className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">
                {title}
            </Text>
        </View>
    );
}

function Row({
    label,
    value,
    valueClass,
}: {
    label: string;
    value: string;
    valueClass?: string;
}) {
    return (
        <View className="flex-row justify-between items-center px-4 py-3">
            <Text className="text-muted-foreground text-sm">{label}</Text>
            <Text className={cn("text-foreground text-sm", valueClass)}>{value}</Text>
        </View>
    );
}
