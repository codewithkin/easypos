import { useState } from "react";
import { View, ScrollView, Pressable, Image, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";

import { Text } from "@/components/ui/text";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { BackButton } from "@/components/back-button";
import { useApiQuery, useApiPost } from "@/hooks/use-api";
import { toast } from "@/lib/toast";
import { pickAndUploadSquareImage } from "@/lib/upload";
import type { Category, Tag } from "@easypos/types";
import { cn } from "@/lib/utils";
import { BRAND } from "@/lib/theme";
import { router } from "expo-router";

interface Field {
    name: string;
    price: string;
    cost: string;
}

export default function AddProductScreen() {
    const insets = useSafeAreaInsets();
    const [fields, setFields] = useState<Field>({
        name: "",
        price: "",
        cost: "",
    });
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [isActive, setIsActive] = useState(true);
    const [newTagName, setNewTagName] = useState("");
    const [imageUri, setImageUri] = useState<string | null>(null);
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [imageUploading, setImageUploading] = useState(false);

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

    async function handlePickImage() {
        try {
            setImageUploading(true);
            const url = await pickAndUploadSquareImage("products");
            if (url) {
                setImageUrl(url);
                setImageUri(url);
            }
        } catch (e: any) {
            toast.error("Image Upload Failed", e.message ?? "Could not upload image.");
        } finally {
            setImageUploading(false);
        }
    }

    function handleSubmit() {
        if (!fields.name.trim()) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            toast.warning("Missing Field", "Product name is required.");
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
            price,
            isActive,
        };

        if (fields.cost.trim()) {
            const cost = parseFloat(fields.cost);
            if (!isNaN(cost) && cost >= 0) body.cost = cost;
        }
        if (selectedCategory) body.categoryId = selectedCategory;
        if (selectedTags.length > 0) body.tagIds = selectedTags;
        if (imageUrl) body.imageUrl = imageUrl;

        createProduct(body);
    }

    const categories = categoriesData?.items ?? [];

    return (
        <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
            {/* Header */}
            <View className="flex-row items-center px-4 h-14 border-b border-border bg-card">
                <BackButton />
                <Text className="text-foreground font-semibold text-lg flex-1">Add Product</Text>
                <Pressable onPress={handleSubmit} disabled={isPending}>
                    <Text className={cn("font-semibold text-sm", isPending ? "text-muted-foreground" : "text-primary")}>
                        {isPending ? "Saving..." : "Save"}
                    </Text>
                </Pressable>
            </View>

            <ScrollView className="flex-1 px-4" contentContainerStyle={{ paddingBottom: 40 }}>
                {/* Product Image */}
                <View className="items-center mt-6 mb-2">
                    <Pressable
                        onPress={handlePickImage}
                        disabled={imageUploading}
                        className="w-32 h-32 rounded-2xl bg-secondary border-2 border-dashed border-primary/40 items-center justify-center overflow-hidden"
                    >
                        {imageUploading ? (
                            <ActivityIndicator color={BRAND.brand} />
                        ) : imageUri ? (
                            <Image source={{ uri: imageUri }} className="w-full h-full" resizeMode="cover" />
                        ) : (
                            <View className="items-center gap-1">
                                <Ionicons name="camera-outline" size={28} color="hsl(0 0% 45%)" />
                                <Text className="text-muted-foreground text-xs">Add Photo</Text>
                            </View>
                        )}
                    </Pressable>
                    {imageUri && !imageUploading && (
                        <Pressable onPress={handlePickImage} className="mt-2">
                            <Text className="text-primary text-xs font-medium">Change Photo</Text>
                        </Pressable>
                    )}
                </View>

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
                <Text className="text-muted-foreground text-xs mt-2">
                    Leave cost blank if unknown — that product won&apos;t be included in profit calculations.
                </Text>

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

                {/* Tags */}
                <Text className="text-muted-foreground text-xs uppercase tracking-wider mb-3">
                    Tags
                </Text>
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
                <Button onPress={handleSubmit} disabled={isPending || imageUploading} className="h-12 w-full">
                    <Text className="text-primary-foreground font-bold text-base">
                        {isPending ? "Saving..." : "Add Product"}
                    </Text>
                </Button>
            </View>
        </View>
    );
}
