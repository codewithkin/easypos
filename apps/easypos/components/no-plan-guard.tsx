/**
 * NoPlanGuard
 *
 * Wrap any screen that requires an active plan. If the current user's org
 * has plan === "none", this renders a full-screen prompt redirecting them to
 * the plans page instead of showing the screen content.
 *
 * Usage:
 *   export default function MyScreen() {
 *     return (
 *       <NoPlanGuard>
 *         { ...actual screen content... }
 *       </NoPlanGuard>
 *     );
 *   }
 */

import { useEffect } from "react";
import { View, ActivityIndicator } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/auth";
import { BRAND } from "@/lib/theme";

interface NoPlanGuardProps {
    children: React.ReactNode;
}

export function NoPlanGuard({ children }: NoPlanGuardProps) {
    const user = useAuthStore((s) => s.user);
    const isNoPlan = user?.org.plan === "none";

    useEffect(() => {
        if (isNoPlan) {
            router.replace("/(app)/billing/plans");
        }
    }, [isNoPlan]);

    if (isNoPlan) {
        return <NoPlanScreen />;
    }

    return <>{children}</>;
}

function NoPlanScreen() {
    const insets = useSafeAreaInsets();

    return (
        <View
            className="flex-1 bg-background items-center justify-center px-8"
            style={{ paddingTop: insets.top, paddingBottom: insets.bottom + 24 }}
        >
            <View className="w-20 h-20 rounded-3xl bg-primary/10 items-center justify-center mb-6">
                <Ionicons name="sparkles" size={40} color={BRAND.brand} />
            </View>

            <Text className="text-foreground font-bold text-2xl text-center leading-tight">
                Choose a Plan
            </Text>
            <Text className="text-muted-foreground text-sm text-center mt-3 leading-relaxed max-w-xs">
                You need an active plan to access this feature. Select a plan to unlock everything EasyPOS has to offer.
            </Text>

            <Button
                onPress={() => router.replace("/(app)/billing/plans")}
                className="mt-8 w-full"
            >
                <Text className="text-primary-foreground font-semibold text-base">
                    View Plans
                </Text>
            </Button>
        </View>
    );
}
