import { useState, useMemo, useCallback } from "react";
import { View, FlatList, Pressable, TextInput } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuthStore } from "@/store/auth";
import { useApiQuery } from "@/hooks/use-api";
import { formatCurrency } from "@easypos/utils";
import type { Product, Category } from "@easypos/types";
import { cn } from "@/lib/utils";
import { toast } from "@/lib/toast";

interface CartItem {
    product: Product;
    quantity: number;
}

export default function POSScreen() {
    const insets = useSafeAreaInsets();
    const user = useAuthStore((s) => s.user);
    const [search, setSearch] = useState("");
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [cart, setCart] = useState<CartItem[]>([]);

    const { data: productsData, isLoading: productsLoading } = useApiQuery<{
        items: Product[];
    }>({
        queryKey: ["products"],
        path: "/products?pageSize=100",
    });

    const { data: categoriesData } = useApiQuery<{ items: Category[] }>({
        queryKey: ["categories"],
        path: "/categories",
    });

    const products = productsData?.items ?? [];
    const categories = categoriesData?.items ?? [];

    const filteredProducts = useMemo(() => {
        return products.filter((p) => {
            if (!p.isActive) return false;
            if (selectedCategory && p.categoryId !== selectedCategory) return false;
            if (search) {
                const q = search.toLowerCase();
                return p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q);
            }
            return true;
        });
    }, [products, search, selectedCategory]);

    const cartTotal = useMemo(() => {
        return cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
    }, [cart]);

    const cartItemCount = useMemo(() => {
        return cart.reduce((sum, item) => sum + item.quantity, 0);
    }, [cart]);

    const addToCart = useCallback((product: Product) => {
        setCart((prev) => {
            const existing = prev.find((i) => i.product.id === product.id);
            if (existing) {
                return prev.map((i) =>
                    i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i,
                );
            }
            return [...prev, { product, quantity: 1 }];
        });
    }, []);

    const removeFromCart = useCallback((productId: string) => {
        setCart((prev) => {
            const existing = prev.find((i) => i.product.id === productId);
            if (existing && existing.quantity > 1) {
                return prev.map((i) =>
                    i.product.id === productId ? { ...i, quantity: i.quantity - 1 } : i,
                );
            }
            return prev.filter((i) => i.product.id !== productId);
        });
    }, []);

    function handleCheckout() {
        if (cart.length === 0) {
            toast.error("Add products to start a sale.");
            return;
        }
        router.push({
            pathname: "/(app)/checkout",
            params: { cart: JSON.stringify(cart.map((i) => ({ productId: i.product.id, quantity: i.quantity }))) },
        });
    }

    const renderProduct = useCallback(
        ({ item }: { item: Product }) => {
            const inCart = cart.find((i) => i.product.id === item.id);
            return (
                <Pressable
                    onPress={() => addToCart(item)}
                    className={cn(
                        "flex-1 m-1.5 p-4 rounded-xl border bg-card",
                        inCart ? "border-primary" : "border-border",
                    )}
                    style={{ minHeight: 100 }}
                >
                    <Text className="text-foreground font-medium text-sm" numberOfLines={2}>
                        {item.name}
                    </Text>
                    <Text className="text-primary font-bold text-base mt-auto pt-2">
                        {formatCurrency(item.price, user?.org.currency)}
                    </Text>
                    {inCart && (
                        <View className="absolute top-2 right-2 bg-primary rounded-full w-6 h-6 items-center justify-center">
                            <Text className="text-primary-foreground text-xs font-bold">{inCart.quantity}</Text>
                        </View>
                    )}
                </Pressable>
            );
        },
        [cart, addToCart, user],
    );

    return (
        <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
            {/* Header */}
            <View className="px-4 pt-2 pb-3">
                <View className="flex-row items-center justify-between mb-3">
                    <View>
                        <Text className="text-2xl font-bold text-foreground">Start Sale</Text>
                        <Text className="text-muted-foreground text-xs">{user?.branch?.name ?? "No branch"}</Text>
                    </View>
                    {cartItemCount > 0 && (
                        <Button onPress={handleCheckout} className="flex-row items-center gap-2 h-11 px-5">
                            <Ionicons name="card" size={18} color="hsl(0 0% 98%)" />
                            <Text className="text-primary-foreground font-bold text-base">
                                {formatCurrency(cartTotal, user?.org.currency)}
                            </Text>
                        </Button>
                    )}
                </View>

                {/* Search */}
                <View className="flex-row items-center bg-secondary rounded-lg px-3 h-11">
                    <Ionicons name="search" size={18} color="hsl(0 0% 45%)" />
                    <TextInput
                        placeholder="Search products..."
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
                        data={[{ id: null, name: "All" } as any, ...categories]}
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

            {/* Product grid */}
            {productsLoading ? (
                <View className="flex-row flex-wrap px-2.5 gap-3 mt-2">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <Skeleton key={i} className="flex-1 min-w-[45%] h-28 rounded-xl m-1.5" />
                    ))}
                </View>
            ) : filteredProducts.length === 0 ? (
                <View className="flex-1 items-center justify-center">
                    <Ionicons name="cube-outline" size={48} color="hsl(0 0% 45%)" />
                    <Text className="text-muted-foreground mt-3 text-base">
                        {search ? "No products found" : "No products yet"}
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={filteredProducts}
                    keyExtractor={(item) => item.id}
                    renderItem={renderProduct}
                    numColumns={2}
                    contentContainerStyle={{ paddingHorizontal: 4, paddingBottom: 100 }}
                    showsVerticalScrollIndicator={false}
                />
            )}

            {/* Cart summary bar */}
            {cart.length > 0 && (
                <View
                    className="absolute bottom-0 left-0 right-0 bg-card border-t border-border px-4 py-3"
                    style={{ paddingBottom: insets.bottom + 12 }}
                >
                    <View className="flex-row items-center justify-between mb-2">
                        <View className="flex-row items-center gap-2">
                            <Badge variant="secondary">
                                <Text className="text-xs font-medium">{cartItemCount} items</Text>
                            </Badge>
                            <Pressable onPress={() => setCart([])}>
                                <Text className="text-destructive text-xs">Clear</Text>
                            </Pressable>
                        </View>
                        <Text className="text-foreground font-bold text-lg">
                            {formatCurrency(cartTotal, user?.org.currency)}
                        </Text>
                    </View>

                    <Button onPress={handleCheckout} className="h-12 w-full">
                        <Text className="text-primary-foreground font-bold text-base">Charge</Text>
                    </Button>
                </View>
            )}
        </View>
    );
}
