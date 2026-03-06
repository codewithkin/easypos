/**
 * Deep Link Handler: easypos://billing/confirm?reference=<paymentId>&status=<success|pending>
 *
 * This route handles the user being redirected back from Paynow after payment.
 * The server sends HTML that opens this deep link, then we:
 * 1. Confirm payment status via POST /billing/confirm/:id
 * 2. Redirect to dashboard on success or show error
 */

import { useEffect, useState } from "react";
import { View, ActivityIndicator } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import { useApiPost } from "@/hooks/use-api";
import { toast } from "@/lib/toast";
import { BRAND } from "@/lib/theme";

export default function BillingConfirmScreen() {
    const insets = useSafeAreaInsets();
    const { reference, status: statusParam } = useLocalSearchParams<{ reference?: string; status?: string }>();
    const [isConfirming, setIsConfirming] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const { mutate: confirmPayment } = useApiPost<
        { message: string; plan: string },
        unknown
    >({
        path: `/billing/confirm/${reference || ""}`,
    });

    useEffect(() => {
        if (!reference) {
            setError("Missing payment reference. Please try again.");
            setIsConfirming(false);
            return;
        }

        // If server already confirmed status is success, redirect immediately
        if (statusParam === "success") {
            setIsConfirming(false);
            toast.success("Payment successful", "Your plan has been activated");
            setTimeout(() => {
                router.replace("/(app)");
            }, 1000);
            return;
        }

        // Otherwise, poll the server for confirmation
        confirmPayment(undefined, {
            onSuccess: (data) => {
                setIsConfirming(false);
                toast.success("Payment successful", `Plan activated: ${data.plan}`);
                // Redirect to dashboard after a short delay
                setTimeout(() => {
                    router.replace("/(app)");
                }, 1000);
            },
            onError: (err) => {
                setIsConfirming(false);
                setError(err.message || "Failed to confirm payment");
                toast.error("Confirmation failed", err.message);
            },
        });
    }, [reference, statusParam]);

    if (isConfirming) {
        return (
            <View
                className="flex-1 bg-background items-center justify-center"
                style={{ paddingTop: insets.top }}
            >
                <ActivityIndicator size="large" color={BRAND.brand} />
                <Text className="text-foreground font-semibold text-lg mt-4">
                    Confirming payment…
                </Text>
                <Text className="text-muted-foreground text-sm mt-1">
                    Please wait while we verify with Paynow
                </Text>
            </View>
        );
    }

    if (error) {
        return (
            <View
                className="flex-1 bg-background items-center justify-center px-5"
                style={{ paddingTop: insets.top + 32 }}
            >
                <View className="w-12 h-12 rounded-full bg-destructive/10 items-center justify-center mb-4">
                    <Text className="text-2xl">⚠️</Text>
                </View>
                <Text className="text-foreground font-semibold text-lg text-center">
                    Payment Confirmation Failed
                </Text>
                <Text className="text-muted-foreground text-sm text-center mt-2 leading-relaxed">
                    {error}
                </Text>
                <View className="flex-row gap-2 mt-6 w-full">
                    <Button
                        onPress={() => router.replace("/(app)")}
                        variant="outline"
                        className="flex-1"
                    >
                        <Text className="text-foreground font-semibold">Back Home</Text>
                    </Button>
                    <Button
                        onPress={() => {
                            setError(null);
                            setIsConfirming(true);
                        }}
                        className="flex-1"
                    >
                        <Text className="text-primary-foreground font-semibold">Retry</Text>
                    </Button>
                </View>
            </View>
        );
    }

    return null;
}
