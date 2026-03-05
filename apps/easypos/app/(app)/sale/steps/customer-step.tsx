import { useState, useCallback } from "react";
import {
    View,
    ScrollView,
    Pressable,
    TextInput,
    ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { Text } from "@/components/ui/text";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useApiQuery, useApiPost } from "@/hooks/use-api";
import { useSaleStore, type SaleCustomer } from "@/store/sale";
import { cn } from "@/lib/utils";
import { BRAND } from "@/lib/theme";
import { toast } from "@/lib/toast";

type Gender = "MALE" | "FEMALE";

const GENDER_OPTIONS: { value: Gender; label: string }[] = [
    { value: "MALE", label: "Male" },
    { value: "FEMALE", label: "Female" },
];

interface ExistingCustomer {
    id: string;
    name: string;
    phone: string | null;
    email: string | null;
    gender: Gender | null;
}

/** Step 2 — Customer selection / creation */
export function CustomerStep() {
    const { customer, setCustomer } = useSaleStore();

    const [search, setSearch] = useState("");
    const [mode, setMode] = useState<"list" | "create" | "none">("list");

    // New customer form
    const [newName, setNewName] = useState("");
    const [newPhone, setNewPhone] = useState("");
    const [newGender, setNewGender] = useState<Gender | null>(null);

    const { data: customersData, isLoading } = useApiQuery<{
        items: ExistingCustomer[];
        total: number;
    }>({
        queryKey: ["customers", "sale-picker"],
        path: `/customers?pageSize=50${search ? `&search=${encodeURIComponent(search)}` : ""}`,
    });

    const { mutate: createCustomer, isPending: isCreating } = useApiPost<
        ExistingCustomer,
        { name: string; phone?: string; gender?: Gender }
    >({
        path: "/customers",
        invalidateKeys: [["customers"]],
        onSuccess: (created) => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            setCustomer({ id: created.id, name: created.name, phone: created.phone ?? undefined, gender: created.gender ?? undefined });
            setMode("list");
        },
        onError: (err) => {
            toast.error("Could not create customer", err.message);
        },
    });

    function selectCustomer(c: ExistingCustomer) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setCustomer({ id: c.id, name: c.name, phone: c.phone ?? undefined, gender: c.gender ?? undefined });
    }

    function handleSkip() {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setCustomer(null);
    }

    function handleCreateSubmit() {
        if (!newName.trim()) {
            toast.warning("Name required", "Please enter the customer's name.");
            return;
        }
        createCustomer({
            name: newName.trim(),
            ...(newPhone.trim() ? { phone: newPhone.trim() } : {}),
            ...(newGender ? { gender: newGender } : {}),
        });
    }

    const customers = customersData?.items ?? [];

    return (
        <ScrollView
            className="flex-1"
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingBottom: 120 }}
        >
            <View className="px-4 py-4 gap-4">
                {/* Skip */}
                <Pressable
                    onPress={handleSkip}
                    className={cn(
                        "flex-row items-center gap-3 px-4 py-3.5 rounded-xl border",
                        customer === null
                            ? "bg-primary/5 border-primary"
                            : "bg-card border-border",
                    )}
                >
                    <View className={cn(
                        "w-9 h-9 rounded-full items-center justify-center",
                        customer === null ? "bg-primary" : "bg-secondary",
                    )}>
                        <Ionicons
                            name="person-outline"
                            size={18}
                            color={customer === null ? "white" : BRAND.dark}
                        />
                    </View>
                    <View className="flex-1">
                        <Text className={cn("font-semibold text-sm", customer === null ? "text-primary" : "text-foreground")}>
                            No customer (walk-in)
                        </Text>
                        <Text className="text-muted-foreground text-xs">Skip this step</Text>
                    </View>
                    {customer === null && (
                        <Ionicons name="checkmark-circle" size={20} color={BRAND.brand} />
                    )}
                </Pressable>

                <Separator />

                {/* Selected customer badge */}
                {customer?.id && (
                    <View className="flex-row items-center gap-3 px-4 py-3.5 rounded-xl bg-primary/5 border border-primary">
                        <View className="w-9 h-9 rounded-full bg-primary items-center justify-center">
                            <Text className="text-primary-foreground font-bold text-sm">
                                {customer.name[0].toUpperCase()}
                            </Text>
                        </View>
                        <View className="flex-1">
                            <Text className="text-primary font-semibold text-sm">{customer.name}</Text>
                            {customer.phone && (
                                <Text className="text-muted-foreground text-xs">{customer.phone}</Text>
                            )}
                        </View>
                        <Pressable onPress={() => setCustomer(null)}>
                            <Ionicons name="close-circle" size={20} color={BRAND.mid} />
                        </Pressable>
                    </View>
                )}

                {/* Search existing */}
                <Text className="text-muted-foreground text-xs uppercase tracking-wider">
                    Search existing customers
                </Text>
                <View className="flex-row items-center bg-secondary rounded-xl px-3 h-11">
                    <Ionicons name="search" size={18} color={BRAND.dark} />
                    <TextInput
                        placeholder="Name or phone..."
                        placeholderTextColor={BRAND.dark}
                        value={search}
                        onChangeText={setSearch}
                        className="flex-1 ml-2 text-foreground text-sm"
                    />
                    {isLoading && <ActivityIndicator size="small" color={BRAND.brand} />}
                    {search.length > 0 && !isLoading && (
                        <Pressable onPress={() => setSearch("")}>
                            <Ionicons name="close-circle" size={18} color={BRAND.dark} />
                        </Pressable>
                    )}
                </View>

                {customers.length > 0 && (
                    <View className="rounded-xl border border-border overflow-hidden bg-card">
                        {customers.map((c, idx) => (
                            <View key={c.id}>
                                {idx > 0 && <Separator />}
                                <Pressable
                                    onPress={() => selectCustomer(c)}
                                    className="flex-row items-center gap-3 px-4 py-3 active:bg-secondary"
                                >
                                    <View className={cn(
                                        "w-8 h-8 rounded-full items-center justify-center",
                                        customer?.id === c.id ? "bg-primary" : "bg-secondary",
                                    )}>
                                        <Text className={cn(
                                            "font-bold text-sm",
                                            customer?.id === c.id ? "text-primary-foreground" : "text-foreground",
                                        )}>
                                            {c.name[0].toUpperCase()}
                                        </Text>
                                    </View>
                                    <View className="flex-1">
                                        <Text className="text-foreground text-sm font-medium">{c.name}</Text>
                                        {c.phone && (
                                            <Text className="text-muted-foreground text-xs">{c.phone}</Text>
                                        )}
                                    </View>
                                    {customer?.id === c.id && (
                                        <Ionicons name="checkmark-circle" size={18} color={BRAND.brand} />
                                    )}
                                </Pressable>
                            </View>
                        ))}
                    </View>
                )}

                {customers.length === 0 && search.length > 0 && !isLoading && (
                    <Text className="text-muted-foreground text-sm text-center py-2">
                        No customers found — create one below
                    </Text>
                )}

                <Separator />

                {/* Create new */}
                <Pressable
                    onPress={() => setMode(mode === "create" ? "list" : "create")}
                    className="flex-row items-center gap-2"
                >
                    <Ionicons
                        name={mode === "create" ? "chevron-up" : "add-circle-outline"}
                        size={18}
                        color={BRAND.brand}
                    />
                    <Text className="text-primary text-sm font-semibold">New customer</Text>
                </Pressable>

                {mode === "create" && (
                    <View className="gap-4 p-4 rounded-xl bg-card border border-border">
                        <View className="gap-1.5">
                            <Label nativeID="cn-name">Name *</Label>
                            <Input
                                id="cn-name"
                                placeholder="Customer name"
                                value={newName}
                                onChangeText={setNewName}
                                autoCapitalize="words"
                                className="h-11"
                            />
                        </View>
                        <View className="gap-1.5">
                            <Label nativeID="cn-phone">Phone</Label>
                            <Input
                                id="cn-phone"
                                placeholder="+1 555 000 0000"
                                value={newPhone}
                                onChangeText={setNewPhone}
                                keyboardType="phone-pad"
                                className="h-11"
                            />
                        </View>

                        {/* Gender */}
                        <View className="gap-1.5">
                            <Label nativeID="cn-gender">Gender</Label>
                            <View className="flex-row gap-2">
                                {GENDER_OPTIONS.map((g) => (
                                    <Pressable
                                        key={g.value}
                                        onPress={() => setNewGender(newGender === g.value ? null : g.value)}
                                        className={cn(
                                            "flex-1 py-2 rounded-lg border items-center",
                                            newGender === g.value
                                                ? "bg-primary border-primary"
                                                : "bg-secondary border-border",
                                        )}
                                    >
                                        <Text className={cn(
                                            "text-xs font-medium",
                                            newGender === g.value ? "text-primary-foreground" : "text-foreground",
                                        )}>
                                            {g.label}
                                        </Text>
                                    </Pressable>
                                ))}
                            </View>
                        </View>

                        <Pressable
                            onPress={handleCreateSubmit}
                            disabled={isCreating}
                            className={cn(
                                "h-11 rounded-xl bg-primary items-center justify-center",
                                isCreating && "opacity-60",
                            )}
                        >
                            <Text className="text-primary-foreground font-semibold text-sm">
                                {isCreating ? "Creating..." : "Create & Select"}
                            </Text>
                        </Pressable>
                    </View>
                )}
            </View>
        </ScrollView>
    );
}
