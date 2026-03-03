import { useState, useCallback } from "react";
import { View, KeyboardAvoidingView, Platform, ScrollView, Pressable, ActivityIndicator } from "react-native";
import { Image } from "react-native";
import { Link } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import { Ionicons } from "@expo/vector-icons";

import { Text } from "@/components/ui/text";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/auth";
import { ApiError } from "@/lib/api";
import { toast } from "@/lib/toast";
import * as Haptics from "expo-haptics";

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000";

// ── Logo picker helpers ────────────────────────────────────────────

async function pickAndCropLogo(): Promise<ImageManipulator.ImageResult | null> {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
        toast.error("Allow photo library access to upload a logo.");
        return null;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,   // native 1:1 crop UI
        aspect: [1, 1],
        quality: 0.9,
    });

    if (result.canceled || !result.assets[0]) return null;

    // Resize to 512×512 for consistent quality
    const manipulated = await ImageManipulator.manipulateAsync(
        result.assets[0].uri,
        [{ resize: { width: 512, height: 512 } }],
        { compress: 0.9, format: ImageManipulator.SaveFormat.JPEG },
    );

    return manipulated;
}

async function uploadLogoToR2(imageUri: string): Promise<string> {
    // 1. Get presigned URL from server
    const presignRes = await fetch(`${API_URL}/api/uploads/presign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folder: "logos", contentType: "image/jpeg" }),
    });

    if (!presignRes.ok) {
        throw new Error("Failed to get upload URL");
    }

    const { uploadUrl, publicUrl } = (await presignRes.json()) as {
        uploadUrl: string;
        publicUrl: string;
    };

    // 2. Upload directly to R2 via the presigned URL
    const fileRes = await fetch(imageUri);
    const blob = await fileRes.blob();

    const uploadRes = await fetch(uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": "image/jpeg" },
        body: blob,
    });

    if (!uploadRes.ok) {
        throw new Error("Logo upload failed");
    }

    return publicUrl;
}

// ── Screen ─────────────────────────────────────────────────────────

export default function RegisterScreen() {
    const insets = useSafeAreaInsets();
    const [orgName, setOrgName] = useState("");
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    // Logo state
    const [logoUri, setLogoUri] = useState<string | null>(null);
    const [logoUploading, setLogoUploading] = useState(false);
    const [logoUrl, setLogoUrl] = useState<string | null>(null);

    const register = useAuthStore((s) => s.register);
    const isLoading = useAuthStore((s) => s.isLoading);

    const handlePickLogo = useCallback(async () => {
        try {
            const image = await pickAndCropLogo();
            if (!image) return;

            setLogoUri(image.uri);
            setLogoUrl(null); // reset any previous upload

            setLogoUploading(true);
            const url = await uploadLogoToR2(image.uri);
            setLogoUrl(url);
        } catch {
            toast.error("Could not upload logo. You can still continue without one.");
            setLogoUri(null);
            setLogoUrl(null);
        } finally {
            setLogoUploading(false);
        }
    }, []);

    async function handleRegister() {
        if (!orgName.trim() || !name.trim() || !email.trim() || !password.trim()) {
            toast.error("Please fill in all fields.");
            return;
        }

        if (password.length < 6) {
            toast.error("Password must be at least 6 characters.");
            return;
        }

        if (logoUri && logoUploading) {
            toast.info("Logo is still uploading\u2026");
            return;
        }

        try {
            await register({
                orgName: orgName.trim(),
                name: name.trim(),
                email: email.trim(),
                password,
                ...(logoUrl ? { logoUrl } : {}),
            });
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch (err) {
            const message = err instanceof ApiError ? err.message : "Something went wrong";
            toast.error(message);
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

                {/* ── Business Logo ── */}
                <View className="items-center mb-6">
                    <Text className="text-foreground font-medium text-sm mb-3 self-start">
                        Business Logo <Text className="text-muted-foreground font-normal">(optional)</Text>
                    </Text>

                    <Pressable
                        onPress={handlePickLogo}
                        disabled={logoUploading}
                        className="w-24 h-24 rounded-2xl border-2 border-dashed border-border bg-muted items-center justify-center overflow-hidden active:opacity-70"
                    >
                        {logoUri ? (
                            <>
                                <Image
                                    source={{ uri: logoUri }}
                                    className="w-24 h-24"
                                    resizeMode="cover"
                                />
                                {logoUploading && (
                                    <View className="absolute inset-0 bg-black/40 items-center justify-center rounded-2xl">
                                        <ActivityIndicator color="#ffffff" size="small" />
                                    </View>
                                )}
                                {!logoUploading && logoUrl && (
                                    <View className="absolute bottom-1 right-1 bg-primary rounded-full w-5 h-5 items-center justify-center">
                                        <Ionicons name="checkmark" size={12} color="#fff" />
                                    </View>
                                )}
                            </>
                        ) : (
                            <View className="items-center gap-1">
                                <Ionicons name="storefront-outline" size={28} color="hsl(228 13% 41%)" />
                                <Text className="text-muted-foreground text-xs">Tap to add</Text>
                            </View>
                        )}
                    </Pressable>

                    {logoUri && !logoUploading && (
                        <Pressable onPress={handlePickLogo} className="mt-2">
                            <Text className="text-primary text-xs font-medium">Change photo</Text>
                        </Pressable>
                    )}
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
                        disabled={isLoading || logoUploading}
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

