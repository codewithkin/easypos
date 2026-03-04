import { useState } from "react";
import { View, Pressable, ScrollView } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";

import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { useAuthStore } from "@/store/auth";
import { useApiPost } from "@/hooks/use-api";
import { useRole } from "@/hooks/use-role";
import { formatCurrency, PAYMENT_METHOD_LABELS } from "@easypos/utils";
import { toast } from "@/lib/toast";
import type { Sale, PaymentMethod } from "@easypos/types";
import { cn } from "@/lib/utils";
import { BRAND } from "@/lib/theme";

interface CartItem {
    productId: string;
    quantity: number;
    name?: string;
    price?: number;
}

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

export default function CheckoutScreen() {
    const insets = useSafeAreaInsets();
    const params = useLocalSearchParams<{ cart: string }>();
    const user = useAuthStore((s) => s.user);

    const { canManage } = useRole();
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("CASH");
    const [amountTendered, setAmountTendered] = useState("");
    const [discount, setDiscount] = useState("");

    const cartItems: CartItem[] = params.cart ? JSON.parse(params.cart) : [];

    const orderTotal = cartItems.reduce((sum, i) => sum + (i.price ?? 0) * i.quantity, 0);
    const discountAmount = parseFloat(discount) || 0;
    const finalTotal = Math.max(0, orderTotal - discountAmount);

    const { mutate: createSale, isPending } = useApiPost<Sale, {
        items: { productId: string; quantity: number }[];
        paymentMethod: PaymentMethod;
        discount?: number;
        amountTendered?: number;
    }>({
        path: "/sales",
        invalidateKeys: [["sales"], ["reports"]],
        onSuccess: (data) => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            toast.success("Sale Completed", "Receipt #" + (data.receiptNumber ?? ""));
            router.dismiss();
            router.push(`/(app)/sale/${data.id}`);
        },
        onError: (error) => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            toast.error("Sale Failed", error.message);
        },
    });

    function handleComplete() {
        if (cartItems.length === 0) return;

        const body: Parameters<typeof createSale>[0] = {
            items: cartItems.map((i) => ({ productId: i.productId, quantity: i.quantity })),
            paymentMethod,
        };

        if (canManage && discount) {
            body.discount = parseFloat(discount);
        }

        if (paymentMethod === "CASH" && amountTendered) {
            body.amountTendered = parseFloat(amountTendered);
        }

        createSale(body);
    }

    return (
        <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
            {/* Header */}
            <View className="flex-row items-center px-4 h-14 border-b border-border bg-card">
                <Pressable onPress={() => router.back()} className="mr-3">
                    <Ionicons name="close" size={24} color={BRAND.dark} />
                </Pressable>
                <Text className="text-foreground font-semibold text-lg flex-1">Checkout</Text>
            </View>

            <ScrollView className="flex-1 px-4" contentContainerStyle={{ paddingBottom: 20 }}>
                {/* ── Order Summary ── */}
                <View className="mt-4 rounded-2xl bg-card border border-border overflow-hidden">
                    <View className="px-4 pt-4 pb-2">
                        <Text className="text-foreground font-semibold text-sm">Order Summary</Text>
                    </View>
                    <Separator />
                    <View className="px-4 py-2 gap-0.5">
                        {cartItems.map((item) => (
                            <View key={item.productId} className="flex-row items-center justify-between py-1.5">
                                <View className="flex-1 mr-3">
                                    <Text className="text-foreground text-sm">{item.name ?? "Product"}</Text>
                                    <Text className="text-muted-foreground text-xs">
                                        {item.quantity} × {formatCurrency(item.price ?? 0, user?.org.currency)}
                                    </Text>
                                </View>
                                <Text className="text-foreground text-sm font-medium">
                                    {formatCurrency((item.price ?? 0) * item.quantity, user?.org.currency)}
                                </Text>
                            </View>
                        ))}
                    </View>
                    <Separator />
                    <View className="px-4 py-3 gap-1">
                        <View className="flex-row justify-between">
                            <Text className="text-muted-foreground text-sm">Subtotal</Text>
                            <Text className="text-foreground text-sm">
                                {formatCurrency(orderTotal, user?.org.currency)}
                            </Text>
                        </View>
                        {discountAmount > 0 && (
                            <View className="flex-row justify-between">
                                <Text className="text-muted-foreground text-sm">Discount</Text>
                                <Text className="text-destructive text-sm">
                                    -{formatCurrency(discountAmount, user?.org.currency)}
                                </Text>
                            </View>
                        )}
                        <View className="flex-row justify-between mt-1">
                            <Text className="text-foreground font-bold text-base">Total</Text>
                            <Text className="text-foreground font-bold text-base">
                                {formatCurrency(finalTotal, user?.org.currency)}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* ── Payment Method ── */}
                <View className="mt-5">
                    <Text className="text-muted-foreground text-xs uppercase tracking-wider mb-3">
                        Payment Method
                    </Text>
                    <View className="flex-row flex-wrap gap-3">
                        {PAYMENT_METHODS.map((pm) => {
                            const isActive = paymentMethod === pm.value;
                            return (
                                <Pressable
                                    key={pm.value}
                                    onPress={() => setPaymentMethod(pm.value)}
                                    className={cn(
                                        "w-[48%] items-center py-4 px-3 rounded-2xl border",
                                        isActive ? "bg-primary/10 border-primary" : "bg-card border-border",
                                    )}
                                >
                                    <Ionicons
                                        name={pm.icon}
                                        size={24}
                                        color={isActive ? BRAND.brand : BRAND.dark}
                                    />
                                    <Text className={cn(
                                        "text-sm font-semibold mt-2",
                                        isActive ? "text-primary" : "text-foreground",
                                    )}>
                                        {pm.label}
                                    </Text>
                                    {pm.subtitle && (
                                        <Text className="text-muted-foreground text-[10px] mt-0.5 text-center">
                                            {pm.subtitle}
                                        </Text>
                                    )}
                                </Pressable>
                            );
                        })}
                    </View>
                </View>

                {/* ── Credit notice ── */}
                {paymentMethod === "CREDIT" && (
                    <View className="mt-4 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30">
                        <View className="flex-row items-center gap-2">
                            <Ionicons name="warning-outline" size={18} color={BRAND.yellow} />
                            <Text className="text-amber-700 font-semibold text-sm">Credit Sale</Text>
                        </View>
                        <Text className="text-amber-700/80 text-xs mt-1">
                            This sale will be recorded as outstanding credit. Payment is expected later.
                        </Text>
                    </View>
                )}

                {/* ── Discount — admin/manager only ── */}
                {canManage && (
                    <View className="mt-5">
                        <Text className="text-muted-foreground text-xs uppercase tracking-wider mb-2">
                            Discount Amount (optional)
                        </Text>
                        <Input
                            placeholder="0.00"
                            keyboardType="numeric"
                            value={discount}
                            onChangeText={setDiscount}
                            className="h-12 bg-card"
                        />
                    </View>
                )}

                {/* ── Amount tendered — cash only ── */}
                {paymentMethod === "CASH" && (
                    <View className="mt-5">
                        <Text className="text-muted-foreground text-xs uppercase tracking-wider mb-2">
                            Amount Tendered (optional)
                        </Text>
                        <Input
                            placeholder="0.00"
                            keyboardType="numeric"
                            value={amountTendered}
                            onChangeText={setAmountTendered}
                            className="h-12 bg-card"
                        />
                        {amountTendered && parseFloat(amountTendered) > finalTotal && (
                            <Text className="text-primary text-xs mt-1.5">
                                Change: {formatCurrency(parseFloat(amountTendered) - finalTotal, user?.org.currency)}
                            </Text>
                        )}
                    </View>
                )}
            </ScrollView>

            {/* ── Complete button ── */}
            <View
                className="px-4 py-3 bg-card border-t border-border"
                style={{ paddingBottom: insets.bottom + 12 }}
            >
                <Button
                    onPress={handleComplete}
                    disabled={isPending || cartItems.length === 0}
                    className={cn("h-14 w-full", paymentMethod === "CREDIT" && "bg-amber-500")}
                >
                    {isPending ? (
                        <Text className="text-primary-foreground font-bold text-lg">Processing...</Text>
                    ) : (
                        <View className="flex-row items-center gap-2">
                            <Ionicons
                                name={paymentMethod === "CREDIT" ? "time" : "checkmark-circle"}
                                size={22}
                                color="hsl(0 0% 98%)"
                            />
                            <Text className="text-primary-foreground font-bold text-lg">
                                {paymentMethod === "CREDIT" ? "Record Credit Sale" : "Complete Sale"}
                            </Text>
                        </View>
                    )}
                </Button>
            </View>
        </View>
    );
}
