import { View, Pressable } from "react-native";
import { router, Stack } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { Text } from "@/components/ui/text";
import { Progress } from "@/components/ui/progress";
import { Container } from "@/components/Container";
import { useApiQuery } from "@/hooks/use-api";
import { type BillingUsage } from "@easypos/types";

function UsageBar({ label, used, max }: { label: string; used: number; max: number }) {
    const pct = max > 0 ? Math.min((used / max) * 100, 100) : 0;
    const isOver = used > max;

    return (
        <View className="mb-4">
            <View className="flex-row items-center justify-between mb-1.5">
                <Text className="text-foreground text-sm font-medium">{label}</Text>
                <Text className={isOver ? "text-destructive text-sm font-medium" : "text-muted-foreground text-sm"}>
                    {used.toLocaleString()} / {max.toLocaleString()}
                </Text>
            </View>
            <Progress value={pct} className={isOver ? "bg-destructive/20" : undefined} />
            {isOver && (
                <Text className="text-destructive text-xs mt-1">
                    Over limit by {(used - max).toLocaleString()} — overage charges apply
                </Text>
            )}
        </View>
    );
}

export default function UsageScreen() {
    const { data, isLoading, error } = useApiQuery<BillingUsage>({
        queryKey: ["billing-usage"],
        path: "/billing/usage",
    });

    return (
        <>
            <Stack.Screen
                options={{
                    headerShown: true,
                    title: "Usage & Limits",
                    headerLeft: () => (
                        <Pressable onPress={() => router.back()} className="mr-4">
                            <Ionicons name="arrow-back" size={24} color="hsl(0 0% 45%)" />
                        </Pressable>
                    ),
                }}
            />
            <Container>
                {isLoading && (
                    <View className="flex-1 items-center justify-center py-20">
                        <Text className="text-muted-foreground">Loading usage data...</Text>
                    </View>
                )}

                {error && (
                    <View className="flex-1 items-center justify-center py-20">
                        <Text className="text-destructive">Failed to load usage data</Text>
                    </View>
                )}

                {data && (
                    <View className="px-4 pt-4">
                        {/* Plan info card */}
                        <View className="p-4 rounded-xl bg-card border border-border mb-6">
                            <View className="flex-row items-center justify-between">
                                <View>
                                    <Text className="text-muted-foreground text-xs uppercase tracking-wider">
                                        Current Plan
                                    </Text>
                                    <Text className="text-foreground text-xl font-bold mt-1">
                                        {data.plan.charAt(0).toUpperCase() + data.plan.slice(1)}
                                    </Text>
                                </View>
                                <View className="items-end">
                                    <Text className="text-muted-foreground text-xs">Next billing</Text>
                                    <Text className="text-foreground text-sm font-medium mt-1">
                                        {new Date(data.nextBillingDate).toLocaleDateString()}
                                    </Text>
                                </View>
                            </View>

                            {data.pendingOverageCharges > 0 && (
                                <View className="mt-3 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                                    <View className="flex-row items-center gap-2">
                                        <Ionicons name="warning" size={16} color="hsl(0 84.2% 60.2%)" />
                                        <Text className="text-destructive text-sm font-medium">
                                            Pending overage: ${data.pendingOverageCharges.toFixed(2)}
                                        </Text>
                                    </View>
                                    <Text className="text-destructive/80 text-xs mt-1">
                                        Will be charged on your next billing date
                                    </Text>
                                </View>
                            )}
                        </View>

                        {/* Usage bars */}
                        <Text className="text-foreground font-semibold text-base mb-4">
                            Resource Usage
                        </Text>

                        <UsageBar
                            label="Users"
                            used={data.usage.users}
                            max={data.limits.users}
                        />
                        <UsageBar
                            label="Monthly Invoices"
                            used={data.usage.monthlyInvoices}
                            max={data.limits.monthlyInvoices}
                        />
                        <UsageBar
                            label="Products"
                            used={data.usage.products}
                            max={data.limits.products}
                        />
                        <UsageBar
                            label="Categories"
                            used={data.usage.categories}
                            max={data.limits.categories}
                        />
                        <UsageBar
                            label="Branches"
                            used={data.usage.branches}
                            max={data.limits.branches}
                        />

                        {/* Billing cycle info */}
                        <View className="mt-4 mb-8 p-4 rounded-xl bg-secondary/50">
                            <Text className="text-muted-foreground text-xs">
                                Billing cycle started{" "}
                                {new Date(data.billingCycleStart).toLocaleDateString()}.
                                {"\n"}Usage counters reset on{" "}
                                {new Date(data.nextBillingDate).toLocaleDateString()}.
                            </Text>
                        </View>

                        {/* Upgrade CTA */}
                        <Pressable
                            onPress={() => router.push("/(app)/billing/plans" as any)}
                            className="mb-8 p-4 rounded-xl bg-primary/10 border border-primary/20 flex-row items-center"
                        >
                            <Ionicons name="arrow-up-circle" size={24} color="hsl(142 71% 45%)" />
                            <View className="ml-3 flex-1">
                                <Text className="text-foreground font-semibold text-sm">
                                    Need more capacity?
                                </Text>
                                <Text className="text-muted-foreground text-xs mt-0.5">
                                    Upgrade your plan for higher limits
                                </Text>
                            </View>
                            <Ionicons name="chevron-forward" size={16} color="hsl(0 0% 45%)" />
                        </Pressable>
                    </View>
                )}
            </Container>
        </>
    );
}
