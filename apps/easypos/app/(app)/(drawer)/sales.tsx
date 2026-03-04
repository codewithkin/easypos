import { View, FlatList, Pressable, TextInput, RefreshControl, useWindowDimensions } from "react-native";
import { router } from "expo-router";
import { useNavigation, DrawerActions } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useState, useMemo } from "react";

import { Text } from "@/components/ui/text";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { useAuthStore } from "@/store/auth";
import { useRole } from "@/hooks/use-role";
import { useApiQuery } from "@/hooks/use-api";
import { formatCurrency, formatTime, formatDate, PAYMENT_METHOD_LABELS, SALE_STATUS_LABELS } from "@easypos/utils";
import type { Sale } from "@easypos/types";
import { cn } from "@/lib/utils";
import { BRAND } from "@/lib/theme";

type SaleWithCashier = Sale & { cashier: { id: string; name: string } };

export default function SalesScreen() {
    const insets = useSafeAreaInsets();
    const navigation = useNavigation();
    const { width } = useWindowDimensions();
    const isTablet = width >= 768;
    const user = useAuthStore((s) => s.user);
    const { canManage } = useRole();
    const [search, setSearch] = useState("");

    const {
        data: salesData,
        isLoading,
        refetch,
        isRefetching,
    } = useApiQuery<{ items: SaleWithCashier[]; total: number }>({
        queryKey: ["sales", "today"],
        path: "/sales",
    });

    const sales = salesData?.items ?? [];

    // Revenue = completed non-credit sales
    const revenueSales = sales.filter(
        (s) => s.status === "COMPLETED" && s.paymentMethod !== "CREDIT",
    );
    const creditSales = sales.filter(
        (s) => s.status === "COMPLETED" && s.paymentMethod === "CREDIT",
    );

    const todayRevenue = revenueSales.reduce((sum, s) => sum + s.total, 0);
    const creditOutstanding = creditSales.reduce((sum, s) => sum + s.total, 0);

    const filteredSales = useMemo(() => {
        if (!search) return sales;
        const q = search.toLowerCase();
        return sales.filter(
            (s) =>
                s.receiptNumber.toLowerCase().includes(q) ||
                s.cashier.name.toLowerCase().includes(q),
        );
    }, [sales, search]);

    function renderSale({ item }: { item: SaleWithCashier }) {
        const isVoided = item.status !== "COMPLETED";
        const isCredit = item.paymentMethod === "CREDIT";

        return (
            <Pressable
                onPress={() => router.push(`/(app)/sale/${item.id}` as any)}
                className={cn(
                    "px-5 py-3.5 active:bg-secondary",
                    isCredit && !isVoided && "bg-amber-50",
                )}
            >
                <View className="flex-row items-center justify-between">
                    <View className="flex-1 mr-3">
                        <View className="flex-row items-center gap-2 flex-wrap">
                            <Text className="text-foreground font-medium text-sm">
                                #{item.receiptNumber}
                            </Text>
                            {isCredit && !isVoided && (
                                <View className="px-1.5 py-0.5 rounded bg-amber-500/20 border border-amber-500/30">
                                    <Text className="text-[10px] font-semibold text-amber-700">CREDIT</Text>
                                </View>
                            )}
                            {isVoided && (
                                <Badge variant="outline" className="px-1.5 py-0.5 bg-destructive/10 border-destructive/30">
                                    <Text className="text-[10px] font-medium text-destructive">
                                        {SALE_STATUS_LABELS[item.status]}
                                    </Text>
                                </Badge>
                            )}
                        </View>
                        <View className="flex-row items-center gap-1.5 mt-0.5">
                            <Text className="text-muted-foreground text-xs">{formatTime(item.createdAt)}</Text>
                            <Text className="text-muted-foreground text-xs">·</Text>
                            <Text className="text-muted-foreground text-xs">
                                {PAYMENT_METHOD_LABELS[item.paymentMethod]}
                            </Text>
                            {canManage && (
                                <>
                                    <Text className="text-muted-foreground text-xs">·</Text>
                                    <Text className="text-muted-foreground text-xs">{item.cashier.name}</Text>
                                </>
                            )}
                        </View>
                    </View>
                    <Text className={cn(
                        "font-bold text-base",
                        isVoided
                            ? "text-muted-foreground line-through"
                            : isCredit
                                ? "text-amber-600"
                                : "text-foreground",
                    )}>
                        {formatCurrency(item.total, user?.org.currency)}
                    </Text>
                </View>
            </Pressable>
        );
    }

    return (
        <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
            {/* ── Header ── */}
            <View className="px-5 pt-2 pb-3">
                <View className="flex-row items-center justify-between mb-3">
                    <View className="flex-row items-center gap-3">
                        {!isTablet && (
                            <Pressable
                                onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
                                className="w-10 h-10 rounded-xl bg-secondary items-center justify-center"
                            >
                                <Ionicons name="menu" size={22} color={BRAND.darkest} />
                            </Pressable>
                        )}
                        <View>
                            <Text className="text-2xl font-bold text-foreground">Sales</Text>
                            <Text className="text-muted-foreground text-xs">{formatDate(new Date())}</Text>
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

                {/* Search */}
                <View className="flex-row items-center bg-card border border-border rounded-xl px-3 h-11">
                    <Ionicons name="search" size={18} color={BRAND.dark} />
                    <TextInput
                        placeholder="Search by receipt or cashier..."
                        placeholderTextColor={BRAND.dark}
                        value={search}
                        onChangeText={setSearch}
                        className="flex-1 ml-2 text-foreground text-sm"
                    />
                    {search.length > 0 && (
                        <Pressable onPress={() => setSearch("")}>
                            <Ionicons name="close-circle" size={18} color={BRAND.dark} />
                        </Pressable>
                    )}
                </View>
            </View>

            {/* ── Summary Cards ── */}
            {canManage && (
                <View className={cn("px-5 mb-3", isTablet ? "flex-row gap-3" : "gap-3")}>
                    {/* Revenue card */}
                    <View className={cn("p-4 rounded-2xl bg-card border border-border", isTablet ? "flex-1" : "w-full")}>
                        <View className="flex-row items-center justify-between">
                            <View>
                                <Text className="text-muted-foreground text-xs uppercase tracking-wider">
                                    Cash Revenue
                                </Text>
                                <Text className="text-foreground text-2xl font-bold mt-0.5">
                                    {isLoading ? "—" : formatCurrency(todayRevenue, user?.org.currency)}
                                </Text>
                            </View>
                            <View className="items-end">
                                <Text className="text-muted-foreground text-xs uppercase tracking-wider">
                                    Transactions
                                </Text>
                                <Text className="text-foreground text-2xl font-bold mt-0.5">
                                    {isLoading ? "—" : revenueSales.length}
                                </Text>
                            </View>
                        </View>
                    </View>

                    {/* Credit outstanding card */}
                    {(isLoading || creditSales.length > 0) && (
                        <View className={cn(
                            "p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30",
                            isTablet ? "flex-1" : "w-full",
                        )}>
                            <View className="flex-row items-center justify-between">
                                <View>
                                    <View className="flex-row items-center gap-1.5">
                                        <Ionicons name="time-outline" size={14} color={BRAND.yellow} />
                                        <Text className="text-amber-700 text-xs uppercase tracking-wider font-medium">
                                            Credit Outstanding
                                        </Text>
                                    </View>
                                    <Text className="text-amber-700 text-2xl font-bold mt-0.5">
                                        {isLoading ? "—" : formatCurrency(creditOutstanding, user?.org.currency)}
                                    </Text>
                                </View>
                                <View className="items-end">
                                    <Text className="text-amber-700 text-xs uppercase tracking-wider font-medium">
                                        Sales
                                    </Text>
                                    <Text className="text-amber-700 text-2xl font-bold mt-0.5">
                                        {isLoading ? "—" : creditSales.length}
                                    </Text>
                                </View>
                            </View>
                        </View>
                    )}
                </View>
            )}

            {/* ── Sales List ── */}
            {isLoading ? (
                <View className="px-5 gap-3 mt-2">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <Skeleton key={i} className="h-16 rounded-xl" />
                    ))}
                </View>
            ) : filteredSales.length === 0 ? (
                <View className="flex-1 items-center justify-center">
                    <Ionicons name="receipt-outline" size={48} color={BRAND.mid} />
                    <Text className="text-muted-foreground mt-3 text-base">
                        {search ? "No matching sales" : "No sales today"}
                    </Text>
                    {!search && (
                        <Button
                            onPress={() => router.push("/(app)/sale/create")}
                            className="mt-4 h-10 px-6"
                        >
                            <Text className="text-primary-foreground font-semibold text-sm">Start Selling</Text>
                        </Button>
                    )}
                </View>
            ) : (
                <FlatList
                    data={filteredSales}
                    keyExtractor={(item) => item.id}
                    renderItem={renderSale}
                    ItemSeparatorComponent={() => <Separator className="ml-5" />}
                    refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
                    contentContainerStyle={{ paddingBottom: 20 }}
                />
            )}
        </View>
    );
}
    const isTablet = width >= 768;
    const user = useAuthStore((s) => s.user);
    const { canManage } = useRole();
    const [search, setSearch] = useState("");

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

    const filteredSales = useMemo(() => {
        if (!search) return sales;
        const q = search.toLowerCase();
        return sales.filter(
            (s) =>
                s.receiptNumber.toLowerCase().includes(q) ||
                s.cashier.name.toLowerCase().includes(q),
        );
    }, [sales, search]);

    function renderSale({ item }: { item: (typeof sales)[0] }) {
        const isVoided = item.status !== "COMPLETED";

        return (
            <Pressable
                onPress={() => router.push(`/(app)/sale/${item.id}`)}
                className="px-5 py-3.5 active:bg-secondary"
            >
                <View className="flex-row items-center justify-between">
                    <View className="flex-1 mr-3">
                        <View className="flex-row items-center gap-2">
                            <Text className="text-foreground font-medium text-sm">
                                #{item.receiptNumber}
                            </Text>
                            {isVoided && (
                                <Badge variant="outline" className="px-1.5 py-0.5 bg-destructive/10 border-destructive/30">
                                    <Text className="text-[10px] font-medium text-destructive">
                                        {SALE_STATUS_LABELS[item.status]}
                                    </Text>
                                </Badge>
                            )}
                        </View>
                        <View className="flex-row items-center gap-1.5 mt-0.5">
                            <Text className="text-muted-foreground text-xs">
                                {formatTime(item.createdAt)}
                            </Text>
                            <Text className="text-muted-foreground text-xs">·</Text>
                            <Text className="text-muted-foreground text-xs">
                                {PAYMENT_METHOD_LABELS[item.paymentMethod]}
                            </Text>
                            {canManage && (
                                <>
                                    <Text className="text-muted-foreground text-xs">·</Text>
                                    <Text className="text-muted-foreground text-xs">{item.cashier.name}</Text>
                                </>
                            )}
                        </View>
                    </View>
                    <View className="items-end">
                        <Text className={cn(
                            "font-bold text-base",
                            isVoided ? "text-muted-foreground line-through" : "text-foreground",
                        )}>
                            {formatCurrency(item.total, user?.org.currency)}
                        </Text>
                    </View>
                </View>
            </Pressable>
        );
    }

    return (
        <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
            {/* ── Header ── */}
            <View className="px-5 pt-2 pb-3">
                <View className="flex-row items-center justify-between mb-3">
                    <View className="flex-row items-center gap-3">
                        {!isTablet && (
                            <Pressable
                                onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
                                className="w-10 h-10 rounded-xl bg-secondary items-center justify-center"
                            >
                                <Ionicons name="menu" size={22} color={BRAND.darkest} />
                            </Pressable>
                        )}
                        <View>
                            <Text className="text-2xl font-bold text-foreground">Sales</Text>
                            <Text className="text-muted-foreground text-xs">{formatDate(new Date())}</Text>
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

                {/* Search */}
                <View className="flex-row items-center bg-card border border-border rounded-xl px-3 h-11">
                    <Ionicons name="search" size={18} color={BRAND.dark} />
                    <TextInput
                        placeholder="Search by receipt or cashier..."
                        placeholderTextColor={BRAND.dark}
                        value={search}
                        onChangeText={setSearch}
                        className="flex-1 ml-2 text-foreground text-sm"
                    />
                    {search.length > 0 && (
                        <Pressable onPress={() => setSearch("")}>
                            <Ionicons name="close-circle" size={18} color={BRAND.dark} />
                        </Pressable>
                    )}
                </View>
            </View>

            {/* ── Summary Card ── */}
            {canManage && (
                <View className="mx-5 mb-3 p-4 rounded-2xl bg-card border border-border">
                    <View className="flex-row items-center justify-between">
                        <View>
                            <Text className="text-muted-foreground text-xs uppercase tracking-wider">Revenue</Text>
                            <Text className="text-foreground text-2xl font-bold mt-0.5">
                                {formatCurrency(todayRevenue, user?.org.currency)}
                            </Text>
                        </View>
                        <View className="items-end">
                            <Text className="text-muted-foreground text-xs uppercase tracking-wider">Transactions</Text>
                            <Text className="text-foreground text-2xl font-bold mt-0.5">{total}</Text>
                        </View>
                    </View>
                </View>
            )}

            {/* ── Sales List ── */}
            {isLoading ? (
                <View className="px-5 gap-3 mt-2">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <Skeleton key={i} className="h-16 rounded-xl" />
                    ))}
                </View>
            ) : filteredSales.length === 0 ? (
                <View className="flex-1 items-center justify-center">
                    <Ionicons name="receipt-outline" size={48} color={BRAND.mid} />
                    <Text className="text-muted-foreground mt-3 text-base">
                        {search ? "No matching sales" : "No sales today"}
                    </Text>
                    {!search && (
                        <Button
                            onPress={() => router.push("/(app)/sale/create")}
                            className="mt-4 h-10 px-6"
                        >
                            <Text className="text-primary-foreground font-semibold text-sm">Start Selling</Text>
                        </Button>
                    )}
                </View>
            ) : (
                <FlatList
                    data={filteredSales}
                    keyExtractor={(item) => item.id}
                    renderItem={renderSale}
                    ItemSeparatorComponent={() => <Separator className="ml-5" />}
                    refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
                    contentContainerStyle={{ paddingBottom: 20 }}
                />
            )}
        </View>
    );
}
