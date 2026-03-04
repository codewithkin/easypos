import { useState, useEffect } from "react";
import { View, ScrollView, Pressable } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";

import { Text } from "@/components/ui/text";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { useApiQuery, useApiPut, useApiPost } from "@/hooks/use-api";
import { useRole } from "@/hooks/use-role";
import { useAuthStore } from "@/store/auth";
import { formatCurrency } from "@easypos/utils";
import type { Product, Category, Tag } from "@easypos/types";
import { cn } from "@/lib/utils";
import { toast } from "@/lib/toast";

type ProductWithCategory = Product & {
    category?: { id: string; name: string } | null;
    tags?: { tag: { id: string; name: string } }[];
};

export default function EditProductScreen() {
    const insets = useSafeAreaInsets();
    const { id, confirmDelete } = useLocalSearchParams<{ id: string; confirmDelete?: string }>();
    const { canManage } = useRole();
    const user = useAuthStore((s) => s.user);

    const { data: product, isLoading } = useApiQuery<ProductWithCategory>({
        queryKey: ["product", id],
        path: `/products/${id}`,
    });

    const { data: categoriesData } = useApiQuery<{ items: Category[] }>({
        queryKey: ["categories"],
        path: "/categories",
    });

    const { data: tagsData, refetch: refetchTags } = useApiQuery<{ items: (Tag & { _count?: { products: number } })[] }>({
        queryKey: ["tags"],
        path: "/tags",
    });

    const { mutate: createTag } = useApiPost<Tag, { name: string }>({
        path: "/tags",
        invalidateKeys: [["tags"]],
        onSuccess: (tag) => {
            setSelectedTags((prev) => [...prev, tag.id]);
            setNewTagName("");
            refetchTags();
        },
    });

    const [name, setName] = useState("");
    const [sku, setSku] = useState("");
    const [barcode, setBarcode] = useState("");
    const [price, setPrice] = useState("");
    const [cost, setCost] = useState("");
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [newTagName, setNewTagName] = useState("");
    const [isActive, setIsActive] = useState(true);
    const [populated, setPopulated] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);

    useEffect(() => {
        if (product && !populated) {
            setName(product.name);
            setSku(product.sku);
            setBarcode(product.barcode ?? "");
            setPrice(String(product.price));
            setCost(product.cost != null ? String(product.cost) : "");
            setSelectedCategory(product.categoryId ?? null);
            setSelectedTags(product.tags?.map((t) => t.tag.id) ?? []);
            setIsActive(product.isActive);
            setPopulated(true);

            // If coming from confirmDelete flow, trigger delete dialog
            if (confirmDelete === "true") {
                setShowDeleteDialog(true);
            }
        }
    }, [product]);

    const { mutate: updateProduct, isPending } = useApiPut<unknown, unknown>({
        path: `/products/${id}`,
        invalidateKeys: [["products"], ["product", id]],
        onSuccess: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            toast.success("Product Updated");
            router.back();
        },
        onError: (err) => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            toast.error("Update Failed", err.message);
        },
    });

    function handleToggleActive(active: boolean) {
        updateProduct({ isActive: active });
    }

    function handleSubmit() {
        if (!name.trim() || !sku.trim()) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            toast.warning("Missing Fields", "Name and SKU are required.");
            return;
        }
        const parsedPrice = parseFloat(price);
        if (isNaN(parsedPrice) || parsedPrice <= 0) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            toast.warning("Invalid Price", "Enter a valid selling price.");
            return;
        }

        const body: any = { name: name.trim(), sku: sku.trim(), price: parsedPrice, isActive };
        if (barcode.trim()) body.barcode = barcode.trim();
        if (cost.trim()) {
            const c = parseFloat(cost);
            if (!isNaN(c) && c > 0) body.cost = c;
        }
        body.categoryId = selectedCategory ?? undefined;
        body.tagIds = selectedTags;

        updateProduct(body);
    }

    const categories = categoriesData?.items ?? [];

    if (isLoading) {
        return (
            <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
                <View className="flex-row items-center px-4 h-14 border-b border-border bg-card">
                    <Pressable onPress={() => router.back()} className="mr-3">
                        <Ionicons name="arrow-back" size={24} color="hsl(0 0% 63.9%)" />
                    </Pressable>
                    <Skeleton className="h-5 w-40" />
                </View>
                <View className="px-4 gap-4 mt-5">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <Skeleton key={i} className="h-11 rounded-lg" />
                    ))}
                </View>
            </View>
        );
    }

    return (
        <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
            {/* Header */}
            <View className="flex-row items-center px-4 h-14 border-b border-border bg-card">
                <Pressable onPress={() => router.back()} className="mr-3">
                    <Ionicons name="arrow-back" size={24} color="hsl(0 0% 63.9%)" />
                </Pressable>
                <Text className="text-foreground font-semibold text-lg flex-1" numberOfLines={1}>
                    {product?.name ?? "Edit Product"}
                </Text>
                {canManage && (
                    <Pressable onPress={handleSubmit} disabled={isPending}>
                        <Text className={cn("font-semibold text-sm", isPending ? "text-muted-foreground" : "text-primary")}>
                            {isPending ? "Saving..." : "Save"}
                        </Text>
                    </Pressable>
                )}
            </View>

            {/* Read-only for Staff */}
            {!canManage && product && (
                <View className="flex-1 px-4 py-6">
                    <View className="p-4 rounded-xl bg-card border border-border gap-3">
                        <View className="flex-row justify-between">
                            <Text className="text-muted-foreground text-sm">Name</Text>
                            <Text className="text-foreground font-medium text-sm">{product.name}</Text>
                        </View>
                        <Separator />
                        <View className="flex-row justify-between">
                            <Text className="text-muted-foreground text-sm">SKU</Text>
                            <Text className="text-foreground font-medium text-sm">{product.sku}</Text>
                        </View>
                        <Separator />
                        <View className="flex-row justify-between">
                            <Text className="text-muted-foreground text-sm">Price</Text>
                            <Text className="text-foreground font-bold text-sm">
                                {formatCurrency(product.price, user?.org.currency)}
                            </Text>
                        </View>
                        {product.category && (
                            <>
                                <Separator />
                                <View className="flex-row justify-between">
                                    <Text className="text-muted-foreground text-sm">Category</Text>
                                    <Text className="text-foreground font-medium text-sm">{product.category.name}</Text>
                                </View>
                            </>
                        )}
                    </View>
                </View>
            )}

            {/* Editable form for Admin/Manager */}
            {canManage && (
                <>
                    <ScrollView className="flex-1 px-4" contentContainerStyle={{ paddingBottom: 40 }}>
                        <Text className="text-muted-foreground text-xs uppercase tracking-wider mt-5 mb-3">Basic Info</Text>
                        <View className="gap-4">
                            <View className="gap-1.5">
                                <Label nativeID="name">Product Name *</Label>
                                <Input id="name" value={name} onChangeText={setName} className="h-11" />
                            </View>
                            <View className="flex-row gap-3">
                                <View className="flex-1 gap-1.5">
                                    <Label nativeID="sku">SKU *</Label>
                                    <Input id="sku" value={sku} onChangeText={setSku} autoCapitalize="characters" className="h-11" />
                                </View>
                                <View className="flex-1 gap-1.5">
                                    <Label nativeID="barcode">Barcode</Label>
                                    <Input id="barcode" value={barcode} onChangeText={setBarcode} keyboardType="numeric" className="h-11" />
                                </View>
                            </View>
                        </View>

                        <Separator className="my-5" />
                        <Text className="text-muted-foreground text-xs uppercase tracking-wider mb-3">Pricing</Text>
                        <View className="flex-row gap-3">
                            <View className="flex-1 gap-1.5">
                                <Label nativeID="price">Selling Price *</Label>
                                <Input id="price" value={price} onChangeText={setPrice} keyboardType="numeric" className="h-11" />
                            </View>
                            <View className="flex-1 gap-1.5">
                                <Label nativeID="cost">Cost Price</Label>
                                <Input id="cost" value={cost} onChangeText={setCost} keyboardType="numeric" className="h-11" />
                            </View>
                        </View>

                        {categories.length > 0 && (
                            <>
                                <Separator className="my-5" />
                                <Text className="text-muted-foreground text-xs uppercase tracking-wider mb-3">Category</Text>
                                <View className="flex-row flex-wrap gap-2">
                                    <Pressable
                                        onPress={() => setSelectedCategory(null)}
                                        className={cn("px-4 py-2 rounded-full border", !selectedCategory ? "bg-primary border-primary" : "bg-secondary border-border")}
                                    >
                                        <Text className={cn("text-sm font-medium", !selectedCategory ? "text-primary-foreground" : "text-foreground")}>None</Text>
                                    </Pressable>
                                    {categories.map((cat) => (
                                        <Pressable
                                            key={cat.id}
                                            onPress={() => setSelectedCategory(cat.id)}
                                            className={cn("px-4 py-2 rounded-full border", selectedCategory === cat.id ? "bg-primary border-primary" : "bg-secondary border-border")}
                                        >
                                            <Text className={cn("text-sm font-medium", selectedCategory === cat.id ? "text-primary-foreground" : "text-foreground")}>{cat.name}</Text>
                                        </Pressable>
                                    ))}
                                </View>
                            </>
                        )}

                        <Separator className="my-5" />
                        <Text className="text-muted-foreground text-xs uppercase tracking-wider mb-3">Tags</Text>
                        <View className="flex-row flex-wrap gap-2 mb-3">
                            {(tagsData?.items ?? []).map((tag) => {
                                const isSelected = selectedTags.includes(tag.id);
                                return (
                                    <Pressable
                                        key={tag.id}
                                        onPress={() => {
                                            setSelectedTags((prev) =>
                                                isSelected ? prev.filter((t) => t !== tag.id) : [...prev, tag.id],
                                            );
                                        }}
                                        className={cn(
                                            "px-3 py-1.5 rounded-full border",
                                            isSelected ? "bg-primary border-primary" : "bg-secondary border-border",
                                        )}
                                    >
                                        <Text className={cn("text-sm", isSelected ? "text-primary-foreground font-medium" : "text-foreground")}>
                                            {tag.name}
                                        </Text>
                                    </Pressable>
                                );
                            })}
                        </View>
                        <View className="flex-row gap-2 items-center">
                            <Input
                                placeholder="Create new tag..."
                                value={newTagName}
                                onChangeText={setNewTagName}
                                className="flex-1 h-10"
                                onSubmitEditing={() => {
                                    if (newTagName.trim()) createTag({ name: newTagName.trim() });
                                }}
                            />
                            <Pressable
                                onPress={() => {
                                    if (newTagName.trim()) createTag({ name: newTagName.trim() });
                                }}
                                className="h-10 w-10 rounded-xl bg-primary items-center justify-center"
                            >
                                <Ionicons name="add" size={20} color="hsl(0 0% 98%)" />
                            </Pressable>
                        </View>

                        <Separator className="my-5" />
                        <Text className="text-muted-foreground text-xs uppercase tracking-wider mb-3">Visibility</Text>
                        <View className="flex-row gap-3">
                            {[true, false].map((val) => (
                                <Pressable
                                    key={String(val)}
                                    onPress={() => setIsActive(val)}
                                    className={cn("flex-1 py-3 rounded-xl border items-center", isActive === val ? "bg-primary/10 border-primary" : "bg-secondary border-border")}
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

                    <View className="px-4 py-3 bg-card border-t border-border" style={{ paddingBottom: insets.bottom + 12 }}>
                        <Button onPress={handleSubmit} disabled={isPending} className="h-12 w-full">
                            <Text className="text-primary-foreground font-bold text-base">
                                {isPending ? "Saving..." : "Save Changes"}
                            </Text>
                        </Button>
                    </View>
                </>
            )}
            {/* Delete confirmation (from confirmDelete query param) */}
            <ConfirmDialog
                open={showDeleteDialog}
                onOpenChange={setShowDeleteDialog}
                title="Delete Product"
                description={`Remove "${product?.name ?? "this product"}" from the catalogue? This cannot be undone.`}
                confirmText="Delete"
                destructive
                isLoading={isPending}
                onConfirm={() => handleToggleActive(false)}
            />
        </View>
    );
}
