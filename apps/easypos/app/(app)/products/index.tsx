import { useState, useMemo } from "react";
import {
    View,
    FlatList,
    Pressable,
    TextInput,
    RefreshControl,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Text } from "@/components/ui/text";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { useAuthStore } from "@/store/auth";
import { useApiQuery, useApiDelete } from "@/hooks/use-api";
import { toast } from "@/lib/toast";
import { formatCurrency } from "@easypos/utils";
import type { Product, Category } from "@easypos/types";
import { cn } from "@/lib/utils";

type ProductWithCategory = Product & { category?: { id: string; name: string } | null };

export default function ManageProductsScreen() {
    const insets = useSafeAreaInsets();
    const user = useAuthStore((s) => s.user);
    const [search, setSearch] = useState("");
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<ProductWithCategory | null>(null);

    const { data: productsData, isLoading, refetch, isRefetching } = useApiQuery<{
        items: ProductWithCategory[];
        total: number;
    }>({
        queryKey: ["products", "manage"],
        path: "/products?pageSize=200",
    });

    const { data: categoriesData } = useApiQuery<{ items: Category[] }>({
        queryKey: ["categories"],
        path: "/categories",
    });

    const { mutate: deleteProduct, isPending: isDeleting } = useApiDelete<{ message: string }>({
        path: "",
        invalidateKeys: [["products"]],
        onSuccess: () => toast.success("Product deleted"),
        onError: (err) => toast.error(err.message),
    });

    const products = productsData?.items ?? [];
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

    function confirmDelete(product: ProductWithCategory) {
        setDeleteTarget(product);
    }

    function renderProduct({ item }: { item: ProductWithCategory }) {
        return (
            <Pressable
                onPress={() => router.push(`/(app)/products/${item.id}`)}
                className="px-4 py-3.5 active:bg-secondary"
            >
                <View className="flex-row items-center justify-between">
                    <View className="flex-1 mr-3">
                        <View className="flex-row items-center gap-2 flex-wrap">
                            <Text className="text-foreground font-medium text-sm">{item.name}</Text>
                            {!item.isActive && (
                                <Badge variant="outline" className="px-1.5 py-0.5 bg-destructive/10 border-destructive/30">
                                    <Text className="text-[10px] text-destructive font-medium">Inactive</Text>
                                </Badge>
                            )}
                        </View>
                        <View className="flex-row items-center gap-2 mt-0.5">
                            <Text className="text-muted-foreground text-xs">SKU: {item.sku}</Text>
                            {item.category && (
                                <>
                                    <Text className="text-muted-foreground text-xs">·</Text>
                                    <Text className="text-muted-foreground text-xs">{item.category.name}</Text>
                                </>
                            )}
                        </View>
                    </View>
                    <View className="items-end gap-1">
                        <Text className="text-foreground font-bold text-sm">
                            {formatCurrency(item.price, user?.org.currency)}
                        </Text>
                        {item.cost != null && (
                            <Text className="text-muted-foreground text-xs">
                                Cost: {formatCurrency(item.cost, user?.org.currency)}
                            </Text>
                        )}
                    </View>
                </View>
            </Pressable>
        );
    }

    return (
        <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
            {/* Header */}
            <View className="px-4 pt-2 pb-3">
                <View className="flex-row items-center justify-between mb-3">
                    <View className="flex-row items-center gap-3">
                        <Pressable onPress={() => router.back()}>
                            <Ionicons name="arrow-back" size={24} color="hsl(0 0% 63.9%)" />
                        </Pressable>
                        <View>
                            <Text className="text-2xl font-bold text-foreground">Products</Text>
                            <Text className="text-muted-foreground text-xs">
                                {productsData?.total ?? 0} items in catalogue
                            </Text>
                        </View>
                    </View>
                    <Pressable
                        onPress={() => router.push("/(app)/products/add")}
                        className="bg-primary w-10 h-10 rounded-xl items-center justify-center"
                    >
                        <Ionicons name="add" size={22} color="hsl(0 0% 98%)" />
                    </Pressable>
                </View>

                {/* Search */}
                <View className="flex-row items-center bg-secondary rounded-lg px-3 h-11">
                    <Ionicons name="search" size={18} color="hsl(0 0% 45%)" />
                    <TextInput
                        placeholder="Search by name, SKU, or barcode..."
                        placeholderTextColor="hsl(0 0% 45%)"
                        value={search}
                        onChangeText={setSearch}
                        className="flex-1 ml-2 text-foreground text-sm"
                    />
                    {search.length > 0 && (
                        <Pressable onPress={() => setSearch("")}>
                            <Ionicons name="close-circle" size={18} color="hsl(0 0% 45%)" />
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
                                        : "bg-secondary border-border",
                                )}
                            >
                                <Text
                                    className={cn(
                                        "text-sm font-medium",
                                        selectedCategory === item.id ? "text-primary-foreground" : "text-foreground",
                                    )}
                                >
                                    {item.name}
                                </Text>
                            </Pressable>
                        )}
                    />
                )}
            </View>

            {/* List */}
            {isLoading ? (
                <View className="px-4 gap-3">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <Skeleton key={i} className="h-16 rounded-lg" />
                    ))}
                </View>
            ) : filtered.length === 0 ? (
                <View className="flex-1 items-center justify-center">
                    <Ionicons name="cube-outline" size={48} color="hsl(0 0% 45%)" />
                    <Text className="text-muted-foreground mt-3 text-base">No products found</Text>
                    <Pressable
                        onPress={() => router.push("/(app)/products/add")}
                        className="mt-4 flex-row items-center gap-2 bg-primary px-5 py-2.5 rounded-xl"
                    >
                        <Ionicons name="add" size={18} color="hsl(0 0% 98%)" />
                        <Text className="text-primary-foreground font-semibold text-sm">Add Product</Text>
                    </Pressable>
                </View>
            ) : (
                <FlatList
                    data={filtered}
                    keyExtractor={(item) => item.id}
                    renderItem={renderProduct}
                    ItemSeparatorComponent={() => <Separator className="ml-4" />}
                    refreshControl={
                        <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
                    }
                    contentContainerStyle={{ paddingBottom: 40 }}
                />
            )}

            <ConfirmDialog
                open={deleteTarget !== null}
                onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
                title="Delete Product"
                description={`Remove "${deleteTarget?.name}" from the catalogue? This cannot be undone.`}
                confirmText="Delete"
                destructive
                isLoading={isDeleting}
                onConfirm={() => {
                    if (deleteTarget) {
                        deleteProduct(undefined);
                        setDeleteTarget(null);
                    }
                }}
            />
        </View>
    );
}
