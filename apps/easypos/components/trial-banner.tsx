import { useState, useMemo } from "react";
import { View, Pressable } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { Text } from "@/components/ui/text";
import { useAuthStore } from "@/store/auth";
import { BRAND } from "@/lib/theme";

export function TrialBanner() {
    const user = useAuthStore((s) => s.user);
    const [dismissed, setDismissed] = useState(false);

    const trialInfo = useMemo(() => {
        if (!user || user.org.plan !== "none" || !user.org.trialEndsAt) return null;

        const endsAt = new Date(user.org.trialEndsAt);
        const now = new Date();
        const diff = endsAt.getTime() - now.getTime();
        if (diff <= 0) return null;

        const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
        const hours = Math.ceil(diff / (1000 * 60 * 60));
        const seconds = Math.ceil(diff / 1000);

        return {
            days,
            hours,
            label: days >= 1 ? `${days} day${days !== 1 ? "s" : ""} left` : hours >= 1 ? `${hours}h left` : `${seconds}s left`,
            urgent: days <= 1,
            planName: user.org.trialPlan
                ? user.org.trialPlan.charAt(0).toUpperCase() + user.org.trialPlan.slice(1)
                : "Trial",
        };
    }, [user]);

    if (!trialInfo || dismissed) return null;

    return (
        <View
            className={`flex-row items-center px-4 py-2.5 ${
                trialInfo.urgent ? "bg-amber-500/15" : "bg-primary/10"
            }`}
        >
            <Ionicons
                name={trialInfo.urgent ? "warning" : "time-outline"}
                size={16}
                color={trialInfo.urgent ? "#d97706" : BRAND.brand}
            />
            <Text
                className={`flex-1 text-xs font-medium ml-2 ${
                    trialInfo.urgent ? "text-amber-600 dark:text-amber-400" : "text-primary"
                }`}
            >
                {trialInfo.planName} trial · {trialInfo.label}
            </Text>

            <Pressable
                onPress={() => router.push("/(app)/billing/plans" as any)}
                className="bg-primary px-3 py-1 rounded-full mr-2"
            >
                <Text className="text-primary-foreground text-xs font-bold">Upgrade</Text>
            </Pressable>

            <Pressable onPress={() => setDismissed(true)} hitSlop={8}>
                <Ionicons name="close" size={16} color="#888" />
            </Pressable>
        </View>
    );
}
