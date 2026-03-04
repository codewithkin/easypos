import { useState, useMemo, useCallback } from "react";
import {
    View,
    FlatList,
    Pressable,
    TextInput,
    RefreshControl,
    useWindowDimensions,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";

import { Text } from "@/components/ui/text";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuthStore } from "@/store/auth";
import { useApiQuery } from "@/hooks/use-api";
import { formatCurrency } from "@easypos/utils";
import type { Product, Category } from "@easypos/types";
import { cn } from "@/lib/utils";
import { BRAND } from "@/lib/theme";

interface CartItem {
    product: Product;
    quantity: number;
}

type ProductWithCategory = Product & { category?: { id: string; name: string } | null };

export default function CreateSaleScreen() {
    const insets = useSafeAreaInsets();
    const { width } = useWindowDimensions();
    const isTablet = width >= 768;
    const user = useAuthStore((s) => s.user);

    const [search, setSearch] = useState("");
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [cart, setCart] = useState<CartItem[]>([]);

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

    const products = productsData?.items ?? [];
    const categories = categoriesData?.items ?? [];

    const filtered = useMemo(() => {
        return products.filter((p) => {
            if (!p.isActive) return false;
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

    const cartTotal = useMemo(
        () => cart.reduce((sum, i) => sum + i.product.price * i.quantity, 0),
        [cart],
    );
    const cartItemCount = useMemo(
        () => cart.reduce((sum, i) => sum + i.quantity, 0),
        [cart],
    );

    const addToCart = useCallback((product: Product) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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

    const updateQuantity = useCallback((productId: string, delta: number) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setCart((prev) =>
            prev
                .map((i) =>
                    i.product.id === productId ? { ...i, quantity: i.quantity + delta } : i,
                )
                .filter((i) => i.quantity > 0),
        );
    }, []);

    function handleCheckout() {
        if (cart.length === 0) return;
        router.push({
            pathname: "/(app)/checkout",
            params: {
                cart: JSON.stringify(
                    cart.map((i) => ({ productId: i.product.id, quantity: i.quantity })),
                ),
            },
        });
    }

    function getCartQuantity(productId: string): number {
        return cart.find((i) => i.product.id === productId)?.quantity ?? 0;
    }

    // ── Product tile ──
    function renderProduct({ item }: { item: ProductWithCategory }) {
        const qty = getCartQuantity(item.id);
        return (
            <Pressable
                onPress={() => addToCart(item)}
                className={cn(
                    "flex-1 m-1.5 p-3 rounded-xl border bg-card",
                    qty > 0 ? "border-primary" : "border-border",
                )}
            >
                <View className="flex-row items-start justify-between">
                    <View className="flex-1 mr-2">
                        <Text className="text-foreground font-medium text-sm" numberOfLines={2}>
                            {item.name}
                        </Text>
                        {item.category && (
                            <Text className="text-muted-foreground text-xs mt-0.5">
                                {item.category.name}
                            </Text>
                        )}
                    </View>
                    {qty > 0 && (
                        <View className="bg-primary w-6 h-6 rounded-full items-center justify-center">
                            <Text className="text-primary-foreground text-xs font-bold">{qty}</Text>
                        </View>
                    )}
                </View>
                <Text className="text-foreground font-bold text-base mt-2">
                    {formatCurrency(item.price, user?.org.currency)}
                </Text>
            </Pressable>
        );
    }

    // ── Cart item row ──
    function renderCartItem({ item }: { item: CartItem }) {
        return (
            <View className="flex-row items-center py-2.5">
                <View className="flex-1 mr-2">
                    <Text className="text-foreground text-sm font-medium" numberOfLines={1}>
                        {item.product.name}
                    </Text>
                    <Text className="text-muted-foreground text-xs">
                        {formatCurrency(item.product.price, user?.org.currency)} each
                    </Text>
                </View>
                <View className="flex-row items-center gap-2">
                    <Pressable
                        onPress={() => updateQuantity(item.product.id, -1)}
                        className="w-8 h-8 rounded-lg bg-secondary items-center justify-center"
                    >
                        <Ionicons name="remove" size={16} color={BRAND.darkest} />
                    </Pressable>
                    <Text className="text-foreground font-bold text-sm w-6 text-center">
                        {item.quantity}
                    </Text>
                    <Pressable
                        onPress={() => updateQuantity(item.product.id, 1)}
                        className="w-8 h-8 rounded-lg bg-secondary items-center justify-center"
                    >
                        <Ionicons name="add" size={16} color={BRAND.darkest} />
                    </Pressable>
                </View>
                <Text className="text-foreground font-bold text-sm w-20 text-right">
                    {formatCurrency(item.product.price * item.quantity, user?.org.currency)}
                </Text>
            </View>
        );
    }

    // ── Tablet: side-by-side layout ──
    if (isTablet) {
        return (
            <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
                {/* Header */}
                <View className="flex-row items-center px-5 h-14 border-b border-border bg-card">
                    <Pressable onPress={() => router.back()} className="mr-3">
                        <Ionicons name="arrow-back" size={24} color={BRAND.dark} />
                    </Pressable>
                    <Text className="text-foreground font-bold text-lg flex-1">New Sale</Text>
                </View>

                <View className="flex-1 flex-row">
                    {/* Left: Products */}
                    <View className="flex-1 border-r border-border">
                        <View className="px-4 py-3">
                            {/* Search */}
                            <View className="flex-row items-center bg-secondary rounded-xl px-3 h-11">
                                <Ionicons name="search" size={18} color={BRAND.dark} />
                                <TextInput
                                    placeholder="Search products..."
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

                            {/* Categories */}
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

                        {isLoading ? (
                            <View className="flex-row flex-wrap px-2.5">
                                {Array.from({ length: 8 }).map((_, i) => (
                                    <View key={i} className="w-1/3 p-1.5">
                                        <Skeleton className="h-24 rounded-xl" />
                                    </View>
                                ))}
                            </View>
                        ) : (
                            <FlatList
                                data={filtered}
                                keyExtractor={(item) => item.id}
                                renderItem={renderProduct}
                                numColumns={3}
                                contentContainerStyle={{ paddingHorizontal: 6, paddingBottom: 20 }}
                                refreshControl={
                                    <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
                                }
                                ListEmptyComponent={() => (
                                    <View className="items-center py-12">
                                        <Ionicons name="cube-outline" size={40} color={BRAND.mid} />
                                        <Text className="text-muted-foreground mt-2">No products found</Text>
                                    </View>
                                )}
                            />
                        )}
                    </View>

                    {/* Right: Cart */}
                    <View className="w-80 bg-card">
                        <View className="px-4 pt-4 pb-2">
                            <Text className="text-foreground font-bold text-lg">Cart</Text>
                            <Text className="text-muted-foreground text-xs">
                                {cartItemCount} {cartItemCount === 1 ? "item" : "items"}
                            </Text>
                        </View>
                        <Separator />

                        {cart.length === 0 ? (
                            <View className="flex-1 items-center justify-center px-4">
                                <Ionicons name="cart-outline" size={40} color={BRAND.mid} />
                                <Text className="text-muted-foreground text-sm mt-2 text-center">
                                    Tap products to add them to the cart
                                </Text>
                            </View>
                        ) : (
                            <FlatList
                                data={cart}
                                keyExtractor={(item) => item.product.id}
                                renderItem={renderCartItem}
                                contentContainerStyle={{ paddingHorizontal: 16 }}
                                ItemSeparatorComponent={() => <Separator />}
                            />
                        )}

                        {/* Cart total + checkout */}
                        <View className="border-t border-border px-4 py-4" style={{ paddingBottom: insets.bottom + 12 }}>
                            <View className="flex-row justify-between mb-3">
                                <Text className="text-foreground font-bold text-lg">Total</Text>
                                <Text className="text-foreground font-bold text-lg">
                                    {formatCurrency(cartTotal, user?.org.currency)}
                                </Text>
                            </View>
                            <Button
                                onPress={handleCheckout}
                                disabled={cart.length === 0}
                                className="h-12 w-full"
                            >
                                <View className="flex-row items-center gap-2">
                                    <Ionicons name="checkmark-circle" size={20} color="hsl(0 0% 98%)" />
                                    <Text className="text-primary-foreground font-bold text-base">Checkout</Text>
                                </View>
                            </Button>
                        </View>
                    </View>
                </View>
            </View>
        );
    }

    // ── Phone layout ──
    return (
        <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
            {/* Header */}
            <View className="flex-row items-center px-4 h-14 border-b border-border bg-card">
                <Pressable onPress={() => router.back()} className="mr-3">
                    <Ionicons name="arrow-back" size={24} color={BRAND.dark} />
                </Pressable>
                <Text className="text-foreground font-bold text-lg flex-1">New Sale</Text>
                {cart.length > 0 && (
                    <Pressable
                        onPress={() => setCart([])}
                        className="px-3 py-1"
                    >
                        <Text className="text-destructive text-sm font-medium">Clear</Text>
                    </Pressable>
                )}
            </View>

            {/* Search */}
            <View className="px-4 py-3">
                <View className="flex-row items-center bg-secondary rounded-xl px-3 h-11">
                    <Ionicons name="search" size={18} color={BRAND.dark} />
                    <TextInput
                        placeholder="Search products..."
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

                {/* Categories */}
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
                <View className="flex-row flex-wrap px-2.5">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <View key={i} className="w-1/2 p-1.5">
                            <Skeleton className="h-24 rounded-xl" />
                        </View>
                    ))}
                </View>
            ) : (
                <FlatList
                    data={filtered}
                    keyExtractor={(item) => item.id}
                    renderItem={renderProduct}
                    numColumns={2}
                    contentContainerStyle={{ paddingHorizontal: 6, paddingBottom: cart.length > 0 ? 100 : 20 }}
                    refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
                    ListEmptyComponent={() => (
                        <View className="items-center py-12">
                            <Ionicons name="cube-outline" size={40} color={BRAND.mid} />
                            <Text className="text-muted-foreground mt-2">No products found</Text>
                        </View>
                    )}
                />
            )}

            {/* Bottom cart bar */}
            {cart.length > 0 && (
                <View
                    className="absolute bottom-0 left-0 right-0 bg-card border-t border-border px-4 py-3 flex-row items-center gap-3"
                    style={{ paddingBottom: insets.bottom + 12 }}
                >
                    <View className="flex-1">
                        <Text className="text-muted-foreground text-xs">
                            {cartItemCount} {cartItemCount === 1 ? "item" : "items"}
                        </Text>
                        <Text className="text-foreground font-bold text-lg">
                            {formatCurrency(cartTotal, user?.org.currency)}
                        </Text>
                    </View>
                    <Button onPress={handleCheckout} className="h-12 px-6 flex-row items-center gap-2">
                        <Ionicons name="checkmark-circle" size={20} color="hsl(0 0% 98%)" />
                        <Text className="text-primary-foreground font-bold text-base">Checkout</Text>
                    </Button>
                </View>
            )}
        </View>
    );
}
