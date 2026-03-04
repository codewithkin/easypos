import { useState } from "react";
import { View, FlatList, Pressable, RefreshControl } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Text } from "@/components/ui/text";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { BackButton } from "@/components/back-button";
import { useAuthStore } from "@/store/auth";
import { useRole } from "@/hooks/use-role";
import { useApiQuery, useApiPut } from "@/hooks/use-api";
import { toast } from "@/lib/toast";
import { ROLE_LABELS } from "@easypos/utils";
import type { User } from "@easypos/types";
import { cn } from "@/lib/utils";

type TeamMember = User & { branch?: { id: string; name: string } | null };

const ROLE_COLORS: Record<string, string> = {
    ADMIN: "bg-primary/10 border-primary/30 text-primary",
    MANAGER: "bg-blue-500/10 border-blue-500/30 text-blue-500",
    STAFF: "bg-secondary border-border text-muted-foreground",
};

export default function ManageTeamScreen() {
    const insets = useSafeAreaInsets();
    const user = useAuthStore((s) => s.user);
    const { isAdmin, canManage } = useRole();
    const [toggleTarget, setToggleTarget] = useState<TeamMember | null>(null);

    const { data, isLoading, refetch, isRefetching } = useApiQuery<{ items: TeamMember[] }>({
        queryKey: ["team"],
        path: "/users",
    });

    const { mutate: updateUser, isPending: isUpdating } = useApiPut<unknown, { isActive: boolean }>({
        path: "",
        invalidateKeys: [["team"]],
        onSuccess: () => {
            const action = toggleTarget?.isActive ? "deactivated" : "reactivated";
            toast.success(`Account ${action}`);
            setToggleTarget(null);
        },
        onError: (err) => toast.error(err.message),
    });

    const members = data?.items ?? [];

    function handleToggleActive(member: TeamMember) {
        setToggleTarget(member);
    }

    // Group by role
    const grouped = members.reduce(
        (acc, m) => {
            const key = m.role;
            if (!acc[key]) acc[key] = [];
            acc[key].push(m);
            return acc;
        },
        {} as Record<string, TeamMember[]>,
    );

    const ORDER = ["ADMIN", "MANAGER", "STAFF"] as const;
    const sections = ORDER.filter((r) => grouped[r]?.length > 0).map((role) => ({
        role,
        data: grouped[role],
    }));

    function renderMember(member: TeamMember) {
        const isSelf = member.id === user?.id;
        const roleStyle = ROLE_COLORS[member.role] ?? ROLE_COLORS.STAFF;

        return (
            <View key={member.id} className="px-4 py-3.5">
                <View className="flex-row items-center">
                    {/* Avatar */}
                    <View className="w-10 h-10 rounded-full bg-secondary items-center justify-center mr-3">
                        <Text className="text-foreground font-bold text-sm">
                            {member.name.charAt(0).toUpperCase()}
                        </Text>
                    </View>

                    {/* Info */}
                    <View className="flex-1">
                        <View className="flex-row items-center gap-2">
                            <Text className="text-foreground font-medium text-sm">{member.name}</Text>
                            {isSelf && (
                                <Text className="text-muted-foreground text-xs">(you)</Text>
                            )}
                            {!member.isActive && (
                                <Badge variant="outline" className="px-1.5 py-0.5 bg-destructive/10 border-destructive/30">
                                    <Text className="text-[10px] text-destructive font-medium">Inactive</Text>
                                </Badge>
                            )}
                        </View>
                        <Text className="text-muted-foreground text-xs">{member.email}</Text>
                        {member.branch && (
                            <Text className="text-muted-foreground text-xs">{member.branch.name}</Text>
                        )}
                    </View>

                    {/* Role badge + actions */}
                    <View className="items-end gap-2">
                        <View className={cn("px-2 py-1 rounded-full border", roleStyle.split(" ").slice(0, 2).join(" "))}>
                            <Text className={cn("text-xs font-medium", roleStyle.split(" ")[2])}>
                                {ROLE_LABELS[member.role]}
                            </Text>
                        </View>
                        {canManage && !isSelf && member.role !== "ADMIN" && (
                            <Pressable onPress={() => handleToggleActive(member)}>
                                <Text className={cn("text-xs", member.isActive ? "text-destructive" : "text-primary")}>
                                    {member.isActive ? "Deactivate" : "Reactivate"}
                                </Text>
                            </Pressable>
                        )}
                    </View>
                </View>
            </View>
        );
    }

    return (
        <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
            {/* Header */}
            <View className="flex-row items-center px-4 h-14 border-b border-border bg-card">
                <BackButton />
                <Text className="text-foreground font-semibold text-lg flex-1">Team Members</Text>
                {canManage && (
                    <Pressable
                        onPress={() => router.push("/(app)/team/invite")}
                        className="flex-row items-center gap-1.5 bg-primary px-3 py-2 rounded-lg"
                    >
                        <Ionicons name="person-add" size={15} color="hsl(0 0% 98%)" />
                        <Text className="text-primary-foreground font-semibold text-sm">Invite</Text>
                    </Pressable>
                )}
            </View>

            {/* Stats */}
            <View className="flex-row px-4 py-3 gap-3">
                {ORDER.map((role) => (
                    <View key={role} className="flex-1 p-3 rounded-xl bg-card border border-border items-center">
                        <Text className="text-foreground font-bold text-xl">{grouped[role]?.length ?? 0}</Text>
                        <Text className="text-muted-foreground text-xs">{ROLE_LABELS[role]}{(grouped[role]?.length ?? 0) !== 1 ? "s" : ""}</Text>
                    </View>
                ))}
            </View>

            {/* List */}
            {isLoading ? (
                <View className="px-4 gap-3 mt-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <Skeleton key={i} className="h-16 rounded-lg" />
                    ))}
                </View>
            ) : (
                <FlatList
                    data={sections}
                    keyExtractor={(item) => item.role}
                    refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
                    contentContainerStyle={{ paddingBottom: 40 }}
                    renderItem={({ item: section }) => (
                        <View>
                            <View className="px-4 pt-5 pb-2">
                                <Text className="text-muted-foreground text-xs uppercase tracking-wider">
                                    {ROLE_LABELS[section.role]}s ({section.data.length})
                                </Text>
                            </View>
                            {section.data.map((member, idx) => (
                                <View key={member.id}>
                                    {renderMember(member)}
                                    {idx < section.data.length - 1 && <Separator className="ml-16" />}
                                </View>
                            ))}
                        </View>
                    )}
                />
            )}

            <ConfirmDialog
                open={toggleTarget !== null}
                onOpenChange={(open) => { if (!open) setToggleTarget(null); }}
                title={toggleTarget?.isActive ? "Deactivate Account" : "Reactivate Account"}
                description={`${toggleTarget?.isActive ? "Deactivate" : "Reactivate"} ${toggleTarget?.name}? They will ${toggleTarget?.isActive ? "lose" : "regain"} access to EasyPOS.`}
                confirmText={toggleTarget?.isActive ? "Deactivate" : "Reactivate"}
                destructive={toggleTarget?.isActive}
                isLoading={isUpdating}
                onConfirm={() => {
                    if (toggleTarget) updateUser({ isActive: !toggleTarget.isActive });
                }}
            />
        </View>
    );
}
