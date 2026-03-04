import { Pressable } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

interface BackButtonProps {
    onPress?: () => void;
}

/**
 * Standardised back button used in all modal / stack screen headers.
 * Uses arrow-back on every screen by default.
 */
export function BackButton({ onPress }: BackButtonProps) {
    return (
        <Pressable
            onPress={onPress ?? (() => router.back())}
            className="mr-3 w-9 h-9 items-center justify-center"
            hitSlop={8}
        >
            <Ionicons name="arrow-back" size={24} color="hsl(0 0% 63.9%)" />
        </Pressable>
    );
}
