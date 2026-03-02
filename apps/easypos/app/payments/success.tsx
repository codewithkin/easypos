import { useEffect, useState } from "react";
import { View } from "react-native";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/Container";
import { useApiPost } from "@/hooks/use-api";
import { useAuthStore } from "@/store/auth";

export default function PaymentSuccessScreen() {
    const { intermediatePayment } = useLocalSearchParams<{ intermediatePayment: string }>();
    const [confirmed, setConfirmed] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [planName, setPlanName] = useState<string>("");
    const initialize = useAuthStore((s) => s.initialize);

    const confirmMutation = useApiPost<{ message: string; plan: string }>({
        path: `/billing/confirm/${intermediatePayment}`,
    });

    useEffect(() => {
        if (!intermediatePayment) return;

        confirmMutation
            .mutateAsync({})
            .then((result) => {
                setConfirmed(true);
                setPlanName(result.plan);
                // Refresh auth state to pick up new plan info
                initialize();
            })
            .catch((err: any) => {
                if (err?.message?.includes("already confirmed")) {
                    setConfirmed(true);
                } else {
                    setError(err?.message ?? "Failed to confirm payment");
                }
            });
    }, [intermediatePayment]);

    return (
        <>
            <Stack.Screen options={{ headerShown: false }} />
            <Container isScrollable={false}>
                <View className="flex-1 items-center justify-center px-6">
                    {!confirmed && !error && (
                        <>
                            <View className="w-20 h-20 rounded-full bg-primary/10 items-center justify-center mb-6">
                                <Ionicons name="hourglass" size={40} color="hsl(142 71% 45%)" />
                            </View>
                            <Text className="text-foreground text-xl font-bold text-center">
                                Confirming Payment...
                            </Text>
                            <Text className="text-muted-foreground text-sm text-center mt-2">
                                Please wait while we verify your payment
                            </Text>
                        </>
                    )}

                    {confirmed && (
                        <>
                            <View className="w-20 h-20 rounded-full bg-green-500/10 items-center justify-center mb-6">
                                <Ionicons name="checkmark-circle" size={50} color="hsl(142 71% 45%)" />
                            </View>
                            <Text className="text-foreground text-xl font-bold text-center">
                                Payment Successful!
                            </Text>
                            <Text className="text-muted-foreground text-sm text-center mt-2">
                                {planName
                                    ? `You are now on the ${planName.charAt(0).toUpperCase() + planName.slice(1)} plan`
                                    : "Your subscription has been activated"}
                            </Text>
                            <Button
                                className="mt-8 w-full"
                                size="lg"
                                onPress={() => router.replace("/(app)/(tabs)" as any)}
                            >
                                <Text className="text-primary-foreground font-semibold">
                                    Continue to App
                                </Text>
                            </Button>
                        </>
                    )}

                    {error && (
                        <>
                            <View className="w-20 h-20 rounded-full bg-destructive/10 items-center justify-center mb-6">
                                <Ionicons name="close-circle" size={50} color="hsl(0 84.2% 60.2%)" />
                            </View>
                            <Text className="text-foreground text-xl font-bold text-center">
                                Payment Verification Failed
                            </Text>
                            <Text className="text-muted-foreground text-sm text-center mt-2">
                                {error}
                            </Text>
                            <Button
                                className="mt-8 w-full"
                                size="lg"
                                onPress={() => router.replace("/(app)/billing/plans" as any)}
                            >
                                <Text className="text-primary-foreground font-semibold">
                                    Try Again
                                </Text>
                            </Button>
                            <Button
                                variant="outline"
                                className="mt-3 w-full"
                                size="lg"
                                onPress={() => router.replace("/(app)/(tabs)" as any)}
                            >
                                <Text className="text-foreground font-semibold">
                                    Back to App
                                </Text>
                            </Button>
                        </>
                    )}
                </View>
            </Container>
        </>
    );
}
