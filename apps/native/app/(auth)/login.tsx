import { useState } from "react";
import { View, KeyboardAvoidingView, Platform, Alert } from "react-native";
import { Link } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Text } from "@/components/ui/text";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/auth";
import { ApiError } from "@/lib/api";

export default function LoginScreen() {
    const insets = useSafeAreaInsets();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const login = useAuthStore((s) => s.login);
    const isLoading = useAuthStore((s) => s.isLoading);

    async function handleLogin() {
        if (!email.trim() || !password.trim()) {
            Alert.alert("Missing Fields", "Please enter both email and password.");
            return;
        }

        try {
            await login(email.trim(), password);
        } catch (err) {
            const message = err instanceof ApiError ? err.message : "Something went wrong";
            Alert.alert("Login Failed", message);
        }
    }

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            className="flex-1 bg-background"
            style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
        >
            <View className="flex-1 justify-center px-6">
                {/* Brand */}
                <View className="items-center mb-10">
                    <View className="w-16 h-16 rounded-2xl bg-primary items-center justify-center mb-4">
                        <Text className="text-primary-foreground text-2xl font-bold">EP</Text>
                    </View>
                    <Text className="text-3xl font-bold text-foreground tracking-tight">EasyPOS</Text>
                    <Text className="text-muted-foreground text-sm mt-1">
                        Simple, fast, reliable point of sale
                    </Text>
                </View>

                {/* Form */}
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

                    <View className="gap-1.5">
                        <Label nativeID="password" className="text-foreground">Password</Label>
                        <Input
                            placeholder="••••••••"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry
                            autoComplete="password"
                            aria-labelledby="password"
                            className="h-12"
                        />
                    </View>

                    <Link href="/(auth)/forgot-password" asChild>
                        <Button variant="ghost" size="sm" className="self-end">
                            <Text className="text-muted-foreground text-sm">Forgot password?</Text>
                        </Button>
                    </Link>

                    <Button
                        onPress={handleLogin}
                        disabled={isLoading}
                        className="h-12 mt-2"
                    >
                        <Text className="text-primary-foreground font-semibold text-base">
                            {isLoading ? "Signing in..." : "Sign In"}
                        </Text>
                    </Button>
                </View>

                {/* Footer */}
                <View className="flex-row items-center justify-center mt-8 gap-1">
                    <Text className="text-muted-foreground text-sm">Don't have an account?</Text>
                    <Link href="/(auth)/register" asChild>
                        <Button variant="ghost" size="sm" className="px-1">
                            <Text className="text-primary font-semibold text-sm">Create one</Text>
                        </Button>
                    </Link>
                </View>
            </View>
        </KeyboardAvoidingView>
    );
}
