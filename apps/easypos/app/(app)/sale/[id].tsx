import { View, ScrollView, Alert, Pressable } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuthStore } from "@/store/auth";
import { useApiQuery, useApiPost } from "@/hooks/use-api";
import {
    formatCurrency,
    formatDateTime,
    PAYMENT_METHOD_LABELS,
    SALE_STATUS_LABELS,
    ROLE_LABELS,
} from "@easypos/utils";
import type { Sale, SaleItem } from "@easypos/types";
import { cn } from "@/lib/utils";

type SaleDetail = Sale & {
    items: (SaleItem & { product?: { name: string } })[];
    cashier: { id: string; name: string; role: string };
    branch: { id: string; name: string };
};

export default function SaleDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const insets = useSafeAreaInsets();
    const user = useAuthStore((s) => s.user);

    const { data: sale, isLoading } = useApiQuery<SaleDetail>({
        queryKey: ["sale", id],
        path: `/sales/${id}`,
    });

    const { mutate: voidSale, isPending: voiding } = useApiPost<
        Sale,
        { reason: string }
    >({
        path: `/sales/${id}/void`,
        invalidateKeys: [["sales"], ["sale", id], ["reports"]],
        onSuccess: () => {
            Alert.alert("Voided", "Sale has been voided.");
        },
        onError: (err) => Alert.alert("Error", err.message),
    });

    const { mutate: printReceipt } = useApiPost<unknown, Record<string, never>>({
        path: `/sales/${id}/print`,
        onError: (err) => Alert.alert("Error", err.message),
    });

    const canVoid =
        sale?.status === "COMPLETED" && (user?.role === "ADMIN" || user?.role === "MANAGER");
    function handleVoid() {
        Alert.alert("Void Sale", "This action cannot be undone. Continue?", [
            { text: "Cancel", style: "cancel" },
            {
                text: "Void",
                style: "destructive",
                onPress: () => voidSale({ reason: "Voided by " + user?.name }),
            },
        ]);
    }

    function handleNewSale() {
        router.dismissAll();
        router.replace("/(app)/(tabs)");
    }

    if (isLoading) {
        return (
            <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
                <View className="px-4 py-6 gap-4">
                    <Skeleton className="h-8 w-48" />
                    <Skeleton className="h-32 rounded-xl" />
                    <Skeleton className="h-48 rounded-xl" />
                </View>
            </View>
        );
    }

    if (!sale) {
        return (
            <View className="flex-1 bg-background items-center justify-center">
                <Ionicons name="alert-circle-outline" size={48} color="hsl(0 0% 45%)" />
                <Text className="text-muted-foreground mt-3">Sale not found</Text>
                <Button onPress={() => router.back()} className="mt-4">
                    <Text className="text-primary-foreground">Go Back</Text>
                </Button>
            </View>
        );
    }

    const statusColor =
        sale.status === "COMPLETED" ? "text-primary" : "text-destructive";

    return (
        <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
            {/* Header */}
            <View className="flex-row items-center px-4 h-14 border-b border-border bg-card">
                <Pressable onPress={() => router.back()} className="mr-3">
                    <Ionicons name="arrow-back" size={24} color="hsl(0 0% 63.9%)" />
                </Pressable>
                <Text className="text-foreground font-semibold text-lg flex-1">Receipt</Text>
                {canVoid && (
                    <Pressable onPress={handleVoid} disabled={voiding}>
                        <Text className="text-destructive font-medium text-sm">
                            {voiding ? "Voiding..." : "Void"}
                        </Text>
                    </Pressable>
                )}
            </View>

            <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 40 }}>
                {/* Receipt card */}
                <View className="mx-4 mt-4 p-5 rounded-xl bg-card border border-border">
                    {/* Receipt header */}
                    <View className="items-center mb-4">
                        <Text className="text-foreground font-bold text-lg">
                            {user?.org.name ?? "EasyPOS"}
                        </Text>
                        <Text className="text-muted-foreground text-xs">{sale.branch.name}</Text>
                        <Text className="text-muted-foreground text-xs mt-1">
                            {formatDateTime(sale.createdAt)}
                        </Text>
                    </View>

                    <Separator />

                    {/* Status + receipt number */}
                    <View className="flex-row items-center justify-between py-3">
                        <Text className="text-muted-foreground text-xs">Receipt #</Text>
                        <Text className="text-foreground font-mono text-xs">{sale.receiptNumber}</Text>
                    </View>
                    <View className="flex-row items-center justify-between pb-3">
                        <Text className="text-muted-foreground text-xs">Status</Text>
                        <Text className={cn("font-medium text-xs", statusColor)}>
                            {SALE_STATUS_LABELS[sale.status]}
                        </Text>
                    </View>

                    <Separator />

                    {/* Items */}
                    <View className="py-3 gap-2">
                        {sale.items.map((item) => (
                            <View key={item.id} className="flex-row items-start justify-between">
                                <View className="flex-1 mr-2">
                                    <Text className="text-foreground text-sm">{item.productName}</Text>
                                    <Text className="text-muted-foreground text-xs">
                                        {item.quantity} × {formatCurrency(item.unitPrice, user?.org.currency)}
                                    </Text>
                                </View>
                                <Text className="text-foreground font-medium text-sm">
                                    {formatCurrency(item.subtotal, user?.org.currency)}
                                </Text>
                            </View>
                        ))}
                    </View>

                    <Separator />

                    {/* Totals */}
                    <View className="pt-3 gap-1">
                        <View className="flex-row justify-between">
                            <Text className="text-muted-foreground text-sm">Subtotal</Text>
                            <Text className="text-foreground text-sm">
                                {formatCurrency(sale.subtotal, user?.org.currency)}
                            </Text>
                        </View>
                        {sale.tax > 0 && (
                            <View className="flex-row justify-between">
                                <Text className="text-muted-foreground text-sm">Tax</Text>
                                <Text className="text-foreground text-sm">
                                    {formatCurrency(sale.tax, user?.org.currency)}
                                </Text>
                            </View>
                        )}
                        {sale.discount > 0 && (
                            <View className="flex-row justify-between">
                                <Text className="text-muted-foreground text-sm">Discount</Text>
                                <Text className="text-destructive text-sm">
                                    -{formatCurrency(sale.discount, user?.org.currency)}
                                </Text>
                            </View>
                        )}
                        <View className="flex-row justify-between mt-1">
                            <Text className="text-foreground font-bold text-base">Total</Text>
                            <Text className="text-foreground font-bold text-base">
                                {formatCurrency(sale.total, user?.org.currency)}
                            </Text>
                        </View>
                    </View>

                    <Separator className="mt-3" />

                    {/* Payment info */}
                    <View className="pt-3 gap-1">
                        <View className="flex-row justify-between">
                            <Text className="text-muted-foreground text-sm">Payment</Text>
                            <Text className="text-foreground text-sm">
                                {PAYMENT_METHOD_LABELS[sale.paymentMethod]}
                            </Text>
                        </View>
                        {sale.amountTendered && (
                            <>
                                <View className="flex-row justify-between">
                                    <Text className="text-muted-foreground text-sm">Tendered</Text>
                                    <Text className="text-foreground text-sm">
                                        {formatCurrency(sale.amountTendered, user?.org.currency)}
                                    </Text>
                                </View>
                                <View className="flex-row justify-between">
                                    <Text className="text-muted-foreground text-sm">Change</Text>
                                    <Text className="text-primary font-medium text-sm">
                                        {formatCurrency(sale.change, user?.org.currency)}
                                    </Text>
                                </View>
                            </>
                        )}
                        <View className="flex-row justify-between mt-1">
                            <Text className="text-muted-foreground text-sm">Cashier</Text>
                            <Text className="text-foreground text-sm">{sale.cashier.name}</Text>
                        </View>
                    </View>
                </View>
            </ScrollView>

            {/* Bottom actions */}
            <View
                className="flex-row px-4 py-3 gap-3 bg-card border-t border-border"
                style={{ paddingBottom: insets.bottom + 12 }}
            >
                <Button
                    variant="outline"
                    onPress={() => printReceipt({})}
                    className="flex-1 h-12 flex-row items-center gap-2"
                >
                    <Ionicons name="print-outline" size={18} color="hsl(0 0% 63.9%)" />
                    <Text className="text-foreground font-medium">Print</Text>
                </Button>
                <Button onPress={handleNewSale} className="flex-1 h-12 flex-row items-center gap-2">
                    <Ionicons name="add-circle" size={18} color="hsl(0 0% 98%)" />
                    <Text className="text-primary-foreground font-bold">New Sale</Text>
                </Button>
            </View>
        </View>
    );
}
