import { useState } from "react";
import { View, Pressable, useWindowDimensions } from "react-native";
import { router } from "expo-router";
import { useNavigation, DrawerActions } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Text } from "@/components/ui/text";
import { Separator } from "@/components/ui/separator";
import { Container } from "@/components/Container";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { useAuthStore } from "@/store/auth";
import { useRole } from "@/hooks/use-role";
import { useApiQuery } from "@/hooks/use-api";
import { ROLE_LABELS } from "@easypos/utils";
import { cn } from "@/lib/utils";
import { BRAND } from "@/lib/theme";

interface SettingsItemProps {
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
    subtitle?: string;
    onPress?: () => void;
    destructive?: boolean;
    right?: React.ReactNode;
}

function SettingsItem({ icon, label, subtitle, onPress, destructive, right }: SettingsItemProps) {
    return (
        <Pressable
            onPress={onPress}
            className="flex-row items-center px-5 py-3.5 active:bg-secondary"
        >
            <View
                className={cn(
                    "w-9 h-9 rounded-xl items-center justify-center mr-3",
                    destructive ? "bg-destructive/10" : "bg-secondary",
                )}
            >
                <Ionicons
                    name={icon}
                    size={18}
                    color={destructive ? BRAND.red : BRAND.dark}
                />
            </View>
            <View className="flex-1">
                <Text className={cn(
                    "font-medium text-sm",
                    destructive ? "text-destructive" : "text-foreground",
                )}>
                    {label}
                </Text>
                {subtitle && (
                    <Text className="text-muted-foreground text-xs mt-0.5">{subtitle}</Text>
                )}
            </View>
            {right ?? <Ionicons name="chevron-forward" size={16} color={BRAND.mid} />}
        </Pressable>
    );
}

function SectionHeader({ title }: { title: string }) {
    return (
        <Text className="text-muted-foreground text-xs uppercase tracking-wider px-5 mb-1 mt-6">
            {title}
        </Text>
    );
}

export default function StoreScreen() {
    const insets = useSafeAreaInsets();
    const navigation = useNavigation();
    const { width } = useWindowDimensions();
    const isTablet = width >= 768;
    const user = useAuthStore((s) => s.user);
    const { isAdmin, canManage } = useRole();

    const { data: teamData } = useApiQuery<{ items: unknown[]; total: number }>({
        queryKey: ["team", "count"],
        path: "/users?pageSize=1",
        enabled: canManage,
    });

    return (
        <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
            {/* ── Header ── */}
            <View className="flex-row items-center gap-3 px-5 h-14">
                {!isTablet && (
                    <Pressable
                        onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
                        className="w-10 h-10 rounded-xl bg-secondary items-center justify-center"
                    >
                        <Ionicons name="menu" size={22} color={BRAND.darkest} />
                    </Pressable>
                )}
                <Text className="text-2xl font-bold text-foreground">My Store</Text>
            </View>

            <Container>
                {/* ── Store Card ── */}
                <View className="mx-5 mt-2 p-5 rounded-2xl bg-card border border-border">
                    <View className="flex-row items-center">
                        <View className="w-14 h-14 rounded-2xl bg-primary items-center justify-center">
                            <Text className="text-primary-foreground text-xl font-bold">
                                {user?.org.name?.charAt(0).toUpperCase()}
                            </Text>
                        </View>
                        <View className="ml-4 flex-1">
                            <Text className="text-foreground font-bold text-lg">{user?.org.name}</Text>
                            <View className="flex-row items-center gap-2 mt-0.5">
                                <View className="px-2 py-0.5 rounded-full bg-primary/10">
                                    <Text className="text-primary text-xs font-medium">
                                        {user?.org.plan?.charAt(0).toUpperCase()}{user?.org.plan?.slice(1)} Plan
                                    </Text>
                                </View>
                                <Text className="text-muted-foreground text-xs">
                                    {user?.org.currency}
                                </Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* ── Your Profile ── */}
                <SectionHeader title="Your Profile" />
                <View className="mx-5 rounded-2xl bg-card border border-border overflow-hidden">
                    <View className="flex-row items-center px-5 py-4">
                        <View className="w-10 h-10 rounded-full bg-primary/10 items-center justify-center mr-3">
                            <Text className="text-primary font-bold text-sm">
                                {user?.name?.charAt(0).toUpperCase()}
                            </Text>
                        </View>
                        <View className="flex-1">
                            <Text className="text-foreground font-semibold text-sm">{user?.name}</Text>
                            <Text className="text-muted-foreground text-xs">{user?.email}</Text>
                        </View>
                        <View className="px-2.5 py-1 rounded-full bg-primary/10">
                            <Text className="text-primary text-xs font-medium">
                                {ROLE_LABELS[user?.role ?? "STAFF"]}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* ── Team — Admin/Manager only ── */}
                {canManage && (
                    <>
                        <SectionHeader title="Team" />
                        <View className="mx-5 rounded-2xl bg-card border border-border overflow-hidden">
                            <SettingsItem
                                icon="people-outline"
                                label="Team Members"
                                subtitle={`${teamData?.total ?? 0} members`}
                                onPress={() => router.push("/(app)/team")}
                            />
                            {canManage && (
                                <>
                                    <Separator className="ml-16" />
                                    <SettingsItem
                                        icon="person-add-outline"
                                        label="Invite Member"
                                        subtitle="Add staff or managers"
                                        onPress={() => router.push("/(app)/team/invite")}
                                    />
                                </>
                            )}
                        </View>
                    </>
                )}

                {/* ── Billing — Admin only ── */}
                {isAdmin && (
                    <>
                        <SectionHeader title="Billing" />
                        <View className="mx-5 rounded-2xl bg-card border border-border overflow-hidden">
                            <SettingsItem
                                icon="card-outline"
                                label="Subscription Plan"
                                subtitle={`${user?.org.plan?.charAt(0).toUpperCase()}${user?.org.plan?.slice(1) ?? ""} Plan`}
                                onPress={() => router.push("/(app)/billing/plans")}
                            />
                            <Separator className="ml-16" />
                            <SettingsItem
                                icon="stats-chart-outline"
                                label="Usage & Limits"
                                subtitle="View plan usage"
                                onPress={() => router.push("/(app)/billing/usage")}
                            />
                        </View>
                    </>
                )}

                {/* ── Store Settings — Admin only ── */}
                {isAdmin && (
                    <>
                        <SectionHeader title="Store Settings" />
                        <View className="mx-5 rounded-2xl bg-card border border-border overflow-hidden">
                            <SettingsItem
                                icon="business-outline"
                                label="Manage Branches"
                                subtitle="View and configure branches"
                            />
                            <Separator className="ml-16" />
                            <SettingsItem
                                icon="receipt-outline"
                                label="Receipt Settings"
                                subtitle="Header & footer text"
                            />
                            <Separator className="ml-16" />
                            <SettingsItem
                                icon="print-outline"
                                label="Printer Setup"
                                subtitle="Bluetooth printers"
                            />
                        </View>
                    </>
                )}

                {/* ── App Info ── */}
                <View className="items-center mt-8 mb-6">
                    <View className="flex-row items-center gap-2 mb-1">
                        <View className="w-6 h-6 rounded-md bg-primary items-center justify-center">
                            <Text className="text-primary-foreground text-[10px] font-bold">E</Text>
                        </View>
                        <Text className="text-muted-foreground text-xs font-medium">EasyPOS</Text>
                    </View>
                    <Text className="text-muted-foreground text-xs">v1.0.0</Text>
                </View>
            </Container>
        </View>
    );
}
