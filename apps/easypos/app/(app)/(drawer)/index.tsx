import { View, ScrollView, Pressable, RefreshControl, useWindowDimensions } from "react-native";
import { router } from "expo-router";
import { useNavigation, DrawerActions } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Text } from "@/components/ui/text";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/auth";
import { useRole } from "@/hooks/use-role";
import { useApiQuery } from "@/hooks/use-api";
import { formatCurrency, formatTime, PAYMENT_METHOD_LABELS } from "@easypos/utils";
import type { Sale } from "@easypos/types";
import { cn } from "@/lib/utils";
import { BRAND } from "@/lib/theme";

export default function DashboardScreen() {
    const insets = useSafeAreaInsets();
    const navigation = useNavigation();
    const { width } = useWindowDimensions();
    const isTablet = width >= 768;
    const user = useAuthStore((s) => s.user);
    const { canManage } = useRole();

    const {
        data: salesData,
        isLoading: salesLoading,
        refetch,
        isRefetching,
    } = useApiQuery<{
        items: (Sale & { cashier: { id: string; name: string } })[];
        total: number;
    }>({
        queryKey: ["sales", "today"],
        path: "/sales",
    });

    const { data: productsData } = useApiQuery<{ total: number }>({
        queryKey: ["products", "count"],
        path: "/products?pageSize=1",
    });

    const { data: customersData } = useApiQuery<{ total: number }>({
        queryKey: ["customers", "count"],
        path: "/customers?pageSize=1",
    });

    const sales = salesData?.items ?? [];
    // Exclude credit sales from revenue
    const completedRevenueSales = sales.filter(
        (s) => s.status === "COMPLETED" && s.paymentMethod !== "CREDIT",
    );
    const todayRevenue = completedRevenueSales.reduce((sum, s) => sum + s.total, 0);
    const totalSales = salesData?.total ?? 0;
    const revenueCount = completedRevenueSales.length;
    const avgSale = revenueCount > 0 ? todayRevenue / revenueCount : 0;
    const recentSales = sales && sales.length > 0 ? sales.slice(0, 5) : [];

    const stats = [
        {
            label: "Today's Revenue",
            value: formatCurrency(todayRevenue, user?.org.currency),
            icon: "cash-outline" as const,
            color: "bg-primary/10",
            textColor: "text-primary",
        },
        {
            label: "Total Sales",
            value: String(totalSales),
            icon: "receipt-outline" as const,
            color: "bg-blue-500/10",
            textColor: "text-blue-600",
        },
        {
            label: "Average Sale",
            value: formatCurrency(avgSale, user?.org.currency),
            icon: "trending-up-outline" as const,
            color: "bg-amber-500/10",
            textColor: "text-amber-600",
        },
        {
            label: "Products",
            value: String(productsData?.total ?? 0),
            icon: "cube-outline" as const,
            color: "bg-purple-500/10",
            textColor: "text-purple-600",
        },
    ];

    return (
        <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
            {/* ── Header ── */}
            <View className="flex-row items-center justify-between px-5 h-14">
                <View className="flex-row items-center gap-3">
                    {!isTablet && (
                        <Pressable
                            onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
                            className="w-10 h-10 rounded-xl bg-secondary items-center justify-center"
                        >
                            <Ionicons name="menu" size={22} color={BRAND.darkest} />
                        </Pressable>
                    )}
                    <View className="flex-row items-center gap-2">
                        <View className="w-9 h-9 rounded-lg bg-primary items-center justify-center">
                            <View className="items-center justify-center">
                                <Ionicons name="expand" size={22} color="rgba(255,255,255,0.3)" style={{ position: "absolute" }} />
                                <View className="w-4 h-4 rounded-full border border-white items-center justify-center">
                                    <Text className="text-white font-bold text-[9px]">$</Text>
                                </View>
                            </View>
                        </View>
                        <View>
                            <Text className="text-foreground font-bold text-base tracking-tight leading-tight">
                                <Text className="text-amber-500">Easy</Text>POS
                            </Text>
                        </View>
                    </View>
                </View>

                <Button
                    onPress={() => router.push("/(app)/sale/create")}
                    className="flex-row items-center gap-2 h-10 px-4"
                >
                    <Ionicons name="add-circle" size={18} color="hsl(0 0% 98%)" />
                    <Text className="text-primary-foreground font-semibold text-sm">New Sale</Text>
                </Button>
            </View>

            <ScrollView
                contentContainerStyle={{ paddingBottom: 40 }}
                refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
            >
                {/* ── Greeting ── */}
                <View className="px-5 pt-4 pb-5">
                    <Text className="text-2xl font-bold text-foreground">
                        Hello, {user?.name?.split(" ")[0]}
                    </Text>
                    <Text className="text-muted-foreground text-sm mt-0.5">
                        {user?.org.name} · {user?.branch?.name ?? "All Branches"}
                    </Text>
                </View>

                {/* ── Stats Grid ── */}
                <View className={cn("px-5", isTablet ? "flex-row flex-wrap gap-4" : "gap-3")}>
                    {salesLoading ? (
                        <>
                            {Array.from({ length: 4 }).map((_, i) => (
                                <View key={i} className={isTablet ? "flex-1 min-w-[200px]" : "w-full"}>
                                    <Skeleton className="h-24 rounded-2xl" />
                                </View>
                            ))}
                        </>
                    ) : (
                        <View className={cn(isTablet ? "flex-row flex-wrap gap-4 flex-1" : "flex-row flex-wrap gap-3")}>
                            {stats.map((stat) => (
                                <View
                                    key={stat.label}
                                    className={cn(
                                        "p-4 rounded-2xl bg-card border border-border",
                                        isTablet ? "flex-1 min-w-[180px]" : "w-[48%]",
                                    )}
                                >
                                    <View className={cn("w-9 h-9 rounded-xl items-center justify-center mb-3", stat.color)}>
                                        <Ionicons name={stat.icon} size={18} color={BRAND.dark} />
                                    </View>
                                    <Text className={cn("font-bold text-xl", stat.textColor)}>{stat.value}</Text>
                                    <Text className="text-muted-foreground text-xs mt-0.5">{stat.label}</Text>
                                </View>
                            ))}
                        </View>
                    )}
                </View>

                {/* ── Quick Actions (tablet) ── */}
                {isTablet && (
                    <View className="flex-row gap-3 px-5 mt-6">
                        <Pressable
                            onPress={() => router.push("/(app)/sale/create")}
                            className="flex-1 flex-row items-center gap-3 p-4 rounded-2xl bg-primary"
                        >
                            <Ionicons name="cart" size={22} color="white" />
                            <View>
                                <Text className="text-primary-foreground font-semibold text-sm">Start Selling</Text>
                                <Text className="text-primary-foreground/70 text-xs">Open POS terminal</Text>
                            </View>
                        </Pressable>
                        {canManage && (
                            <Pressable
                                onPress={() => router.push("/(app)/products/add")}
                                className="flex-1 flex-row items-center gap-3 p-4 rounded-2xl bg-card border border-border"
                            >
                                <Ionicons name="cube-outline" size={22} color={BRAND.dark} />
                                <View>
                                    <Text className="text-foreground font-semibold text-sm">Add Product</Text>
                                    <Text className="text-muted-foreground text-xs">Expand your catalogue</Text>
                                </View>
                            </Pressable>
                        )}
                    </View>
                )}

                {/* ── Recent Sales ── */}
                <View className="mt-6 px-5">
                    <View className="flex-row items-center justify-between mb-3">
                        <Text className="text-foreground font-semibold text-base">Recent Sales</Text>
                        <Pressable onPress={() => navigation.navigate("sales" as never)}>
                            <Text className="text-primary font-medium text-sm">View All →</Text>
                        </Pressable>
                    </View>

                    {salesLoading ? (
                        <View className="gap-3">
                            {Array.from({ length: 3 }).map((_, i) => (
                                <Skeleton key={i} className="h-16 rounded-xl" />
                            ))}
                        </View>
                    ) : recentSales.length === 0 ? (
                        <View className="items-center py-10 rounded-2xl bg-card border border-border">
                            <Ionicons name="receipt-outline" size={40} color={BRAND.mid} />
                            <Text className="text-muted-foreground text-sm mt-3">No sales yet today</Text>
                            <Button
                                onPress={() => router.push("/(app)/sale/create")}
                                className="mt-4 h-10 px-6"
                            >
                                <Text className="text-primary-foreground font-semibold text-sm">Make First Sale</Text>
                            </Button>
                        </View>
                    ) : (
                        <View className="rounded-2xl bg-card border border-border overflow-hidden">
                            {recentSales.map((sale, idx) => (
                                <View key={sale.id}>
                                    <Pressable
                                        onPress={() => router.push(`/(app)/sale/${sale.id}`)}
                                        className="flex-row items-center justify-between px-4 py-3.5 active:bg-secondary"
                                    >
                                        <View className="flex-1 mr-3">
                                            <Text className="text-foreground font-medium text-sm">
                                                #{sale.receiptNumber}
                                            </Text>
                                            <View className="flex-row items-center gap-1.5 mt-0.5">
                                                <Text className="text-muted-foreground text-xs">
                                                    {formatTime(sale.createdAt)}
                                                </Text>
                                                <Text className="text-muted-foreground text-xs">·</Text>
                                                <Text className="text-muted-foreground text-xs">
                                                    {PAYMENT_METHOD_LABELS[sale.paymentMethod]}
                                                </Text>
                                            </View>
                                        </View>
                                        <Text className={cn(
                                            "font-bold text-base",
                                            sale.status !== "COMPLETED"
                                                ? "text-muted-foreground line-through"
                                                : sale.paymentMethod === "CREDIT"
                                                    ? "text-amber-600"
                                                    : "text-primary",
                                        )}>
                                            {formatCurrency(sale.total, user?.org.currency)}
                                        </Text>
                                    </Pressable>
                                    {idx < recentSales.length - 1 && <Separator className="ml-4" />}
                                </View>
                            ))}
                        </View>
                    )}
                </View>

                {/* ── Customers Summary ── */}
                <View className="mt-6 px-5">
                    <View className="flex-row items-center justify-between mb-3">
                        <Text className="text-foreground font-semibold text-base">Customers</Text>
                        <Pressable onPress={() => navigation.navigate("customers" as never)}>
                            <Text className="text-primary font-medium text-sm">Manage →</Text>
                        </Pressable>
                    </View>
                    <View className="flex-row gap-3">
                        <View className="flex-1 p-4 rounded-2xl bg-card border border-border items-center">
                            <Text className="text-foreground font-bold text-2xl">
                                {customersData?.total ?? 0}
                            </Text>
                            <Text className="text-muted-foreground text-xs mt-0.5">Total Customers</Text>
                        </View>
                        <Pressable
                            onPress={() => router.push("/(app)/customers/create")}
                            className="flex-1 p-4 rounded-2xl bg-primary/5 border border-primary/20 items-center justify-center"
                        >
                            <Ionicons name="person-add-outline" size={24} color={BRAND.brand} />
                            <Text className="text-primary font-medium text-xs mt-1.5">Add Customer</Text>
                        </Pressable>
                    </View>
                </View>
            </ScrollView>
        </View>
    );
}
