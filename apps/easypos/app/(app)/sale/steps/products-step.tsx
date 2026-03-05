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
                    "flex-1 m-1 rounded-xl border bg-card overflow-hidden",
                    inCart ? "border-primary" : "border-border",
                )}
            >
                {/* Image */}
                <View className="w-full aspect-square bg-secondary items-center justify-center overflow-hidden">
                    {item.imageUrl ? (
                        <Image
                            source={{ uri: item.imageUrl }}
                            className="w-full h-full"
                            resizeMode="cover"
                        />
                    ) : (
                        <Ionicons name="cube-outline" size={32} color={BRAND.mid} />
                    )}
                    {inCart && (
                        <View className="absolute top-1.5 right-1.5 bg-primary rounded-full w-5 h-5 items-center justify-center">
                            <Text className="text-primary-foreground text-[10px] font-bold">{qty}</Text>
                        </View>
                    )}
                </View>

                {/* Info */}
                <View className="px-2 pt-1.5 pb-2 gap-0.5">
                    <Text className="text-foreground text-xs font-medium leading-tight" numberOfLines={2}>
                        {item.name}
                    </Text>
                    <Text className="text-foreground font-bold text-sm">
                        {formatCurrency(item.price, user?.org.currency)}
                    </Text>

                    {/* Quantity stepper — only visible when in cart */}
                    {inCart && (
                        <View className="mt-1">
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
            {/* Search + categories */}
            <View className="px-4 py-3 gap-3">
                <View className="flex-row items-center bg-secondary rounded-xl px-3 h-11">
                    <Ionicons name="search" size={18} color={BRAND.dark} />
                    <TextInput
                        placeholder="Search products..."
                        placeholderTextColor={BRAND.dark}
                        value={search}
                        onChangeText={onSearchChange}
                        className="flex-1 ml-2 text-foreground text-sm"
                    />
                    {search.length > 0 && (
                        <Pressable onPress={() => onSearchChange("")}>
                            <Ionicons name="close-circle" size={18} color={BRAND.dark} />
                        </Pressable>
                    )}
                </View>

                {categories.length > 0 && (
                    <FlatList
                        horizontal
                        data={[{ id: null as any, name: "All" }, ...categories]}
                        keyExtractor={(item) => item.id ?? "all"}
                        showsHorizontalScrollIndicator={false}
                        renderItem={({ item }) => (
                            <Pressable
                                onPress={() => onCategoryChange(item.id)}
                                className={cn(
                                    "px-4 py-1.5 rounded-full mr-2 border",
                                    selectedCategory === item.id
                                        ? "bg-primary border-primary"
                                        : "bg-card border-border",
                                )}
                            >
                                <Text className={cn(
                                    "text-sm font-medium",
                                    selectedCategory === item.id
                                        ? "text-primary-foreground"
                                        : "text-foreground",
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
