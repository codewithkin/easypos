import { useState } from "react";
import { View, Pressable, Alert, Linking } from "react-native";
import { router, Stack } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/Container";
import { useAuthStore } from "@/store/auth";
import { useApiPost } from "@/hooks/use-api";
import { PLAN_LIMITS, type Plan } from "@easypos/types";
import { cn } from "@/lib/utils";

const PLAN_FEATURES: Record<Plan, string[]> = {
    starter: [
        `Up to ${PLAN_LIMITS.starter.users} users`,
        `${PLAN_LIMITS.starter.products} products`,
        `${PLAN_LIMITS.starter.categories} categories`,
        `${PLAN_LIMITS.starter.branches} branch`,
        `${PLAN_LIMITS.starter.monthlyInvoices.toLocaleString()} invoices/month`,
        "Email support",
    ],
    growth: [
        `Up to ${PLAN_LIMITS.growth.users} users`,
        `${PLAN_LIMITS.growth.products} products`,
        `${PLAN_LIMITS.growth.categories} categories`,
        `${PLAN_LIMITS.growth.branches} branches`,
        `${PLAN_LIMITS.growth.monthlyInvoices.toLocaleString()} invoices/month`,
        "Priority support",
    ],
    enterprise: [
        `Up to ${PLAN_LIMITS.enterprise.users} users`,
        `${PLAN_LIMITS.enterprise.products.toLocaleString()} products`,
        `${PLAN_LIMITS.enterprise.categories} categories`,
        `${PLAN_LIMITS.enterprise.branches} branches`,
        `${PLAN_LIMITS.enterprise.monthlyInvoices.toLocaleString()} invoices/month`,
        "Dedicated support",
    ],
};

const PLANS: { key: Plan; name: string; popular?: boolean }[] = [
    { key: "starter", name: "Starter" },
    { key: "growth", name: "Growth", popular: true },
    { key: "enterprise", name: "Enterprise" },
];

export default function PlansScreen() {
    const user = useAuthStore((s) => s.user);
    const currentPlan = user?.org.plan ?? "starter";
    const [selectedPlan, setSelectedPlan] = useState<Plan>(currentPlan);
    const [isLoading, setIsLoading] = useState(false);

    const subscribeMutation = useApiPost<{ paymentId: string; redirectUrl: string }>({
        path: "/billing/subscribe",
    });

    async function handleSubscribe() {
        if (selectedPlan === currentPlan) {
            Alert.alert("Current Plan", "You are already on this plan.");
            return;
        }

        setIsLoading(true);
        try {
            const result = await subscribeMutation.mutateAsync({
                plan: selectedPlan,
            });

            if (result.redirectUrl) {
                // Open Paynow payment page in browser
                await Linking.openURL(result.redirectUrl);
                // After payment, user returns via deep link → payments/success screen
            }
        } catch (err: any) {
            Alert.alert("Error", err?.message ?? "Failed to initiate payment");
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <>
            <Stack.Screen
                options={{
                    headerShown: true,
                    title: "Choose a Plan",
                    headerLeft: () => (
                        <Pressable onPress={() => router.back()} className="mr-4">
                            <Ionicons name="arrow-back" size={24} color="hsl(0 0% 45%)" />
                        </Pressable>
                    ),
                }}
            />
            <Container>
                <View className="px-4 pt-4 pb-2">
                    <Text className="text-foreground text-lg font-bold text-center">
                        Select the right plan for your business
                    </Text>
                    <Text className="text-muted-foreground text-sm text-center mt-1">
                        All plans include overage protection at $0.02/unit
                    </Text>
                </View>

                {PLANS.map(({ key, name, popular }) => {
                    const limits = PLAN_LIMITS[key];
                    const isSelected = selectedPlan === key;
                    const isCurrent = currentPlan === key;

                    return (
                        <Pressable
                            key={key}
                            onPress={() => setSelectedPlan(key)}
                            className={cn(
                                "mx-4 mt-3 p-4 rounded-xl border-2",
                                isSelected
                                    ? "border-primary bg-primary/5"
                                    : "border-border bg-card",
                            )}
                        >
                            <View className="flex-row items-center justify-between">
                                <View className="flex-row items-center gap-2">
                                    <Text className="text-foreground font-bold text-lg">{name}</Text>
                                    {popular && (
                                        <View className="bg-primary px-2 py-0.5 rounded-full">
                                            <Text className="text-primary-foreground text-xs font-semibold">
                                                Popular
                                            </Text>
                                        </View>
                                    )}
                                    {isCurrent && (
                                        <View className="bg-secondary px-2 py-0.5 rounded-full">
                                            <Text className="text-secondary-foreground text-xs font-medium">
                                                Current
                                            </Text>
                                        </View>
                                    )}
                                </View>
                                <View className="items-end">
                                    <Text className="text-foreground font-bold text-xl">
                                        ${limits.price}
                                    </Text>
                                    <Text className="text-muted-foreground text-xs">/month</Text>
                                </View>
                            </View>

                            <View className="mt-3 gap-1.5">
                                {PLAN_FEATURES[key].map((feature, i) => (
                                    <View key={i} className="flex-row items-center gap-2">
                                        <Ionicons
                                            name="checkmark-circle"
                                            size={16}
                                            color={isSelected ? "hsl(142 71% 45%)" : "hsl(0 0% 55%)"}
                                        />
                                        <Text className="text-foreground text-sm">{feature}</Text>
                                    </View>
                                ))}
                            </View>
                        </Pressable>
                    );
                })}

                <View className="px-4 mt-6 mb-8">
                    <Button
                        size="lg"
                        onPress={handleSubscribe}
                        disabled={isLoading || selectedPlan === currentPlan}
                    >
                        <Text className="text-primary-foreground font-semibold">
                            {isLoading
                                ? "Processing..."
                                : selectedPlan === currentPlan
                                    ? "Current Plan"
                                    : `Upgrade to ${selectedPlan.charAt(0).toUpperCase() + selectedPlan.slice(1)}`}
                        </Text>
                    </Button>
                </View>
            </Container>
        </>
    );
}
