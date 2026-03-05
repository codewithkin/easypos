import { useState } from "react";
import {
    View,
    ScrollView,
    Pressable,
    TextInput,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { Text } from "@/components/ui/text";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { BillCounter, computeTendered } from "@/components/bill-counter";
import {
    useSaleStore,
    cartTotal,
    totalTendered,
    changeDue,
} from "@/store/sale";
import { useRole } from "@/hooks/use-role";
import { cn } from "@/lib/utils";
import { BRAND } from "@/lib/theme";
import { formatCurrency, PAYMENT_METHOD_LABELS } from "@easypos/utils";
import type { PaymentMethod } from "@easypos/types";

const PAYMENT_METHODS: {
    value: PaymentMethod;
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
    subtitle?: string;
}[] = [
        { value: "CASH", icon: "cash-outline", label: "Cash" },
        { value: "MOBILE_MONEY", icon: "phone-portrait-outline", label: "Mobile Money", subtitle: "Ecocash · OneMoney" },
        { value: "SWIPE", icon: "card-outline", label: "Swipe" },
        { value: "CREDIT", icon: "time-outline", label: "Credit" },
    ];

/** Step 3 — Payment method, bill counter, discount, note */
export function PaymentStep() {
    const {
        cart,
        payment,
        setPaymentMethod,
        setBillCount,
        setNote,
        setDiscount,
        setSaveBalanceAsCredit,
    } = useSaleStore();
    const { canManage } = useRole();

    const [discountInput, setDiscountInput] = useState(
        payment.discount > 0 ? String(payment.discount) : "",
    );

    const subtotal = cartTotal(cart);
    const discountAmount = parseFloat(discountInput) || 0;
    const finalTotal = Math.max(0, subtotal - discountAmount);
    const tendered = totalTendered(payment.bills);
    const change = changeDue(finalTotal, tendered);
    const isCash = payment.method === "CASH";
    const isCredit = payment.method === "CREDIT";
    const shortfall = finalTotal - tendered;
    const isUnderpaid = isCash && tendered > 0 && tendered < finalTotal;

    function handleDiscountChange(val: string) {
        setDiscountInput(val);
        const parsed = parseFloat(val);
        setDiscount(isNaN(parsed) ? 0 : parsed);
    }

    return (
        <ScrollView
            className="flex-1"
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingBottom: 120 }}
        >
            <View className="px-4 py-4 gap-5">
                {/* Order total */}
                <View className="flex-row justify-between items-center px-4 py-3.5 bg-card border border-border rounded-xl">
                    <Text className="text-muted-foreground text-sm">Order total</Text>
                    <Text className="text-foreground font-bold text-lg">
                        {formatCurrency(finalTotal)}
                    </Text>
                </View>

                {/* Payment method selector */}
                <View className="gap-2">
                    <Text className="text-muted-foreground text-xs uppercase tracking-wider">
                        Payment method
                    </Text>
                    <View className="gap-2">
                        {PAYMENT_METHODS.map((pm) => {
                            const selected = payment.method === pm.value;
                            return (
                                <Pressable
                                    key={pm.value}
                                    onPress={() => {
                                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                        setPaymentMethod(pm.value);
                                    }}
                                    className={cn(
                                        "flex-row items-center gap-3 px-4 py-3.5 rounded-xl border",
                                        selected
                                            ? "bg-primary/5 border-primary"
                                            : "bg-card border-border",
                                    )}
                                >
                                    <View className={cn(
                                        "w-9 h-9 rounded-full items-center justify-center",
                                        selected ? "bg-primary" : "bg-secondary",
                                    )}>
                                        <Ionicons
                                            name={pm.icon}
                                            size={18}
                                            color={selected ? "white" : BRAND.dark}
                                        />
                                    </View>
                                    <View className="flex-1">
                                        <Text className={cn(
                                            "font-semibold text-sm",
                                            selected ? "text-primary" : "text-foreground",
                                        )}>
                                            {pm.label}
                                        </Text>
                                        {pm.subtitle && (
                                            <Text className="text-muted-foreground text-xs">
                                                {pm.subtitle}
                                            </Text>
                                        )}
                                    </View>
                                    {selected && (
                                        <Ionicons name="checkmark-circle" size={20} color={BRAND.brand} />
                                    )}
                                </Pressable>
                            );
                        })}
                    </View>
                </View>

                {/* Credit warning */}
                {isCredit && (
                    <View className="flex-row gap-3 p-3.5 rounded-xl bg-amber-50 border border-amber-200">
                        <Ionicons name="warning-outline" size={18} color="#B45309" />
                        <Text className="text-amber-800 text-xs flex-1 leading-5">
                            This sale will be recorded as a credit. Make sure you have
                            the customer's details before completing.
                        </Text>
                    </View>
                )}

                {/* Cash: bill counter */}
                {isCash && (
                    <View className="gap-3">
                        <Text className="text-muted-foreground text-xs uppercase tracking-wider">
                            Cash tendered
                        </Text>
                        <BillCounter
                            bills={payment.bills}
                            onChange={setBillCount}
                        />

                        {/* Change / underpaid summary */}
                        {tendered > 0 && (
                            <View className={cn(
                                "flex-row justify-between items-center px-4 py-3 rounded-xl border",
                                change > 0
                                    ? "bg-green-50 border-green-200"
                                    : isUnderpaid
                                        ? "bg-red-50 border-red-200"
                                        : "bg-card border-border",
                            )}>
                                <Text className={cn(
                                    "text-sm font-semibold",
                                    change > 0
                                        ? "text-green-700"
                                        : isUnderpaid
                                            ? "text-red-600"
                                            : "text-foreground",
                                )}>
                                    {change > 0
                                        ? "Change"
                                        : isUnderpaid
                                            ? `Short by ${formatCurrency(shortfall)}`
                                            : "Exact change"}
                                </Text>
                                {change > 0 && (
                                    <Text className="text-green-700 font-bold text-base">
                                        {formatCurrency(change)}
                                    </Text>
                                )}
                            </View>
                        )}

                        {/* Save-as-credit checkbox when underpaid */}
                        {isUnderpaid && (
                            <Pressable
                                onPress={() => {
                                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                    setSaveBalanceAsCredit(!payment.saveBalanceAsCredit);
                                }}
                                className="flex-row items-center gap-3 px-4 py-3.5 rounded-xl bg-amber-50 border border-amber-200"
                            >
                                <View className={cn(
                                    "w-5 h-5 rounded border-2 items-center justify-center",
                                    payment.saveBalanceAsCredit
                                        ? "bg-amber-600 border-amber-600"
                                        : "border-amber-400 bg-transparent",
                                )}>
                                    {payment.saveBalanceAsCredit && (
                                        <Ionicons name="checkmark" size={12} color="white" />
                                    )}
                                </View>
                                <Text className="text-amber-800 text-sm flex-1">
                                    Save {formatCurrency(shortfall)} balance as credit
                                </Text>
                            </Pressable>
                        )}
                    </View>
                )}

                <Separator />

                {/* Discount (managers only) */}
                {canManage && (
                    <View className="gap-1.5">
                        <Label nativeID="discount-input">Discount ($)</Label>
                        <Input
                            id="discount-input"
                            placeholder="0.00"
                            value={discountInput}
                            onChangeText={handleDiscountChange}
                            keyboardType="decimal-pad"
                            className="h-11"
                        />
                        {discountAmount > 0 && (
                            <Text className="text-xs text-muted-foreground">
                                Total after discount:{" "}
                                <Text className="font-semibold text-foreground">
                                    {formatCurrency(finalTotal)}
                                </Text>
                            </Text>
                        )}
                    </View>
                )}

                {/* Note */}
                <View className="gap-1.5">
                    <Label nativeID="note-input">Note (optional)</Label>
                    <View className="bg-secondary rounded-xl border border-border px-3 py-2 min-h-[80px]">
                        <TextInput
                            id="note-input"
                            placeholder="Add a note for this sale..."
                            placeholderTextColor={BRAND.dark}
                            value={payment.note}
                            onChangeText={setNote}
                            multiline
                            textAlignVertical="top"
                            className="text-foreground text-sm flex-1"
                        />
                    </View>
                </View>
            </View>
        </ScrollView>
    );
}

/**
 * Returns true when it's safe to proceed past the payment step.
 * - Not cash → always OK
 * - Cash → underpaid only allowed if saveBalanceAsCredit is checked
 */
export function paymentStepValid(
    method: PaymentMethod,
    tendered: number,
    finalTotal: number,
    saveBalanceAsCredit: boolean,
): boolean {
    if (method !== "CASH") return true;
    if (tendered >= finalTotal) return true;
    if (tendered === 0) return true; // user hasn't entered anything yet — allow proceeding (manual override)
    return saveBalanceAsCredit;
}
