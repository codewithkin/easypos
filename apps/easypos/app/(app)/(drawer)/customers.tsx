import { useState, useMemo } from "react";
import { View, FlatList, Pressable, TextInput, RefreshControl, useWindowDimensions } from "react-native";
import { router } from "expo-router";
import { useNavigation, DrawerActions } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { useAuthStore } from "@/store/auth";
import { useApiQuery } from "@/hooks/use-api";
import { cn } from "@/lib/utils";
import { BRAND } from "@/lib/theme";

interface Customer {
    id: string;
    name: string;
    phone: string | null;
    email: string | null;
    notes: string | null;
    orgId: string;
    createdAt: string;
    updatedAt: string;
    _count?: { sales: number };
}

export default function CustomersScreen() {
    const insets = useSafeAreaInsets();
    const navigation = useNavigation();
    const { width } = useWindowDimensions();
    const isTablet = width >= 768;
    const user = useAuthStore((s) => s.user);
    const [search, setSearch] = useState("");

    const { data, isLoading, refetch, isRefetching } = useApiQuery<{
        items: Customer[];
        total: number;
    }>({
        queryKey: ["customers"],
        path: "/customers?pageSize=200",
    });

    const customers = data?.items ?? [];

    const filtered = useMemo(() => {
        if (!search) return customers;
        const q = search.toLowerCase();
        return customers.filter(
            (c) =>
                c.name.toLowerCase().includes(q) ||
                (c.phone ?? "").toLowerCase().includes(q) ||
                (c.email ?? "").toLowerCase().includes(q),
        );
    }, [customers, search]);

    function renderCustomer({ item }: { item: Customer }) {
        return (
            <Pressable
                onPress={() => router.push(`/(app)/customers/${item.id}` as any)}
                className="px-5 py-3.5 active:bg-secondary"
            >
                <View className="flex-row items-center">
                    {/* Avatar */}
                    <View className="w-10 h-10 rounded-full bg-primary/10 items-center justify-center mr-3">
                        <Text className="text-primary font-bold text-sm">
                            {item.name.charAt(0).toUpperCase()}
                        </Text>
                    </View>

                    {/* Info */}
                    <View className="flex-1">
                        <Text className="text-foreground font-medium text-sm">{item.name}</Text>
                        <View className="flex-row items-center gap-1.5 mt-0.5">
                            {item.phone && (
                                <Text className="text-muted-foreground text-xs">{item.phone}</Text>
                            )}
                            {item.phone && item.email && (
                                <Text className="text-muted-foreground text-xs">·</Text>
                            )}
                            {item.email && (
                                <Text className="text-muted-foreground text-xs" numberOfLines={1}>
                                    {item.email}
                                </Text>
                            )}
                            {!item.phone && !item.email && (
                                <Text className="text-muted-foreground text-xs">No contact info</Text>
                            )}
                        </View>
                    </View>

                    {/* Order count + chevron */}
                    <View className="items-end">
                        {item._count?.sales != null && (
                            <Text className="text-muted-foreground text-xs">
                                {item._count.sales} {item._count.sales === 1 ? "order" : "orders"}
                            </Text>
                        )}
                        <Ionicons name="chevron-forward" size={16} color={BRAND.mid} />
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
                            <Text className="text-2xl font-bold text-foreground">Customers</Text>
                            <Text className="text-muted-foreground text-xs">
                                {data?.total ?? 0} total
                            </Text>
                        </View>
                    </View>
                    <Pressable
                        onPress={() => router.push("/(app)/customers/create")}
                        className="bg-primary w-10 h-10 rounded-xl items-center justify-center"
                    >
                        <Ionicons name="person-add" size={20} color="hsl(0 0% 98%)" />
                    </Pressable>
                </View>

                {/* Search */}
                <View className="flex-row items-center bg-card border border-border rounded-xl px-3 h-11">
                    <Ionicons name="search" size={18} color={BRAND.dark} />
                    <TextInput
                        placeholder="Search by name, phone, or email..."
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

            {/* ── Customer List ── */}
            {isLoading ? (
                <View className="px-5 gap-3 mt-2">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <Skeleton key={i} className="h-16 rounded-xl" />
                    ))}
                </View>
            ) : filtered.length === 0 ? (
                <View className="flex-1 items-center justify-center">
                    <Ionicons name="people-outline" size={48} color={BRAND.mid} />
                    <Text className="text-muted-foreground mt-3 text-base">
                        {search ? "No matching customers" : "No customers yet"}
                    </Text>
                    {!search && (
                        <Button
                            onPress={() => router.push("/(app)/customers/create")}
                            className="mt-4 h-10 px-6"
                        >
                            <Text className="text-primary-foreground font-semibold text-sm">Add Customer</Text>
                        </Button>
                    )}
                </View>
            ) : (
                <FlatList
                    data={filtered}
                    keyExtractor={(item) => item.id}
                    renderItem={renderCustomer}
                    ItemSeparatorComponent={() => <Separator className="ml-16" />}
                    refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
                    contentContainerStyle={{ paddingBottom: 40 }}
                />
            )}
        </View>
    );
}
