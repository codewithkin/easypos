import { useState } from "react";
import { View, Pressable, Linking, ScrollView } from "react-native";
import { router, Stack } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import { BackButton } from "@/components/back-button";
import { useAuthStore } from "@/store/auth";
import { useApiPost } from "@/hooks/use-api";
import type { Plan } from "@easypos/types";
import { cn } from "@/lib/utils";
import { toast } from "@/lib/toast";
import { BRAND } from "@/lib/theme";
import plans from "@/lib/plans";

export default function PlansScreen() {
    const insets = useSafeAreaInsets();
    const user = useAuthStore((s) => s.user);
    const currentPlan = user?.org.plan ?? "none";
    const isFirstTime = currentPlan === "none";
    const [loadingPlan, setLoadingPlan] = useState<Plan | null>(null);

    const subscribeMutation = useApiPost<{ paymentId: string; redirectUrl: string }>({
        path: "/billing/subscribe",
    });

    async function handleSubscribe(plan: Plan) {
        if (plan === currentPlan) {
            toast.info("You are already on this plan.");
            return;
        }

        setLoadingPlan(plan);
        try {
            const result = await subscribeMutation.mutateAsync({ plan });

            if (result.redirectUrl) {
                // Open Paynow payment page in browser
                await Linking.openURL(result.redirectUrl);
                // After payment, user returns via deep link → payments/success screen
            }
        } catch (err: any) {
            toast.error(err?.message ?? "Failed to initiate payment");
        } finally {
            setLoadingPlan(null);
        }
    }

    return (
        <>
            <Stack.Screen
                options={{
                    headerShown: false,
                }}
            />
            <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
                {/* Header */}
                <View className="flex-row items-center px-4 h-14 border-b border-border bg-card">
                    {!isFirstTime && <BackButton />}
                    <Text className="text-foreground font-semibold text-lg flex-1">
                        {isFirstTime ? "Choose Your Plan" : "Manage Plan"}
                    </Text>
                </View>

                <ScrollView
                    className="flex-1"
                    contentContainerClassName="px-4 pt-5 pb-10"
                    showsVerticalScrollIndicator={false}
                >
                    {/* Hero text */}
                    <View className="items-center mb-5">
                        <View className="w-14 h-14 rounded-2xl bg-primary/10 items-center justify-center mb-3">
                            <Ionicons name="diamond" size={28} color={BRAND.brand} />
                        </View>
                        <Text className="text-foreground text-xl font-bold text-center">
                            {isFirstTime
                                ? "Welcome! Let's get you started"
                                : "Select the right plan for your business"}
                        </Text>
                        <Text className="text-muted-foreground text-sm text-center mt-1.5 leading-5 px-4">
                            {isFirstTime
                                ? "Pick a plan to unlock EasyPOS and start selling today."
                                : "All plans include overage protection at $0.02/unit"}
                        </Text>
                    </View>

                    {/* Plan cards */}
                    {plans.map((plan) => {
                        const isCurrent = currentPlan === plan.key;
                        const isLoading = loadingPlan === plan.key;
                        const isDisabled = loadingPlan !== null;

                        return (
                            <View
                                key={plan.key}
                                className={cn(
                                    "mb-4 rounded-2xl border-2 bg-card overflow-hidden",
                                    plan.popular
                                        ? "border-primary"
                                        : "border-border",
                                )}
                            >
                                {/* Popular badge */}
                                {plan.popular && (
                                    <View className="bg-primary py-1.5">
                                        <Text className="text-primary-foreground text-xs font-bold text-center tracking-wide uppercase">
                                            Most Popular
                                        </Text>
                                    </View>
                                )}

                                <View className="p-5">
                                    {/* Plan header */}
                                    <View className="flex-row items-center justify-between mb-1">
                                        <View className="flex-row items-center gap-2">
                                            <Text className="text-foreground font-bold text-xl">
                                                {plan.name}
                                            </Text>
                                            {isCurrent && (
                                                <View className="bg-primary/10 border border-primary/20 px-2.5 py-0.5 rounded-full">
                                                    <Text className="text-primary text-xs font-semibold">
                                                        Current
                                                    </Text>
                                                </View>
                                            )}
                                        </View>
                                        <View className="items-end">
                                            <View className="flex-row items-baseline">
                                                <Text className="text-foreground font-extrabold text-2xl">
                                                    ${plan.price}
                                                </Text>
                                                <Text className="text-muted-foreground text-sm ml-0.5">
                                                    /mo
                                                </Text>
                                            </View>
                                        </View>
                                    </View>

                                    <Text className="text-muted-foreground text-sm mb-4">
                                        {plan.description}
                                    </Text>

                                    {/* Features */}
                                    <View className="gap-2.5 mb-5">
                                        {plan.features.map((feature, i) => (
                                            <View key={i} className="flex-row items-center gap-2.5">
                                                <View className="w-5 h-5 rounded-full bg-primary/10 items-center justify-center">
                                                    <Ionicons
                                                        name="checkmark"
                                                        size={12}
                                                        color={BRAND.brand}
                                                    />
                                                </View>
                                                <Text className="text-foreground text-sm flex-1">
                                                    {feature}
                                                </Text>
                                            </View>
                                        ))}
                                    </View>

                                    {/* CTA button */}
                                    <Pressable
                                        onPress={() => handleSubscribe(plan.key)}
                                        disabled={isCurrent || isDisabled}
                                        className={cn(
                                            "h-12 rounded-xl items-center justify-center",
                                            isCurrent
                                                ? "bg-secondary"
                                                : plan.popular
                                                    ? "bg-primary"
                                                    : "bg-foreground",
                                            (isCurrent || isDisabled) && "opacity-60",
                                        )}
                                    >
                                        <Text
                                            className={cn(
                                                "font-bold text-sm",
                                                isCurrent
                                                    ? "text-muted-foreground"
                                                    : plan.popular
                                                        ? "text-primary-foreground"
                                                        : "text-background",
                                            )}
                                        >
                                            {isLoading
                                                ? "Processing..."
                                                : isCurrent
                                                    ? "Current Plan"
                                                    : plan.cta}
                                        </Text>
                                    </Pressable>
                                </View>
                            </View>
                        );
                    })}

                    {/* Footer note */}
                    <View className="items-center mt-2 px-6">
                        <Text className="text-muted-foreground text-xs text-center leading-4">
                            Payments are processed securely via Paynow.{"\n"}
                            You can change your plan at any time.
                        </Text>
                    </View>
                </ScrollView>
            </View>
        </>
    );
}
