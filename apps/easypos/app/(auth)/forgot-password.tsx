import { useState } from "react";
import { View, KeyboardAvoidingView, Platform } from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Text } from "@/components/ui/text";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { api, ApiError } from "@/lib/api";
import { toast } from "@/lib/toast";

type Step = "email" | "code" | "done";

export default function ForgotPasswordScreen() {
    const insets = useSafeAreaInsets();
    const [step, setStep] = useState<Step>("email");
    const [email, setEmail] = useState("");
    const [code, setCode] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    async function handleRequestReset() {
        if (!email.trim()) {
            toast.error("Please enter your email address.");
            return;
        }

        setIsLoading(true);
        try {
            await api.post("/auth/forgot-password", { email: email.trim() });
            setStep("code");
            toast.success("If the email exists, a reset code has been sent.");
        } catch (err) {
            const message = err instanceof ApiError ? err.message : "Something went wrong";
            toast.error(message);
        } finally {
            setIsLoading(false);
        }
    }

    async function handleResetPassword() {
        if (!code.trim() || !newPassword.trim()) {
            toast.error("Please enter the code and a new password.");
            return;
        }

        if (newPassword.length < 6) {
            toast.error("Password must be at least 6 characters.");
            return;
        }

        setIsLoading(true);
        try {
            await api.post("/auth/reset-password", {
                email: email.trim(),
                code: code.trim(),
                newPassword,
            });
            setStep("done");
            toast.success("Password reset! You can now sign in.");
            router.replace("/(auth)/login");
        } catch (err) {
            const message = err instanceof ApiError ? err.message : "Something went wrong";
            toast.error(message);
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            className="flex-1 bg-background"
            style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
        >
            <View className="flex-1 justify-center px-6">
                {/* Header */}
                <View className="items-center mb-8">
                    <Text className="text-2xl font-bold text-foreground tracking-tight">
                        Reset Password
                    </Text>
                    <Text className="text-muted-foreground text-sm mt-1 text-center">
                        {step === "email"
                            ? "Enter your email to receive a reset code"
                            : "Enter the 6-digit code and your new password"}
                    </Text>
                </View>

                {step === "email" ? (
                    <View className="gap-4">
                        <View className="gap-1.5">
                            <Label nativeID="email" className="text-foreground">Email</Label>
                            <Input
                                placeholder="you@business.com"
                                value={email}
                                onChangeText={setEmail}
                                autoCapitalize="none"
                                keyboardType="email-address"
                                autoComplete="email"
                                aria-labelledby="email"
                                className="h-12"
                            />
                        </View>

                        <Button
                            onPress={handleRequestReset}
                            disabled={isLoading}
                            className="h-12 mt-2"
                        >
                            <Text className="text-primary-foreground font-semibold text-base">
                                {isLoading ? "Sending..." : "Send Reset Code"}
                            </Text>
                        </Button>
                    </View>
                ) : (
                    <View className="gap-4">
                        <View className="gap-1.5">
                            <Label nativeID="code" className="text-foreground">Reset Code</Label>
                            <Input
                                placeholder="123456"
                                value={code}
                                onChangeText={setCode}
                                keyboardType="number-pad"
                                maxLength={6}
                                aria-labelledby="code"
                                className="h-12 text-center text-xl tracking-[8px]"
                            />
                        </View>

                        <View className="gap-1.5">
                            <Label nativeID="newPassword" className="text-foreground">New Password</Label>
                            <Input
                                placeholder="Min. 6 characters"
                                value={newPassword}
                                onChangeText={setNewPassword}
                                secureTextEntry
                                aria-labelledby="newPassword"
                                className="h-12"
                            />
                        </View>

                        <Button
                            onPress={handleResetPassword}
                            disabled={isLoading}
                            className="h-12 mt-2"
                        >
                            <Text className="text-primary-foreground font-semibold text-base">
                                {isLoading ? "Resetting..." : "Reset Password"}
                            </Text>
                        </Button>
                    </View>
                )}

                {/* Back to login */}
                <View className="items-center mt-8">
                    <Button variant="ghost" onPress={() => router.back()}>
                        <Text className="text-muted-foreground text-sm">Back to Sign In</Text>
                    </Button>
                </View>
            </View>
        </KeyboardAvoidingView>
    );
}
