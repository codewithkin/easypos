import { useState, useEffect } from "react";
import { View, TextInput, ScrollView, KeyboardAvoidingView, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";

import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { BackButton } from "@/components/back-button";
import { useAuthStore } from "@/store/auth";
import { useApiQuery, useApiPut } from "@/hooks/use-api";
import { toast } from "@/lib/toast";
import { BRAND } from "@/lib/theme";

interface OrgSettings {
    id: string;
    name: string;
    currency: string;
    receiptHeader: string | null;
    receiptFooter: string | null;
}

export default function ReceiptSettingsScreen() {
    const insets = useSafeAreaInsets();
    const setUser = useAuthStore((s) => s.setUser);
    const user = useAuthStore((s) => s.user);

    const [header, setHeader] = useState("");
    const [footer, setFooter] = useState("");
    const [name, setName] = useState("");
    const [currency, setCurrency] = useState("");

    const { data: org, isLoading } = useApiQuery<OrgSettings>({
        queryKey: ["org"],
        path: "/org",
    });

    // Populate form when org data arrives
    useEffect(() => {
        if (org) {
            setName(org.name);
            setCurrency(org.currency);
            setHeader(org.receiptHeader ?? "");
            setFooter(org.receiptFooter ?? "");
        }
    }, [org]);

    const { mutate: saveSettings, isPending: saving } = useApiPut<OrgSettings, Partial<OrgSettings>>({
        path: "/org",
        invalidateKeys: [["org"]],
        onSuccess: (updated) => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            toast.success("Saved", "Receipt settings updated.");
            // Patch the auth user so the org name is reflected immediately
            if (user) {
                setUser({
                    ...user,
                    org: { ...user.org, name: updated.name, currency: updated.currency },
                });
            }
        },
        onError: (err) => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            toast.error("Save Failed", err.message);
        },
    });

    function handleSave() {
        saveSettings({
            name: name.trim() || undefined,
            currency: currency.trim() || undefined,
            receiptHeader: header.trim() || null,
            receiptFooter: footer.trim() || null,
        });
    }

    return (
        <KeyboardAvoidingView
            className="flex-1 bg-background"
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            style={{ paddingTop: insets.top }}
        >
            {/* Header */}
            <View className="flex-row items-center px-4 h-14 border-b border-border bg-card">
                <BackButton />
                <Text className="text-foreground font-semibold text-lg flex-1">Receipt Settings</Text>
                <Button
                    onPress={handleSave}
                    disabled={saving || isLoading}
                    className="h-9 px-5"
                >
                    <Text className="text-primary-foreground font-semibold text-sm">
                        {saving ? "Saving…" : "Save"}
                    </Text>
                </Button>
            </View>

            <ScrollView
                contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
                keyboardDismissMode="on-drag"
            >
                {isLoading ? (
                    <View className="px-5 py-6 gap-4">
                        <Skeleton className="h-12 rounded-xl" />
                        <Skeleton className="h-12 rounded-xl" />
                        <Skeleton className="h-24 rounded-xl" />
                        <Skeleton className="h-24 rounded-xl" />
                    </View>
                ) : (
                    <View className="px-5 py-6 gap-6">
                        {/* Store Info */}
                        <View className="gap-3">
                            <Text className="text-muted-foreground text-xs uppercase tracking-wider font-medium">
                                Store Info
                            </Text>
                            <View className="gap-3">
                                <View className="gap-1.5">
                                    <Text className="text-foreground text-sm font-medium">Store Name</Text>
                                    <TextInput
                                        value={name}
                                        onChangeText={setName}
                                        placeholder="Your store name"
                                        placeholderTextColor={BRAND.dark}
                                        className="bg-card border border-border rounded-xl px-4 h-12 text-foreground text-sm"
                                        autoCapitalize="words"
                                    />
                                </View>
                                <View className="gap-1.5">
                                    <Text className="text-foreground text-sm font-medium">Currency Symbol</Text>
                                    <TextInput
                                        value={currency}
                                        onChangeText={setCurrency}
                                        placeholder="e.g. UGX, USD, €"
                                        placeholderTextColor={BRAND.dark}
                                        className="bg-card border border-border rounded-xl px-4 h-12 text-foreground text-sm"
                                        autoCapitalize="characters"
                                        maxLength={10}
                                    />
                                    <Text className="text-muted-foreground text-xs">
                                        Shown on receipts and throughout the app.
                                    </Text>
                                </View>
                            </View>
                        </View>

                        {/* Receipt Text */}
                        <View className="gap-3">
                            <Text className="text-muted-foreground text-xs uppercase tracking-wider font-medium">
                                Printed Receipt Text
                            </Text>

                            <View className="gap-1.5">
                                <Text className="text-foreground text-sm font-medium">Header</Text>
                                <TextInput
                                    value={header}
                                    onChangeText={setHeader}
                                    placeholder="e.g. Welcome! Enjoy 10% off your next visit"
                                    placeholderTextColor={BRAND.dark}
                                    multiline
                                    numberOfLines={3}
                                    textAlignVertical="top"
                                    maxLength={200}
                                    className="bg-card border border-border rounded-xl px-4 py-3 text-foreground text-sm min-h-[80px]"
                                />
                                <Text className="text-muted-foreground text-xs">
                                    Printed at the top of every receipt, below the store name. ({header.length}/200)
                                </Text>
                            </View>

                            <View className="gap-1.5">
                                <Text className="text-foreground text-sm font-medium">Footer</Text>
                                <TextInput
                                    value={footer}
                                    onChangeText={setFooter}
                                    placeholder="e.g. Thank you for your business! Visit us again."
                                    placeholderTextColor={BRAND.dark}
                                    multiline
                                    numberOfLines={3}
                                    textAlignVertical="top"
                                    maxLength={200}
                                    className="bg-card border border-border rounded-xl px-4 py-3 text-foreground text-sm min-h-[80px]"
                                />
                                <Text className="text-muted-foreground text-xs">
                                    Printed at the bottom of every receipt. ({footer.length}/200)
                                </Text>
                            </View>
                        </View>

                        {/* Preview */}
                        {(header.trim() || footer.trim()) && (
                            <View className="gap-3">
                                <Text className="text-muted-foreground text-xs uppercase tracking-wider font-medium">
                                    Preview
                                </Text>
                                <View className="bg-card border border-dashed border-border rounded-xl p-4 gap-2">
                                    <Text className="text-muted-foreground text-xs text-center">
                                        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                                    </Text>
                                    <Text className="font-bold text-foreground text-center text-sm">{name || org?.name}</Text>
                                    {header.trim() && (
                                        <Text className="text-foreground text-xs text-center">{header.trim()}</Text>
                                    )}
                                    <Text className="text-muted-foreground text-xs text-center">
                                        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                                    </Text>
                                    <Text className="text-muted-foreground text-xs text-center">… receipt items …</Text>
                                    <Text className="text-muted-foreground text-xs text-center">
                                        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                                    </Text>
                                    {footer.trim() && (
                                        <Text className="text-foreground text-xs text-center">{footer.trim()}</Text>
                                    )}
                                </View>
                            </View>
                        )}
                    </View>
                )}
            </ScrollView>
        </KeyboardAvoidingView>
    );
}
