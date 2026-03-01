import { useState } from "react";
import { View, KeyboardAvoidingView, Platform, Alert, ScrollView } from "react-native";
import { Link } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Text } from "@/components/ui/text";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/auth";
import { ApiError } from "@/lib/api";

export default function RegisterScreen() {
    const insets = useSafeAreaInsets();
    const [orgName, setOrgName] = useState("");
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const register = useAuthStore((s) => s.register);
    const isLoading = useAuthStore((s) => s.isLoading);

    async function handleRegister() {
        if (!orgName.trim() || !name.trim() || !email.trim() || !password.trim()) {
            Alert.alert("Missing Fields", "Please fill in all fields.");
            return;
        }

        if (password.length < 6) {
            Alert.alert("Weak Password", "Password must be at least 6 characters.");
            return;
        }

        try {
            await register({
                orgName: orgName.trim(),
                name: name.trim(),
                email: email.trim(),
                password,
            });
        } catch (err) {
            const message = err instanceof ApiError ? err.message : "Something went wrong";
            Alert.alert("Registration Failed", message);
        }
    }

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            className="flex-1 bg-background"
            style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
        >
            <ScrollView
                contentContainerStyle={{ flexGrow: 1, justifyContent: "center" }}
                keyboardShouldPersistTaps="handled"
                className="px-6"
            >
                {/* Header */}
                <View className="items-center mb-8">
                    <Text className="text-2xl font-bold text-foreground tracking-tight">
                        Create Your Business
                    </Text>
                    <Text className="text-muted-foreground text-sm mt-1">
                        Set up your POS in under a minute
                    </Text>
                </View>

                {/* Form */}
                <View className="gap-4">
                    <View className="gap-1.5">
                        <Label nativeID="orgName" className="text-foreground">Business Name</Label>
                        <Input
                            placeholder="My Shop"
                            value={orgName}
                            onChangeText={setOrgName}
                            autoCapitalize="words"
                            aria-labelledby="orgName"
                            className="h-12"
                        />
                    </View>

                    <View className="gap-1.5">
                        <Label nativeID="fullName" className="text-foreground">Your Name</Label>
                        <Input
                            placeholder="John Doe"
                            value={name}
                            onChangeText={setName}
                            autoCapitalize="words"
                            aria-labelledby="fullName"
                            className="h-12"
                        />
                    </View>

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
                            placeholder="Min. 6 characters"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry
                            aria-labelledby="password"
                            className="h-12"
                        />
                    </View>

                    <Button
                        onPress={handleRegister}
                        disabled={isLoading}
                        className="h-12 mt-2"
                    >
                        <Text className="text-primary-foreground font-semibold text-base">
                            {isLoading ? "Creating..." : "Get Started"}
                        </Text>
                    </Button>
                </View>

                {/* Footer */}
                <View className="flex-row items-center justify-center mt-8 gap-1">
                    <Text className="text-muted-foreground text-sm">Already have an account?</Text>
                    <Link href="/(auth)/login" asChild>
                        <Button variant="ghost" size="sm" className="px-1">
                            <Text className="text-primary font-semibold text-sm">Sign in</Text>
                        </Button>
                    </Link>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}
