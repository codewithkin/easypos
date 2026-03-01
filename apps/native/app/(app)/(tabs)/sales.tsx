import { View, FlatList, Pressable, RefreshControl } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { Text } from "@/components/ui/text";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { useAuthStore } from "@/store/auth";
import { useApiQuery } from "@/hooks/use-api";
import { formatCurrency, formatTime, PAYMENT_METHOD_LABELS, SALE_STATUS_LABELS } from "@easypos/utils";
import type { Sale } from "@easypos/types";
import { cn } from "@/lib/utils";

export default function SalesScreen() {
    const user = useAuthStore((s) => s.user);

    const {
        data: salesData,
        isLoading,
        refetch,
        isRefetching,
    } = useApiQuery<{
        items: (Sale & { cashier: { id: string; name: string } })[];
        total: number;
    }>({
        queryKey: ["sales", "today"],
        path: "/sales",
    });

    const sales = salesData?.items ?? [];
    const total = salesData?.total ?? 0;

    const todayRevenue = sales
        .filter((s) => s.status === "COMPLETED")
        .reduce((sum, s) => sum + s.total, 0);

    function renderSale({ item }: { item: (typeof sales)[0] }) {
        const statusColor =
            item.status === "COMPLETED"
                ? "bg-primary"
                : item.status === "VOIDED"
                    ? "bg-destructive"
                    : "bg-muted";

        return (
            <Pressable
                onPress={() => router.push(`/(app)/sale/${item.id}`)}
                className="px-4 py-3.5 active:bg-secondary"
            >
                <View className="flex-row items-center justify-between">
                    <View className="flex-1 mr-3">
                        <View className="flex-row items-center gap-2">
                            <Text className="text-foreground font-medium text-sm">
                                #{item.receiptNumber}
                            </Text>
                            {item.status !== "COMPLETED" && (
                                <Badge variant="outline" className={cn("px-1.5 py-0.5", statusColor)}>
                                    <Text className="text-[10px] font-medium text-primary-foreground">
                                        {SALE_STATUS_LABELS[item.status]}
                                    </Text>
                                </Badge>
                            )}
                        </View>
                        <View className="flex-row items-center gap-2 mt-0.5">
                            <Text className="text-muted-foreground text-xs">
                                {formatTime(item.createdAt)}
                            </Text>
                            <Text className="text-muted-foreground text-xs">·</Text>
                            <Text className="text-muted-foreground text-xs">
                                {PAYMENT_METHOD_LABELS[item.paymentMethod]}
                            </Text>
                            <Text className="text-muted-foreground text-xs">·</Text>
                            <Text className="text-muted-foreground text-xs">
                                {item.cashier.name}
                            </Text>
                        </View>
                    </View>
                    <View className="items-end">
                        <Text className="text-foreground font-bold text-base">
                            {formatCurrency(item.total, user?.org.currency)}
                        </Text>
                    </View>
                </View>
            </Pressable>
        );
    }

    return (
        <View className="flex-1 bg-background">
            {/* Summary card */}
            <View className="mx-4 mt-4 mb-2 p-4 rounded-xl bg-card border border-border">
                <View className="flex-row items-center justify-between">
                    <View>
                        <Text className="text-muted-foreground text-xs uppercase tracking-wider">
                            Today's Revenue
                        </Text>
                        <Text className="text-foreground text-2xl font-bold mt-0.5">
                            {formatCurrency(todayRevenue, user?.org.currency)}
                        </Text>
                    </View>
                    <View className="items-end">
                        <Text className="text-muted-foreground text-xs uppercase tracking-wider">
                            Transactions
                        </Text>
                        <Text className="text-foreground text-2xl font-bold mt-0.5">{total}</Text>
                    </View>
                </View>
            </View>

            {/* Sales list */}
            {isLoading ? (
                <View className="px-4 gap-3 mt-4">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <Skeleton key={i} className="h-16 rounded-lg" />
                    ))}
                </View>
            ) : sales.length === 0 ? (
                <View className="flex-1 items-center justify-center">
                    <Ionicons name="receipt-outline" size={48} color="hsl(0 0% 45%)" />
                    <Text className="text-muted-foreground mt-3 text-base">No sales today</Text>
                    <Text className="text-muted-foreground text-sm">
                        Start selling from the POS tab
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={sales}
                    keyExtractor={(item) => item.id}
                    renderItem={renderSale}
                    ItemSeparatorComponent={() => <Separator className="ml-4" />}
                    refreshControl={
                        <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
                    }
                    contentContainerStyle={{ paddingBottom: 20 }}
                />
            )}
        </View>
    );
}
