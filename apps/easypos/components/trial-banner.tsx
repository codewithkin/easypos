import { useEffect, useState, useMemo } from "react";
import { Modal, View, Pressable } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as SecureStore from "expo-secure-store";

import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/auth";

const DISMISS_KEY = "trial_reminder_dismissed_until";
// After dismissing, don't show again for 12 hours
const SNOOZE_HOURS = 12;
// Show the dialog when this many hours or fewer remain on the trial
const SHOW_THRESHOLD_HOURS = 48;

export function TrialBanner() {
    const user = useAuthStore((s) => s.user);
    const [visible, setVisible] = useState(false);

    const trialInfo = useMemo(() => {
        if (!user || user.org.plan !== "none" || !user.org.trialEndsAt) return null;

        const endsAt = new Date(user.org.trialEndsAt);
        const now = new Date();
        const diffMs = endsAt.getTime() - now.getTime();
        if (diffMs <= 0) return null;

        const totalHours = diffMs / (1000 * 60 * 60);
        const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        const hours = Math.ceil(totalHours);

        const timeLabel =
            days >= 2 ? `${days} days` :
            days === 1 ? "1 day" :
            hours > 1 ? `${hours} hours` : "less than an hour";

        const planName = user.org.trialPlan
            ? user.org.trialPlan.charAt(0).toUpperCase() + user.org.trialPlan.slice(1)
            : "Free";

        return {
            timeLabel,
            planName,
            withinThreshold: totalHours <= SHOW_THRESHOLD_HOURS,
        };
    }, [user]);

    useEffect(() => {
        if (!trialInfo?.withinThreshold) return;

        SecureStore.getItemAsync(DISMISS_KEY).then((val) => {
            if (val) {
                const snoozedUntil = new Date(val);
                if (snoozedUntil > new Date()) return; // Still snoozed
            }
            setVisible(true);
        });
    }, [trialInfo?.withinThreshold]);

    async function dismiss() {
        const snoozedUntil = new Date(Date.now() + SNOOZE_HOURS * 60 * 60 * 1000);
        await SecureStore.setItemAsync(DISMISS_KEY, snoozedUntil.toISOString());
        setVisible(false);
    }

    function goToPlans() {
        dismiss();
        router.push("/(app)/billing/plans" as any);
    }

    if (!visible || !trialInfo) return null;

    return (
        <Modal
            transparent
            animationType="fade"
            visible={visible}
            onRequestClose={dismiss}
            statusBarTranslucent
        >
            <View className="flex-1 bg-black/60 items-center justify-center px-6">
                <View className="bg-background rounded-3xl p-6 w-full max-w-sm shadow-xl">
                    {/* Close button */}
                    <Pressable
                        onPress={dismiss}
                        className="absolute right-4 top-4 w-8 h-8 rounded-full bg-muted items-center justify-center"
                        hitSlop={12}
                    >
                        <Ionicons name="close" size={16} color="#888" />
                    </Pressable>

                    {/* Icon */}
                    <View className="items-center mb-5">
                        <View className="w-16 h-16 rounded-2xl bg-amber-500/15 items-center justify-center">
                            <Ionicons name="time" size={32} color="#d97706" />
                        </View>
                    </View>

                    {/* Title */}
                    <Text className="text-foreground font-bold text-xl text-center mb-2">
                        Trial ending soon
                    </Text>

                    {/* Subtitle */}
                    <Text className="text-muted-foreground text-sm text-center leading-5 mb-6 px-2">
                        You have{" "}
                        <Text className="text-foreground font-semibold">{trialInfo.timeLabel}</Text>{" "}
                        left on your {trialInfo.planName} trial. Pick a plan to keep selling without
                        interruption.
                    </Text>

                    {/* CTA */}
                    <Button onPress={goToPlans} className="w-full">
                        <Text className="text-primary-foreground font-semibold">View Plans</Text>
                    </Button>

                    {/* Dismiss */}
                    <Pressable onPress={dismiss} className="mt-3 items-center py-2" hitSlop={8}>
                        <Text className="text-muted-foreground text-sm">Remind me later</Text>
                    </Pressable>
                </View>
            </View>
        </Modal>
    );
}
