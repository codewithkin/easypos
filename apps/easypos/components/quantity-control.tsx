import { View, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { Text } from "@/components/ui/text";
import { BRAND } from "@/lib/theme";
import { cn } from "@/lib/utils";

interface QuantityControlProps {
    quantity: number;
    onChange: (qty: number) => void;
    /** Minimum value before the item is removed. @default 0 */
    min?: number;
    size?: "sm" | "md";
}

/**
 * Inline quantity stepper:  ─ [ – ]  2  [ + ] ─
 * When quantity === 1 the minus button shows a trash/bin icon.
 * When quantity hits `min` (default 0) it's removed by the parent.
 */
export function QuantityControl({ quantity, onChange, min = 0, size = "md" }: QuantityControlProps) {
    const iconSize = size === "sm" ? 14 : 16;
    const btnClass = size === "sm"
        ? "w-7 h-7 rounded-lg"
        : "w-8 h-8 rounded-lg";
    const textClass = size === "sm"
        ? "text-foreground font-bold text-xs w-5 text-center"
        : "text-foreground font-bold text-sm w-6 text-center";

    function decrement() {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onChange(quantity - 1);
    }

    function increment() {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onChange(quantity + 1);
    }

    return (
        <View className="flex-row items-center gap-1.5">
            <Pressable
                onPress={decrement}
                disabled={quantity <= min}
                className={cn(
                    btnClass,
                    "items-center justify-center",
                    quantity <= min ? "bg-muted opacity-40" : "bg-secondary",
                )}
            >
                <Ionicons
                    name={quantity === 1 ? "trash-outline" : "remove"}
                    size={iconSize}
                    color={quantity === 1 ? BRAND.red : BRAND.darkest}
                />
            </Pressable>

            <Text className={textClass}>{quantity}</Text>

            <Pressable
                onPress={increment}
                className={cn(btnClass, "items-center justify-center bg-secondary")}
            >
                <Ionicons name="add" size={iconSize} color={BRAND.darkest} />
            </Pressable>
        </View>
    );
}
