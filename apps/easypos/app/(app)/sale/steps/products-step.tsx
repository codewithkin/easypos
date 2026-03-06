import { useMemo } from "react";
import {
    View,
    FlatList,
    Pressable,
    TextInput,
    RefreshControl,
    Image,
    useWindowDimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { Text } from "@/components/ui/text";
import { Skeleton } from "@/components/ui/skeleton";
import { QuantityControl } from "@/components/quantity-control";
import { useApiQuery } from "@/hooks/use-api";
import { useAuthStore } from "@/store/auth";
import { useSaleStore, cartItemCount, cartTotal } from "@/store/sale";
import { formatCurrency } from "@easypos/utils";
import type { Category, Product } from "@easypos/types";
import { cn } from "@/lib/utils";
import { BRAND } from "@/lib/theme";

type ProductWithCategory = Product & { category?: { id: string; name: string } | null };

interface ProductsStepProps {
    search?: string;
    onSearchChange: (v: string) => void;
    selectedCategory: string | null;
    onCategoryChange: (id: string | null) => void;
}

/** Step 1 — Product selection grid */
export function ProductsStep({
    search = "",
    onSearchChange,
    selectedCategory,
    onCategoryChange,
}: ProductsStepProps) {
    const { width } = useWindowDimensions();
    const user = useAuthStore((s) => s.user);

    const { data: productsData, isLoading, refetch, isRefetching } = useApiQuery<{
        items: ProductWithCategory[];
        total: number;
    }>({
        queryKey: ["products", "active"],
        path: "/products?pageSize=200&active=true",
    });

    const { data: categoriesData } = useApiQuery<{ items: Category[] }>({
        queryKey: ["categories"],
        path: "/categories",
    });

    const { cart, addToCart, setQuantity } = useSaleStore();

    const categories = categoriesData?.items ?? [];
    const products = productsData?.items ?? [];

    const filtered = useMemo(() => {
        return products.filter((p) => {
            if (!p.isActive) return false;
            if (selectedCategory && p.categoryId !== selectedCategory) return false;
            if (search) {
                const q = search.toLowerCase();
                return (
                    p.name.toLowerCase().includes(q) ||
                    p.sku.toLowerCase().includes(q)
                );
            }
            return true;
        });
    }, [products, search, selectedCategory]);

    // Responsive columns: 2 on phone, 3 on 640+, 4 on 768+, 5 on 1024+
    const numColumns = width >= 1024 ? 5 : width >= 768 ? 4 : width >= 640 ? 3 : 2;

    function getCartQty(id: string) {
        return cart.find((i) => i.product.id === id)?.quantity ?? 0;
    }

    function handleTap(product: Product) {
        const qty = getCartQty(product.id);
        if (qty > 0) return; // subsequent taps ignored
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        addToCart(product);
    }

    function renderProduct({ item }: { item: ProductWithCategory }) {
        const qty = getCartQty(item.id);
        const inCart = qty > 0;

        return (
            <Pressable
                onPress={() => handleTap(item)}
                className={cn(
                    "flex-1 m-1.5 rounded-2xl border-2 bg-card overflow-hidden shadow-sm",
                    inCart ? "border-primary" : "border-border",
                )}
                style={{
                    shadowColor: BRAND.dark,
                    shadowOpacity: 0.05,
                    shadowRadius: 8,
                    elevation: 2,
                }}
            >
                {/* Image container with brand accent */}
                <View className="w-full aspect-square bg-gradient-to-b from-secondary to-secondary/50 items-center justify-center overflow-hidden relative">
                    {item.imageUrl ? (
                        <Image
                            source={{ uri: item.imageUrl }}
                            className="w-full h-full"
                            resizeMode="cover"
                        />
                    ) : (
                        <View className="items-center gap-1">
                            <Ionicons name="cube-outline" size={40} color={BRAND.mid} />
                            <Text className="text-muted-foreground text-xs">No image</Text>
                        </View>
                    )}

                    {/* In-cart badge */}
                    {inCart && (
                        <View
                            className="absolute top-2 right-2 bg-primary rounded-full w-6 h-6 items-center justify-center border-2 border-white"
                            style={{ shadowColor: BRAND.brand, shadowOpacity: 0.3, shadowRadius: 4, elevation: 3 }}
                        >
                            <Text className="text-primary-foreground text-xs font-bold">{qty}</Text>
                        </View>
                    )}

                    {/* Category badge */}
                    {item.category && (
                        <View className="absolute top-2 left-2 bg-yellow-100 px-2 py-1 rounded-lg">
                            <Text className="text-yellow-900 text-xs font-medium">{item.category.name}</Text>
                        </View>
                    )}
                </View>

                {/* Info section */}
                <View className="px-3 pt-3 pb-3 gap-1.5">
                    <Text className="text-foreground text-xs font-semibold leading-tight" numberOfLines={2}>
                        {item.name}
                    </Text>
                    <View className="flex-row items-baseline justify-between">
                        <Text className="text-primary font-bold text-base">
                            {formatCurrency(item.price, user?.org.currency)}
                        </Text>
                        {item.category && (
                            <Text className="text-muted-foreground text-xs">{item.sku}</Text>
                        )}
                    </View>

                    {/* Quantity stepper — only visible when in cart */}
                    {inCart && (
                        <View className="mt-2 pt-2 border-t border-primary/10">
                            <QuantityControl
                                quantity={qty}
                                onChange={(next) => setQuantity(item.id, next)}
                                size="sm"
                            />
                        </View>
                    )}
                </View>
            </Pressable>
        );
    }

    return (
        <View className="flex-1">
            {/* Search + categories with brand colors */}
            <View className="px-4 py-4 gap-3 bg-gradient-to-b from-primary/5 to-transparent">
                <View className="flex-row items-center bg-card rounded-xl px-3 h-11 border border-border">
                    <Ionicons name="search" size={18} color={BRAND.brand} />
                    <TextInput
                        placeholder="Search products..."
                        placeholderTextColor={BRAND.dark}
                        value={search}
                        onChangeText={onSearchChange}
                        className="flex-1 ml-2 text-foreground text-sm"
                    />
                    {search.length > 0 && (
                        <Pressable onPress={() => onSearchChange("")}>
                            <Ionicons name="close-circle" size={18} color={BRAND.mid} />
                        </Pressable>
                    )}
                </View>

                {categories.length > 0 && (
                    <FlatList
                        horizontal
                        data={[{ id: null as any, name: "All" }, ...categories]}
                        keyExtractor={(item) => item.id ?? "all"}
                        showsHorizontalScrollIndicator={false}
                        renderItem={({ item, index }) => (
                            <Pressable
                                onPress={() => onCategoryChange(item.id)}
                                className={cn(
                                    "px-4 py-2 rounded-full mr-2.5 border-2 font-medium",
                                    selectedCategory === item.id
                                        ? "bg-gradient-to-r from-primary to-primary/80 border-primary"
                                        : index === 0 ? "bg-yellow-50 border-yellow-200" : "bg-card border-border",
                                )}
                            >
                                <Text className={cn(
                                    "text-sm font-semibold",
                                    selectedCategory === item.id
                                        ? "text-primary-foreground"
                                        : index === 0 ? "text-yellow-900" : "text-foreground",
                                )}>
                                    {item.name}
                                </Text>
                            </Pressable>
                        )}
                    />
                )}
            </View>

            {/* Product grid */}
            {isLoading ? (
                <View className="flex-row flex-wrap px-2">
                    {Array.from({ length: numColumns * 2 }).map((_, i) => (
                        <View key={i} style={{ width: `${100 / numColumns}%` }} className="p-1">
                            <Skeleton className="rounded-xl aspect-square" />
                            <Skeleton className="h-3 rounded mt-1.5 w-3/4" />
                            <Skeleton className="h-3 rounded mt-1 w-1/2" />
                        </View>
                    ))}
                </View>
            ) : (
                <FlatList
                    key={numColumns}              // remount on column count change
                    data={filtered}
                    keyExtractor={(item) => item.id}
                    renderItem={renderProduct}
                    numColumns={numColumns}
                    contentContainerStyle={{ paddingHorizontal: 6, paddingBottom: 120 }}
                    refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
                    extraData={cart}
                    ListEmptyComponent={
                        <View className="items-center py-16">
                            <Ionicons name="cube-outline" size={44} color={BRAND.mid} />
                            <Text className="text-muted-foreground mt-2 text-sm">
                                {search ? "No products match your search" : "No products found"}
                            </Text>
                        </View>
                    }
                />
            )}
        </View>
    );
}

/** Footer summary bar for step 1 */
export function ProductsFooterInfo() {
    const { cart } = useSaleStore();
    const user = useAuthStore((s) => s.user);
    const cartArray = cart ?? [];
    const count = cartItemCount(cartArray);
    const total = cartTotal(cartArray);

    if (cartArray.length === 0) return null;

    return (
        <View className="flex-row items-center flex-1 mr-3">
            <Text className="text-muted-foreground text-xs">
                {count} {count === 1 ? "item" : "items"} ·{" "}
                <Text className="text-foreground font-bold text-base">
                    {formatCurrency(total, user?.org.currency)}
                </Text>
            </Text>
        </View>
    );
}
