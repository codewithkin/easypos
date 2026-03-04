import { useState } from "react";
import { View, Pressable, KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";

import { Text } from "@/components/ui/text";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useApiPost } from "@/hooks/use-api";
import { toast } from "@/lib/toast";
import { BRAND } from "@/lib/theme";

interface CreateCustomerResponse {
    id: string;
    name: string;
    phone: string | null;
    email: string | null;
    notes: string | null;
}

export default function CreateCustomerScreen() {
    const insets = useSafeAreaInsets();
    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");
    const [email, setEmail] = useState("");
    const [notes, setNotes] = useState("");

    const { mutate: createCustomer, isPending } = useApiPost<CreateCustomerResponse, {
        name: string;
        phone?: string;
        email?: string;
        notes?: string;
    }>({
        path: "/customers",
        invalidateKeys: [["customers"]],
        onSuccess: (data) => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            toast.success("Customer Added", `${data.name} has been saved.`);
            router.back();
        },
        onError: (err) => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            toast.error("Save Failed", err.message);
        },
    });

    function handleSubmit() {
        if (!name.trim()) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            toast.warning("Missing Field", "Customer name is required.");
            return;
        }

        createCustomer({
            name: name.trim(),
            ...(phone.trim() ? { phone: phone.trim() } : {}),
            ...(email.trim() ? { email: email.trim() } : {}),
            ...(notes.trim() ? { notes: notes.trim() } : {}),
        });
    }

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            className="flex-1 bg-background"
            style={{ paddingTop: insets.top }}
        >
            {/* Header */}
            <View className="flex-row items-center px-4 h-14 border-b border-border bg-card">
                <Pressable onPress={() => router.back()} className="mr-3">
                    <Ionicons name="arrow-back" size={24} color={BRAND.dark} />
                </Pressable>
                <Text className="text-foreground font-bold text-lg flex-1">Add Customer</Text>
            </View>

            <ScrollView
                contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
                keyboardShouldPersistTaps="handled"
            >
                <View className="gap-5">
                    <View className="gap-1.5">
                        <Label nativeID="customerName" className="text-foreground">
                            Name <Text className="text-destructive">*</Text>
                        </Label>
                        <Input
                            placeholder="Customer name"
                            value={name}
                            onChangeText={setName}
                            autoCapitalize="words"
                            aria-labelledby="customerName"
                            className="h-12"
                        />
                    </View>

                    <View className="gap-1.5">
                        <Label nativeID="customerPhone" className="text-foreground">
                            Phone
                        </Label>
                        <Input
                            placeholder="+1 234 567 890"
                            value={phone}
                            onChangeText={setPhone}
                            keyboardType="phone-pad"
                            aria-labelledby="customerPhone"
                            className="h-12"
                        />
                    </View>

                    <View className="gap-1.5">
                        <Label nativeID="customerEmail" className="text-foreground">
                            Email
                        </Label>
                        <Input
                            placeholder="customer@email.com"
                            value={email}
                            onChangeText={setEmail}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            aria-labelledby="customerEmail"
                            className="h-12"
                        />
                    </View>

                    <View className="gap-1.5">
                        <Label nativeID="customerNotes" className="text-foreground">
                            Notes
                        </Label>
                        <Input
                            placeholder="VIP customer, prefers delivery, etc."
                            value={notes}
                            onChangeText={setNotes}
                            multiline
                            numberOfLines={3}
                            aria-labelledby="customerNotes"
                            className="h-24"
                            style={{ textAlignVertical: "top" }}
                        />
                    </View>

                    <Button
                        onPress={handleSubmit}
                        disabled={isPending}
                        className="h-12 mt-2"
                    >
                        <Text className="text-primary-foreground font-semibold text-base">
                            {isPending ? "Adding..." : "Add Customer"}
                        </Text>
                    </Button>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}
