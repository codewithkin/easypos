import { useState } from "react";
import {
    View,
    ScrollView,
    Pressable,
    KeyboardAvoidingView,
    Platform,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Text } from "@/components/ui/text";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useRole } from "@/hooks/use-role";
import { useApiQuery, useApiPost } from "@/hooks/use-api";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import type { Branch } from "@easypos/types";

type RoleOption = { value: "MANAGER" | "STAFF"; label: string; description: string };

const ROLE_OPTIONS: RoleOption[] = [
    {
        value: "MANAGER",
        label: "Manager",
        description: "Can manage products, view reports, and invite staff.",
    },
    {
        value: "STAFF",
        label: "Staff",
        description: "Can process sales. No access to management features.",
    },
];

export default function InviteTeamMemberScreen() {
    const insets = useSafeAreaInsets();
    const { isAdmin } = useRole();

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [role, setRole] = useState<"MANAGER" | "STAFF">("STAFF");
    const [branchId, setBranchId] = useState<string | null>(null);

    // Only admins can select a different branch
    const { data: branchData, isLoading: loadingBranches } = useApiQuery<{ items: Branch[] }>({
        queryKey: ["branches"],
        path: "/branches",
        enabled: isAdmin,
    });
    const branches = branchData?.items ?? [];

    const availableRoles = isAdmin ? ROLE_OPTIONS : ROLE_OPTIONS.filter((r) => r.value === "STAFF");

    const { mutate: inviteMember, isPending } = useApiPost<unknown, {
        name: string;
        email: string;
        role: "MANAGER" | "STAFF";
        branchId?: string;
    }>({
        path: "/users/invite",
        invalidateKeys: [["team"]],
        onSuccess: () => {
            toast.success("Invitation sent", `${name} will receive their login credentials by email.`);
            router.back();
        },
        onError: (err) => {
            toast.error(err.message ?? "Failed to send invitation.");
        },
    });

    function handleSubmit() {
        const trimmedName = name.trim();
        const trimmedEmail = email.trim().toLowerCase();

        if (!trimmedName) return toast.error("Name is required.");
        if (!trimmedEmail) return toast.error("Email is required.");
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail))
            return toast.error("Please enter a valid email address.");

        inviteMember({
            name: trimmedName,
            email: trimmedEmail,
            role,
            ...(isAdmin && branchId ? { branchId } : {}),
        });
    }

    return (
        <KeyboardAvoidingView
            className="flex-1"
            behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
            <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
                {/* Header */}
                <View className="flex-row items-center px-4 h-14 border-b border-border bg-card">
                    <Pressable onPress={() => router.back()} className="mr-3">
                        <Ionicons name="arrow-back" size={24} color="hsl(0 0% 63.9%)" />
                    </Pressable>
                    <Text className="text-foreground font-semibold text-lg flex-1">Invite Team Member</Text>
                    <Pressable
                        onPress={handleSubmit}
                        disabled={isPending}
                        className={cn(
                            "bg-primary px-4 py-2 rounded-lg",
                            isPending && "opacity-50",
                        )}
                    >
                        <Text className="text-primary-foreground font-semibold text-sm">
                            {isPending ? "Sending…" : "Send Invite"}
                        </Text>
                    </Pressable>
                </View>

                <ScrollView
                    keyboardDismissMode="interactive"
                    contentContainerStyle={{ padding: 16, paddingBottom: 60 }}
                >
                    {/* Info banner */}
                    <View className="flex-row gap-3 p-4 mb-5 rounded-xl bg-primary/10 border border-primary/20">
                        <Ionicons name="mail-outline" size={20} color="hsl(142.1 76.2% 36.3%)" />
                        <Text className="text-primary text-sm flex-1 leading-5">
                            The new member will receive an email with a temporary password. They can change it after their first sign-in.
                        </Text>
                    </View>

                    {/* Name */}
                    <View className="mb-4">
                        <Label className="mb-1.5 text-sm font-medium text-foreground">Full Name</Label>
                        <Input
                            value={name}
                            onChangeText={setName}
                            placeholder="e.g. Jane Doe"
                            autoCapitalize="words"
                            autoCorrect={false}
                            className="bg-card"
                        />
                    </View>

                    {/* Email */}
                    <View className="mb-5">
                        <Label className="mb-1.5 text-sm font-medium text-foreground">Email Address</Label>
                        <Input
                            value={email}
                            onChangeText={setEmail}
                            placeholder="jane@example.com"
                            keyboardType="email-address"
                            autoCapitalize="none"
                            autoCorrect={false}
                            className="bg-card"
                        />
                    </View>

                    {/* Role picker */}
                    <View className="mb-5">
                        <Label className="mb-2 text-sm font-medium text-foreground">Role</Label>
                        <View className="gap-2">
                            {availableRoles.map((opt) => {
                                const selected = role === opt.value;
                                return (
                                    <Pressable
                                        key={opt.value}
                                        onPress={() => setRole(opt.value)}
                                        className={cn(
                                            "flex-row items-start gap-3 p-4 rounded-xl border",
                                            selected
                                                ? "border-primary bg-primary/5"
                                                : "border-border bg-card",
                                        )}
                                    >
                                        <View
                                            className={cn(
                                                "mt-0.5 w-5 h-5 rounded-full border-2 items-center justify-center",
                                                selected ? "border-primary bg-primary" : "border-muted-foreground",
                                            )}
                                        >
                                            {selected && (
                                                <View className="w-2 h-2 rounded-full bg-primary-foreground" />
                                            )}
                                        </View>
                                        <View className="flex-1">
                                            <Text
                                                className={cn(
                                                    "font-semibold text-sm",
                                                    selected ? "text-primary" : "text-foreground",
                                                )}
                                            >
                                                {opt.label}
                                            </Text>
                                            <Text className="text-muted-foreground text-xs mt-0.5 leading-4">
                                                {opt.description}
                                            </Text>
                                        </View>
                                    </Pressable>
                                );
                            })}
                        </View>
                    </View>

                    {/* Branch picker (admin only) */}
                    {isAdmin && (
                        <View className="mb-5">
                            <Label className="mb-2 text-sm font-medium text-foreground">
                                Assign to Branch{" "}
                                <Text className="text-muted-foreground font-normal">(optional)</Text>
                            </Label>
                            {loadingBranches ? (
                                <Skeleton className="h-12 rounded-xl" />
                            ) : branches.length === 0 ? (
                                <View className="p-4 rounded-xl bg-card border border-border">
                                    <Text className="text-muted-foreground text-sm text-center">
                                        No branches found
                                    </Text>
                                </View>
                            ) : (
                                <View className="flex-row flex-wrap gap-2">
                                    <Pressable
                                        onPress={() => setBranchId(null)}
                                        className={cn(
                                            "px-4 py-2 rounded-full border",
                                            branchId === null
                                                ? "border-primary bg-primary/10"
                                                : "border-border bg-card",
                                        )}
                                    >
                                        <Text
                                            className={cn(
                                                "text-sm font-medium",
                                                branchId === null ? "text-primary" : "text-muted-foreground",
                                            )}
                                        >
                                            None
                                        </Text>
                                    </Pressable>
                                    {branches.map((b) => (
                                        <Pressable
                                            key={b.id}
                                            onPress={() => setBranchId(b.id)}
                                            className={cn(
                                                "px-4 py-2 rounded-full border",
                                                branchId === b.id
                                                    ? "border-primary bg-primary/10"
                                                    : "border-border bg-card",
                                            )}
                                        >
                                            <Text
                                                className={cn(
                                                    "text-sm font-medium",
                                                    branchId === b.id ? "text-primary" : "text-muted-foreground",
                                                )}
                                            >
                                                {b.name}
                                            </Text>
                                        </Pressable>
                                    ))}
                                </View>
                            )}
                        </View>
                    )}

                    {/* Manager notice */}
                    {!isAdmin && (
                        <View className="p-4 rounded-xl bg-secondary border border-border">
                            <View className="flex-row items-center gap-2 mb-1">
                                <Ionicons name="information-circle-outline" size={16} color="hsl(0 0% 63.9%)" />
                                <Text className="text-muted-foreground text-xs font-medium">Manager Permissions</Text>
                            </View>
                            <Text className="text-muted-foreground text-xs leading-4">
                                As a Manager, you can only invite Staff members. Contact your Admin to add other Managers.
                            </Text>
                        </View>
                    )}
                </ScrollView>
            </View>
        </KeyboardAvoidingView>
    );
}
