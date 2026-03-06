import { useState, useMemo } from "react";
import { View, FlatList, Pressable, TextInput, RefreshControl, useWindowDimensions, Image } from "react-native";
import { router } from "expo-router";
import { useNavigation, DrawerActions } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Text } from "@/components/ui/text";
import { NoPlanGuard } from "@/components/no-plan-guard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuthStore } from "@/store/auth";
import { useRole } from "@/hooks/use-role";
import { useApiQuery, useApiPaginatedQuery } from "@/hooks/use-api";
import { formatCurrency } from "@easypos/utils";
import type { Product, Category } from "@easypos/types";
import { cn } from "@/lib/utils";
import { BRAND } from "@/lib/theme";

type ProductWithCategory = Product & {
    category?: { id: string; name: string } | null;
    tags?: { tag: { id: string; name: string } }[];
};

export default function ProductsScreen() {
    const insets = useSafeAreaInsets();
    const navigation = useNavigation();
    const { width } = useWindowDimensions();
    const isTablet = width >= 768;
    const user = useAuthStore((s) => s.user);
    const { canManage } = useRole();
    const [search, setSearch] = useState("");
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

    const {
        items: allProducts,
        total: productsTotal,
        isLoading,
        refetch,
        isRefetching,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
    } = useApiPaginatedQuery<ProductWithCategory>({
        queryKey: ["products", "manage"],
        path: "/products",
        pageSize: 10,
    });

    const { data: categoriesData } = useApiQuery<{ items: Category[] }>({
        queryKey: ["categories"],
        path: "/categories",
    });

    const products = allProducts;
    const categories = categoriesData?.items ?? [];

    const filtered = useMemo(() => {
        return products.filter((p) => {
            if (selectedCategory && p.categoryId !== selectedCategory) return false;
            if (search) {
                const q = search.toLowerCase();
                return (
                    p.name.toLowerCase().includes(q) ||
                    p.sku.toLowerCase().includes(q) ||
                    (p.barcode ?? "").toLowerCase().includes(q)
                );
            }
            return true;
        });
    }, [products, search, selectedCategory]);

    const activeCount = products.filter((p) => p.isActive).length;

    function renderProduct({ item, index }: { item: ProductWithCategory; index: number }) {
        const isOdd = index % 2 !== 0;
        return (
            <Pressable
                onPress={() => router.push(`/(app)/products/${item.id}`)}
                className="flex-1 m-1.5 rounded-2xl bg-card border border-border overflow-hidden active:opacity-80"
                style={{ maxWidth: "50%" }}
            >
                {/* Image */}
                <View className="w-full aspect-square bg-secondary items-center justify-center">
                    {item.imageUrl ? (
                        <Image
                            source={{ uri: item.imageUrl }}
                            className="w-full h-full"
                            resizeMode="cover"
                        />
                    ) : (
                        <Ionicons name="cube-outline" size={36} color={BRAND.mid} />
                    )}
                    {!item.isActive && (
                        <View className="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-destructive/90">
                            <Text className="text-[10px] text-white font-medium">Inactive</Text>
                        </View>
                    )}
                </View>

                {/* Info */}
                <View className="p-3 gap-0.5">
                    <Text className="text-foreground font-semibold text-sm" numberOfLines={2}>
                        {item.name}
                    </Text>
                    {item.category && (
                        <Text className="text-muted-foreground text-xs" numberOfLines={1}>
                            {item.category.name}
                        </Text>
                    )}
                    <Text className="text-primary font-bold text-sm mt-1">
                        {formatCurrency(item.price, user?.org.currency)}
                    </Text>
                    {item.stock != null && (
                        <Text className={cn(
                            "text-xs font-medium",
                            item.stock <= 0 ? "text-destructive" : item.stock <= 5 ? "text-amber-500" : "text-muted-foreground",
                        )}>
                            {item.stock <= 0 ? "Out of stock" : `${item.stock} in stock`}
                        </Text>
                    )}
                </View>
            </Pressable>
        );
    }

    return (
        <NoPlanGuard>
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
                                <Text className="text-2xl font-bold text-foreground">Products</Text>
                                <Text className="text-muted-foreground text-xs">
                                    {activeCount} active · {productsTotal} total
                                </Text>
                            </View>
                        </View>
                        {canManage && (
                            <Pressable
                                onPress={() => router.push("/(app)/products/add")}
                                className="bg-primary w-10 h-10 rounded-xl items-center justify-center"
                            >
                                <Ionicons name="add" size={22} color="hsl(0 0% 98%)" />
                            </Pressable>
                        )}
                    </View>

                    {/* Search */}
                    <View className="flex-row items-center bg-card border border-border rounded-xl px-3 h-11">
                        <Ionicons name="search" size={18} color={BRAND.dark} />
                        <TextInput
                            placeholder="Search by name, SKU, or barcode..."
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

                    {/* Category chips */}
                    {categories.length > 0 && (
                        <FlatList
                            horizontal
                            data={[{ id: null as any, name: "All" }, ...categories]}
                            keyExtractor={(item) => item.id ?? "all"}
                            showsHorizontalScrollIndicator={false}
                            className="mt-3"
                            renderItem={({ item }) => (
                                <Pressable
                                    onPress={() => setSelectedCategory(item.id)}
                                    className={cn(
                                        "px-4 py-1.5 rounded-full mr-2 border",
                                        selectedCategory === item.id
                                            ? "bg-primary border-primary"
                                            : "bg-card border-border",
                                    )}
                                >
                                    <Text className={cn(
                                        "text-sm font-medium",
                                        selectedCategory === item.id ? "text-primary-foreground" : "text-foreground",
                                    )}>
                                        {item.name}
                                    </Text>
                                </Pressable>
                            )}
                        />
                    )}
                </View>

                {/* ── Product List ── */}
                {isLoading ? (
                    <View className="flex-row flex-wrap px-2">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <View key={i} className="w-1/2 p-1.5">
                                <Skeleton className="rounded-2xl aspect-square" />
                                <View className="mt-2 gap-1.5 px-1">
                                    <Skeleton className="h-4 w-3/4 rounded" />
                                    <Skeleton className="h-3 w-1/2 rounded" />
                                </View>
                            </View>
                        ))}
                    </View>
                ) : filtered.length === 0 ? (
                    <View className="flex-1 items-center justify-center">
                        <Ionicons name="cube-outline" size={48} color={BRAND.mid} />
                        <Text className="text-muted-foreground mt-3 text-base">
                            {search || selectedCategory ? "No matching products" : "No products yet"}
                        </Text>
                        {canManage && (
                            <Button
                                onPress={() => router.push("/(app)/products/add")}
                                className="mt-4 h-10 px-6"
                            >
                                <Text className="text-primary-foreground font-semibold text-sm">Add Product</Text>
                            </Button>
                        )}
                    </View>) : (
                    <FlatList
                        data={filtered}
                        keyExtractor={(item) => item.id}
                        renderItem={renderProduct}
                        numColumns={2}
                        columnWrapperStyle={{ paddingHorizontal: 6 }}
                        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
                        onEndReached={() => { if (hasNextPage && !isFetchingNextPage) fetchNextPage(); }}
                        onEndReachedThreshold={0.5}
                        ListFooterComponent={
                            isFetchingNextPage ? (
                                <View className="py-4 items-center">
                                    <Text className="text-muted-foreground text-xs">Loading more...</Text>
                                </View>
                            ) : null
                        }
                        contentContainerStyle={{ paddingBottom: 40, paddingTop: 4 }}
                    />
                )}
            </View>
        </NoPlanGuard>
    );
}
