import { useState } from "react";
import { View, ScrollView, Pressable } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";

import { Text } from "@/components/ui/text";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useApiQuery, useApiPost } from "@/hooks/use-api";
import { toast } from "@/lib/toast";
import type { Category } from "@easypos/types";
import { cn } from "@/lib/utils";

interface Field {
    name: string;
    sku: string;
    barcode: string;
    price: string;
    cost: string;
}

export default function AddProductScreen() {
    const insets = useSafeAreaInsets();
    const [fields, setFields] = useState<Field>({
        name: "",
        sku: "",
        barcode: "",
        price: "",
        cost: "",
    });
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [isActive, setIsActive] = useState(true);

    const { data: categoriesData } = useApiQuery<{ items: Category[] }>({
        queryKey: ["categories"],
        path: "/categories",
    });

    const { mutate: createProduct, isPending } = useApiPost<unknown, unknown>({
        path: "/products",
        invalidateKeys: [["products"]],
        onSuccess: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            toast.success("Product Created", "The product has been added to your catalogue.");
            router.back();
        },
        onError: (err) => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            toast.error("Save Failed", err.message);
        },
    });

    function set(key: keyof Field) {
        return (value: string) => setFields((prev) => ({ ...prev, [key]: value }));
    }

    function handleSubmit() {
        if (!fields.name.trim()) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            toast.warning("Missing Field", "Product name is required.");
            return;
        }
        if (!fields.sku.trim()) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            toast.warning("Missing Field", "SKU is required.");
            return;
        }
        const price = parseFloat(fields.price);
        if (!fields.price || isNaN(price) || price <= 0) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            toast.warning("Invalid Price", "Enter a valid selling price.");
            return;
        }

        const body: any = {
            name: fields.name.trim(),
            sku: fields.sku.trim(),
            price,
            isActive,
        };

        if (fields.barcode.trim()) body.barcode = fields.barcode.trim();
        if (fields.cost.trim()) {
            const cost = parseFloat(fields.cost);
            if (!isNaN(cost) && cost > 0) body.cost = cost;
        }
        if (selectedCategory) body.categoryId = selectedCategory;

        createProduct(body);
    }

    const categories = categoriesData?.items ?? [];

    return (
        <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
            {/* Header */}
            <View className="flex-row items-center px-4 h-14 border-b border-border bg-card">
                <Pressable onPress={() => router.back()} className="mr-3">
                    <Ionicons name="close" size={24} color="hsl(0 0% 63.9%)" />
                </Pressable>
                <Text className="text-foreground font-semibold text-lg flex-1">Add Product</Text>
                <Pressable onPress={handleSubmit} disabled={isPending}>
                    <Text className={cn("font-semibold text-sm", isPending ? "text-muted-foreground" : "text-primary")}>
                        {isPending ? "Saving..." : "Save"}
                    </Text>
                </Pressable>
            </View>

            <ScrollView className="flex-1 px-4" contentContainerStyle={{ paddingBottom: 40 }}>
                {/* Basic info */}
                <Text className="text-muted-foreground text-xs uppercase tracking-wider mt-5 mb-3">
                    Basic Info
                </Text>
                <View className="gap-4">
                    <View className="gap-1.5">
                        <Label nativeID="name">Product Name *</Label>
                        <Input
                            id="name"
                            placeholder="e.g. Coca-Cola 500ml"
                            value={fields.name}
                            onChangeText={set("name")}
                            className="h-11"
                        />
                    </View>
                    <View className="flex-row gap-3">
                        <View className="flex-1 gap-1.5">
                            <Label nativeID="sku">SKU *</Label>
                            <Input
                                id="sku"
                                placeholder="e.g. COKE-500"
                                value={fields.sku}
                                onChangeText={set("sku")}
                                autoCapitalize="characters"
                                className="h-11"
                            />
                        </View>
                        <View className="flex-1 gap-1.5">
                            <Label nativeID="barcode">Barcode</Label>
                            <Input
                                id="barcode"
                                placeholder="Optional"
                                value={fields.barcode}
                                onChangeText={set("barcode")}
                                keyboardType="numeric"
                                className="h-11"
                            />
                        </View>
                    </View>
                </View>

                <Separator className="my-5" />

                {/* Pricing */}
                <Text className="text-muted-foreground text-xs uppercase tracking-wider mb-3">
                    Pricing
                </Text>
                <View className="flex-row gap-3">
                    <View className="flex-1 gap-1.5">
                        <Label nativeID="price">Selling Price *</Label>
                        <Input
                            id="price"
                            placeholder="0"
                            value={fields.price}
                            onChangeText={set("price")}
                            keyboardType="numeric"
                            className="h-11"
                        />
                    </View>
                    <View className="flex-1 gap-1.5">
                        <Label nativeID="cost">Cost Price</Label>
                        <Input
                            id="cost"
                            placeholder="Optional"
                            value={fields.cost}
                            onChangeText={set("cost")}
                            keyboardType="numeric"
                            className="h-11"
                        />
                    </View>
                </View>

                <Separator className="my-5" />

                {/* Category */}
                {categories.length > 0 && (
                    <>
                        <Text className="text-muted-foreground text-xs uppercase tracking-wider mb-3">
                            Category
                        </Text>
                        <View className="flex-row flex-wrap gap-2">
                            <Pressable
                                onPress={() => setSelectedCategory(null)}
                                className={cn(
                                    "px-4 py-2 rounded-full border",
                                    selectedCategory === null ? "bg-primary border-primary" : "bg-secondary border-border",
                                )}
                            >
                                <Text className={cn("text-sm font-medium", selectedCategory === null ? "text-primary-foreground" : "text-foreground")}>
                                    None
                                </Text>
                            </Pressable>
                            {categories.map((cat) => (
                                <Pressable
                                    key={cat.id}
                                    onPress={() => setSelectedCategory(cat.id)}
                                    className={cn(
                                        "px-4 py-2 rounded-full border",
                                        selectedCategory === cat.id ? "bg-primary border-primary" : "bg-secondary border-border",
                                    )}
                                >
                                    <Text className={cn("text-sm font-medium", selectedCategory === cat.id ? "text-primary-foreground" : "text-foreground")}>
                                        {cat.name}
                                    </Text>
                                </Pressable>
                            ))}
                        </View>
                        <Separator className="my-5" />
                    </>
                )}

                {/* Status */}
                <Text className="text-muted-foreground text-xs uppercase tracking-wider mb-3">
                    Visibility
                </Text>
                <View className="flex-row gap-3">
                    {[true, false].map((val) => (
                        <Pressable
                            key={String(val)}
                            onPress={() => setIsActive(val)}
                            className={cn(
                                "flex-1 py-3 rounded-xl border items-center",
                                isActive === val ? "bg-primary/10 border-primary" : "bg-secondary border-border",
                            )}
                        >
                            <Text className={cn("font-medium text-sm", isActive === val ? "text-primary" : "text-foreground")}>
                                {val ? "Active" : "Inactive"}
                            </Text>
                            <Text className="text-muted-foreground text-xs mt-0.5">
                                {val ? "Shown on POS" : "Hidden from POS"}
                            </Text>
                        </Pressable>
                    ))}
                </View>
            </ScrollView>

            {/* Save button */}
            <View className="px-4 py-3 bg-card border-t border-border" style={{ paddingBottom: insets.bottom + 12 }}>
                <Button onPress={handleSubmit} disabled={isPending} className="h-12 w-full">
                    <Text className="text-primary-foreground font-bold text-base">
                        {isPending ? "Saving..." : "Add Product"}
                    </Text>
                </Button>
            </View>
        </View>
    );
}
