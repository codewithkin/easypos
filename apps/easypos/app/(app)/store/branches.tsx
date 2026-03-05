import { useState } from "react";
import { View, FlatList, Pressable, RefreshControl } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";

import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { BackButton } from "@/components/back-button";
import { useAuthStore } from "@/store/auth";
import { useApiQuery, useApiPost, useApiPut, useApiDelete } from "@/hooks/use-api";
import { toast } from "@/lib/toast";
import { PLAN_LIMITS } from "@easypos/types";
import type { Branch } from "@easypos/types";
import { cn } from "@/lib/utils";
import { BRAND } from "@/lib/theme";
import { BottomSheetModal, BottomSheetModalProvider, BottomSheetBackdrop, BottomSheetScrollView } from "@gorhom/bottom-sheet";
import { useRef, useCallback } from "react";
import { TextInput, KeyboardAvoidingView, Platform } from "react-native";

type BranchWithCount = Branch & {
    _count?: { users: number; devices: number; sales: number };
};

interface BranchForm {
    name: string;
    address: string;
    phone: string;
    isActive: boolean;
}

const EMPTY_FORM: BranchForm = { name: "", address: "", phone: "", isActive: true };

export default function BranchesScreen() {
    const insets = useSafeAreaInsets();
    const user = useAuthStore((s) => s.user);

    const [form, setForm] = useState<BranchForm>(EMPTY_FORM);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<BranchWithCount | null>(null);

    const sheetRef = useRef<BottomSheetModal>(null);

    const { data: branchesData, isLoading, refetch, isRefetching } = useApiQuery<{ items: BranchWithCount[] }>({
        queryKey: ["branches"],
        path: "/branches",
    });

    const branches = branchesData?.items ?? [];
    const maxBranches = user?.org.maxBranches ?? 1;
    const atLimit = branches.length >= maxBranches;
    const plan = user?.org.plan ?? "starter";
    const planLimits = PLAN_LIMITS[plan as keyof typeof PLAN_LIMITS];

    const { mutate: createBranch, isPending: creating } = useApiPost<Branch, Partial<BranchForm>>({
        path: "/branches",
        invalidateKeys: [["branches"]],
        onSuccess: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            toast.success("Branch created");
            sheetRef.current?.dismiss();
            setForm(EMPTY_FORM);
            setEditingId(null);
        },
        onError: (err) => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            toast.error("Failed", err.message);
        },
    });

    const { mutate: updateBranch, isPending: updating } = useApiPut<Branch, Partial<BranchForm>>({
        path: editingId ? `/branches/${editingId}` : "/branches/noop",
        invalidateKeys: [["branches"]],
        onSuccess: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            toast.success("Branch updated");
            sheetRef.current?.dismiss();
            setForm(EMPTY_FORM);
            setEditingId(null);
        },
        onError: (err) => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            toast.error("Failed", err.message);
        },
    });

    const { mutate: deleteBranch, isPending: deleting } = useApiDelete({
        path: deleteTarget ? `/branches/${deleteTarget.id}` : "/branches/noop",
        invalidateKeys: [["branches"]],
        onSuccess: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            toast.success("Branch deleted");
            setDeleteTarget(null);
        },
        onError: (err) => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            toast.error("Failed", err.message);
        },
    });

    function openCreate() {
        setEditingId(null);
        setForm(EMPTY_FORM);
        sheetRef.current?.present();
    }

    function openEdit(branch: BranchWithCount) {
        setEditingId(branch.id);
        setForm({
            name: branch.name,
            address: branch.address ?? "",
            phone: branch.phone ?? "",
            isActive: branch.isActive,
        });
        sheetRef.current?.present();
    }

    function handleSubmit() {
        if (!form.name.trim()) {
            toast.error("Name required", "Enter a branch name.");
            return;
        }
        const payload = {
            name: form.name.trim(),
            address: form.address.trim() || undefined,
            phone: form.phone.trim() || undefined,
            isActive: form.isActive,
        };
        if (editingId) {
            updateBranch(payload);
        } else {
            createBranch(payload);
        }
    }

    const renderBackdrop = useCallback(
        (props: any) => <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} opacity={0.4} />,
        [],
    );

    function renderBranch({ item }: { item: BranchWithCount }) {
        return (
            <Pressable
                onPress={() => openEdit(item)}
                className="px-5 py-3.5 active:bg-secondary"
            >
                <View className="flex-row items-center justify-between">
                    <View className="flex-1 mr-3">
                        <View className="flex-row items-center gap-2">
                            <Text className="text-foreground font-medium text-sm">{item.name}</Text>
                            {!item.isActive && (
                                <View className="px-1.5 py-0.5 rounded bg-destructive/10 border border-destructive/20">
                                    <Text className="text-[10px] text-destructive font-medium">Inactive</Text>
                                </View>
                            )}
                        </View>
                        <View className="flex-row items-center gap-2 mt-0.5 flex-wrap">
                            {item.address && (
                                <Text className="text-muted-foreground text-xs">{item.address}</Text>
                            )}
                            {item.phone && (
                                <Text className="text-muted-foreground text-xs">{item.phone}</Text>
                            )}
                        </View>
                        {item._count && (
                            <Text className="text-muted-foreground text-xs mt-0.5">
                                {item._count.users} users · {item._count.sales} sales
                            </Text>
                        )}
                    </View>
                    <Ionicons name="chevron-forward" size={16} color={BRAND.mid} />
                </View>
            </Pressable>
        );
    }

    return (
        <BottomSheetModalProvider>
            <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
                {/* Header */}
                <View className="flex-row items-center px-4 h-14 border-b border-border bg-card">
                    <BackButton />
                    <Text className="text-foreground font-semibold text-lg flex-1">Branches</Text>
                    <Pressable
                        onPress={atLimit ? undefined : openCreate}
                        className={cn(
                            "w-9 h-9 rounded-xl items-center justify-center",
                            atLimit ? "bg-secondary opacity-40" : "bg-primary",
                        )}
                        disabled={atLimit}
                    >
                        <Ionicons name="add" size={20} color={atLimit ? BRAND.dark : "white"} />
                    </Pressable>
                </View>

                {/* Plan limit bar */}
                <View className="mx-5 mt-4 p-4 rounded-xl bg-card border border-border">
                    <View className="flex-row items-center justify-between mb-2">
                        <Text className="text-foreground text-sm font-medium">
                            {branches.length} / {maxBranches} branches
                        </Text>
                        <View className="px-2 py-0.5 rounded-full bg-primary/10">
                            <Text className="text-primary text-xs font-medium capitalize">{plan} plan</Text>
                        </View>
                    </View>
                    <View className="h-2 bg-secondary rounded-full overflow-hidden">
                        <View
                            className={cn("h-full rounded-full", atLimit ? "bg-destructive" : "bg-primary")}
                            style={{ width: `${Math.min(100, (branches.length / maxBranches) * 100)}%` }}
                        />
                    </View>
                    {atLimit && (
                        <Pressable onPress={() => router.push("/(app)/billing/plans")} className="mt-2 flex-row items-center gap-1">
                            <Ionicons name="arrow-up-circle-outline" size={14} color={BRAND.brand} />
                            <Text className="text-primary text-xs font-medium">Upgrade plan to add more branches</Text>
                        </Pressable>
                    )}
                </View>

                {/* Branch list */}
                {isLoading ? (
                    <View className="px-5 mt-4 gap-3">
                        {Array.from({ length: 3 }).map((_, i) => (
                            <Skeleton key={i} className="h-16 rounded-xl" />
                        ))}
                    </View>
                ) : branches.length === 0 ? (
                    <View className="flex-1 items-center justify-center gap-3">
                        <Ionicons name="business-outline" size={48} color={BRAND.mid} />
                        <Text className="text-muted-foreground text-base">No branches yet</Text>
                        <Button onPress={openCreate} className="h-10 px-6">
                            <Text className="text-primary-foreground font-semibold text-sm">Add Branch</Text>
                        </Button>
                    </View>
                ) : (
                    <FlatList
                        data={branches}
                        keyExtractor={(item) => item.id}
                        renderItem={renderBranch}
                        ItemSeparatorComponent={() => <Separator className="ml-5" />}
                        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
                        className="mt-4 mx-5 rounded-2xl bg-card border border-border overflow-hidden"
                        contentContainerStyle={{ paddingBottom: 40 }}
                    />
                )}
            </View>

            {/* Create / Edit bottom sheet */}
            <BottomSheetModal
                ref={sheetRef}
                snapPoints={["65%"]}
                backdropComponent={renderBackdrop}
                backgroundStyle={{ backgroundColor: "hsl(0 0% 100%)", borderRadius: 24 }}
                handleIndicatorStyle={{ backgroundColor: BRAND.mid, width: 40 }}
                keyboardBehavior="interactive"
                keyboardBlurBehavior="restore"
            >
                <BottomSheetScrollView
                    contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: insets.bottom + 24 }}
                    keyboardShouldPersistTaps="handled"
                >
                    <Text className="text-foreground font-bold text-lg mb-4">
                        {editingId ? "Edit Branch" : "New Branch"}
                    </Text>

                    <View className="gap-4">
                        <View className="gap-1.5">
                            <Text className="text-foreground text-sm font-medium">Name *</Text>
                            <TextInput
                                value={form.name}
                                onChangeText={(v) => setForm((f) => ({ ...f, name: v }))}
                                placeholder="e.g. Main Branch"
                                placeholderTextColor={BRAND.dark}
                                className="bg-secondary border border-border rounded-xl px-4 h-12 text-foreground text-sm"
                                autoCapitalize="words"
                                autoFocus
                            />
                        </View>

                        <View className="gap-1.5">
                            <Text className="text-foreground text-sm font-medium">Address</Text>
                            <TextInput
                                value={form.address}
                                onChangeText={(v) => setForm((f) => ({ ...f, address: v }))}
                                placeholder="123 Main St, City"
                                placeholderTextColor={BRAND.dark}
                                className="bg-secondary border border-border rounded-xl px-4 h-12 text-foreground text-sm"
                                autoCapitalize="words"
                            />
                        </View>

                        <View className="gap-1.5">
                            <Text className="text-foreground text-sm font-medium">Phone</Text>
                            <TextInput
                                value={form.phone}
                                onChangeText={(v) => setForm((f) => ({ ...f, phone: v }))}
                                placeholder="+256 700 000 000"
                                placeholderTextColor={BRAND.dark}
                                keyboardType="phone-pad"
                                className="bg-secondary border border-border rounded-xl px-4 h-12 text-foreground text-sm"
                            />
                        </View>

                        {editingId && (
                            <Pressable
                                onPress={() => setForm((f) => ({ ...f, isActive: !f.isActive }))}
                                className="flex-row items-center gap-3 p-4 rounded-xl bg-secondary"
                            >
                                <View className={cn(
                                    "w-5 h-5 rounded border-2 items-center justify-center",
                                    form.isActive ? "bg-primary border-primary" : "border-border",
                                )}>
                                    {form.isActive && (
                                        <Ionicons name="checkmark" size={12} color="white" />
                                    )}
                                </View>
                                <Text className="text-foreground text-sm font-medium">Branch is active</Text>
                            </Pressable>
                        )}

                        <View className="flex-row gap-3 mt-2">
                            {editingId && (
                                <Pressable
                                    onPress={() => setDeleteTarget(branches.find((b) => b.id === editingId) ?? null)}
                                    className="flex-1 h-12 rounded-xl bg-destructive/10 border border-destructive/20 items-center justify-center"
                                >
                                    <Text className="text-destructive font-semibold text-sm">Delete</Text>
                                </Pressable>
                            )}
                            <Button
                                onPress={handleSubmit}
                                disabled={creating || updating}
                                className={cn("h-12 items-center justify-center", editingId ? "flex-1" : "w-full")}
                            >
                                <Text className="text-primary-foreground font-semibold text-sm">
                                    {creating || updating ? "Saving…" : editingId ? "Update" : "Create Branch"}
                                </Text>
                            </Button>
                        </View>
                    </View>
                </BottomSheetScrollView>
            </BottomSheetModal>

            <ConfirmDialog
                open={!!deleteTarget}
                onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
                title="Delete Branch"
                description={`Remove "${deleteTarget?.name}"? This cannot be undone.`}
                confirmText="Delete"
                destructive
                isLoading={deleting}
                onConfirm={() => deleteTarget && deleteBranch(undefined as any)}
            />
        </BottomSheetModalProvider>
    );
}
