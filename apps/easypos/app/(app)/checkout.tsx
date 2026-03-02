import { useState } from "react";
import { View, Pressable, Alert, ScrollView } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { useAuthStore } from "@/store/auth";
import { useApiPost } from "@/hooks/use-api";
import { useRole } from "@/hooks/use-role";
import { formatCurrency, PAYMENT_METHOD_LABELS } from "@easypos/utils";
import type { Sale, PaymentMethod } from "@easypos/types";
import { cn } from "@/lib/utils";

const PAYMENT_METHODS: { value: PaymentMethod; icon: keyof typeof Ionicons.glyphMap }[] = [
    { value: "CASH", icon: "cash-outline" },
    { value: "MOBILE_MONEY", icon: "phone-portrait-outline" },
    { value: "CARD", icon: "card-outline" },
];

export default function CheckoutScreen() {
    const insets = useSafeAreaInsets();
    const params = useLocalSearchParams<{ cart: string }>();
    const user = useAuthStore((s) => s.user);

    const { canManage } = useRole();
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("CASH");
    const [amountTendered, setAmountTendered] = useState("");
    const [discount, setDiscount] = useState("");

    const cartItems: { productId: string; quantity: number }[] = params.cart
        ? JSON.parse(params.cart)
        : [];

    const { mutate: createSale, isPending } = useApiPost<Sale, {
        items: { productId: string; quantity: number }[];
        paymentMethod: PaymentMethod;
        discount?: number;
        amountTendered?: number;
    }>({
        path: "/sales",
        invalidateKeys: [["sales"], ["reports"]],
        onSuccess: (data) => {
            router.dismiss();
            router.push(`/(app)/sale/${data.id}`);
        },
        onError: (error) => {
            Alert.alert("Sale Failed", error.message);
        },
    });

    function handleComplete() {
        if (cartItems.length === 0) return;

        const body: Parameters<typeof createSale>[0] = {
            items: cartItems,
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
                    <Ionicons name="close" size={24} color="hsl(0 0% 63.9%)" />
                </Pressable>
                <Text className="text-foreground font-semibold text-lg flex-1">Checkout</Text>
            </View>

            <ScrollView className="flex-1 px-4" contentContainerStyle={{ paddingBottom: 20 }}>
                {/* Order summary */}
                <View className="mt-4 p-4 rounded-xl bg-card border border-border">
                    <Text className="text-foreground font-semibold text-base mb-3">Order Summary</Text>
                    <View className="flex-row justify-between">
                        <Text className="text-muted-foreground text-sm">
                            {cartItems.reduce((sum, i) => sum + i.quantity, 0)} items
                        </Text>
                    </View>
                </View>

                {/* Payment method */}
                <View className="mt-6">
                    <Text className="text-muted-foreground text-xs uppercase tracking-wider mb-3">
                        Payment Method
                    </Text>
                    <View className="flex-row gap-3">
                        {PAYMENT_METHODS.map((pm) => (
                            <Pressable
                                key={pm.value}
                                onPress={() => setPaymentMethod(pm.value)}
                                className={cn(
                                    "flex-1 items-center py-4 rounded-xl border",
                                    paymentMethod === pm.value
                                        ? "bg-primary/10 border-primary"
                                        : "bg-card border-border",
                                )}
                            >
                                <Ionicons
                                    name={pm.icon}
                                    size={24}
                                    color={
                                        paymentMethod === pm.value
                                            ? "hsl(142.1 76.2% 36.3%)"
                                            : "hsl(0 0% 45%)"
                                    }
                                />
                                <Text
                                    className={cn(
                                        "text-xs font-medium mt-1",
                                        paymentMethod === pm.value ? "text-primary" : "text-muted-foreground",
                                    )}
                                >
                                    {PAYMENT_METHOD_LABELS[pm.value]}
                                </Text>
                            </Pressable>
                        ))}
                    </View>
                </View>

                {/* Discount - only for admin/manager */}
                {canManage && (
                    <View className="mt-6">
                        <Text className="text-muted-foreground text-xs uppercase tracking-wider mb-2">
                            Discount Amount (optional)
                        </Text>
                        <Input
                            placeholder="0"
                            keyboardType="numeric"
                            value={discount}
                            onChangeText={setDiscount}
                            className="h-12 text-lg text-center bg-card"
                        />
                        {discount !== "" && parseFloat(discount) > 0 && (
                            <Text className="text-primary text-xs mt-1.5 text-center">
                                Discount applied: {formatCurrency(parseFloat(discount) || 0)}
                            </Text>
                        )}
                    </View>
                )}

                {/* Amount tendered - only for cash */}
                {paymentMethod === "CASH" && (
                    <View className="mt-6">
                        <Text className="text-muted-foreground text-xs uppercase tracking-wider mb-2">
                            Amount Tendered (optional)
                        </Text>
                        <Input
                            placeholder="0"
                            keyboardType="numeric"
                            value={amountTendered}
                            onChangeText={setAmountTendered}
                            className="h-12 text-lg text-center bg-card"
                        />
                    </View>
                )}
            </ScrollView>

            {/* Complete button */}
            <View
                className="px-4 py-3 bg-card border-t border-border"
                style={{ paddingBottom: insets.bottom + 12 }}
            >
                <Button
                    onPress={handleComplete}
                    disabled={isPending || cartItems.length === 0}
                    className="h-14 w-full"
                >
                    {isPending ? (
                        <Text className="text-primary-foreground font-bold text-lg">Processing...</Text>
                    ) : (
                        <View className="flex-row items-center gap-2">
                            <Ionicons name="checkmark-circle" size={22} color="hsl(0 0% 98%)" />
                            <Text className="text-primary-foreground font-bold text-lg">Complete Sale</Text>
                        </View>
                    )}
                </Button>
            </View>
        </View>
    );
}
