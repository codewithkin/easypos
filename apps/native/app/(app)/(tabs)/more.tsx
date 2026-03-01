import { View, Pressable, Alert } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { Text } from "@/components/ui/text";
import { Separator } from "@/components/ui/separator";
import { Container } from "@/components/container";
import { ThemeToggle } from "@/components/theme-toggle";
import { useAuthStore } from "@/store/auth";
import { useRole } from "@/hooks/use-role";
import { ROLE_LABELS } from "@easypos/utils";
import { cn } from "@/lib/utils";

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
            className="flex-row items-center px-4 py-3.5 active:bg-secondary"
        >
            <View
                className={cn(
                    "w-9 h-9 rounded-lg items-center justify-center mr-3",
                    destructive ? "bg-destructive/10" : "bg-secondary",
                )}
            >
                <Ionicons
                    name={icon}
                    size={18}
                    color={destructive ? "hsl(0 84.2% 60.2%)" : "hsl(0 0% 45%)"}
                />
            </View>
            <View className="flex-1">
                <Text
                    className={cn(
                        "font-medium text-sm",
                        destructive ? "text-destructive" : "text-foreground",
                    )}
                >
                    {label}
                </Text>
                {subtitle && (
                    <Text className="text-muted-foreground text-xs mt-0.5">{subtitle}</Text>
                )}
            </View>
            {right ?? (
                <Ionicons name="chevron-forward" size={16} color="hsl(0 0% 45%)" />
            )}
        </Pressable>
    );
}

function SectionHeader({ title }: { title: string }) {
    return (
        <Text className="text-muted-foreground text-xs uppercase tracking-wider px-4 mb-1 mt-5">
            {title}
        </Text>
    );
}

export default function MoreScreen() {
    const user = useAuthStore((s) => s.user);
    const logout = useAuthStore((s) => s.logout);
    const { isAdmin, canManage } = useRole();

    function handleLogout() {
        Alert.alert("Sign Out", "Are you sure you want to sign out?", [
            { text: "Cancel", style: "cancel" },
            { text: "Sign Out", style: "destructive", onPress: logout },
        ]);
    }

    return (
        <Container>
            {/* Profile card */}
            <View className="mx-4 mt-4 p-4 rounded-xl bg-card border border-border">
                <View className="flex-row items-center">
                    <View className="w-12 h-12 rounded-full bg-primary items-center justify-center">
                        <Text className="text-primary-foreground text-lg font-bold">
                            {user?.name.charAt(0).toUpperCase()}
                        </Text>
                    </View>
                    <View className="ml-3 flex-1">
                        <Text className="text-foreground font-semibold text-base">{user?.name}</Text>
                        <Text className="text-muted-foreground text-xs">{user?.email}</Text>
                        <Text className="text-muted-foreground text-xs mt-0.5">
                            {ROLE_LABELS[user?.role ?? "STAFF"]} · {user?.branch?.name ?? "No branch"}
                        </Text>
                    </View>
                </View>
            </View>

            {/* ── Store — Admin only ── */}
            {isAdmin && (
                <>
                    <SectionHeader title="Store" />
                    <SettingsItem
                        icon="business-outline"
                        label="Manage Branches"
                        subtitle="View and configure branches"
                    />
                </>
            )}

            {/* ── Catalogue — Admin and Manager ── */}
            {canManage && (
                <>
                    <SectionHeader title="Catalogue" />
                    <SettingsItem
                        icon="cube-outline"
                        label="Manage Products"
                        onPress={() => router.push("/(app)/products")}
                    />
                    <SettingsItem
                        icon="pricetag-outline"
                        label="Manage Categories"
                    />
                </>
            )}

            {/* ── Team — Admin and Manager ── */}
            {canManage && (
                <>
                    <SectionHeader title="Team" />
                    <SettingsItem
                        icon="people-outline"
                        label="Team Members"
                        onPress={() => router.push("/(app)/team")}
                    />
                </>
            )}

            {/* ── Reports — Admin and Manager ── */}
            {canManage && (
                <>
                    <SectionHeader title="Reports" />
                    <SettingsItem
                        icon="bar-chart-outline"
                        label="Daily Report"
                        subtitle={isAdmin ? "All branches" : "Your branch"}
                    />
                    {isAdmin && (
                        <SettingsItem icon="git-compare-outline" label="Branch Comparison" />
                    )}
                </>
            )}

            {/* ── Device — Admin and Manager ── */}
            {canManage && (
                <>
                    <SectionHeader title="Device" />
                    <SettingsItem icon="print-outline" label="Printer Setup" subtitle="Bluetooth printers" />
                </>
            )}

            {/* ── Preferences — Everyone ── */}
            <Separator className="mt-4" />
            <SectionHeader title="Preferences" />
            <SettingsItem icon="moon-outline" label="Dark Mode" right={<ThemeToggle />} />

            {/* ── Account — Everyone ── */}
            <Separator className="mt-2" />
            <SectionHeader title="Account" />
            <SettingsItem
                icon="log-out-outline"
                label="Sign Out"
                destructive
                onPress={handleLogout}
            />

            <View className="items-center mt-8 mb-4">
                <Text className="text-muted-foreground text-xs">EasyPOS v1.0.0</Text>
            </View>
        </Container>
    );
}

import { Text } from "@/components/ui/text";
import { Separator } from "@/components/ui/separator";
import { Container } from "@/components/container";
import { ThemeToggle } from "@/components/theme-toggle";
import { useAuthStore } from "@/store/auth";
import { ROLE_LABELS } from "@easypos/utils";
import { cn } from "@/lib/utils";

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
            className="flex-row items-center px-4 py-3.5 active:bg-secondary"
        >
            <View
                className={cn(
                    "w-9 h-9 rounded-lg items-center justify-center mr-3",
                    destructive ? "bg-destructive/10" : "bg-secondary",
                )}
            >
                <Ionicons
                    name={icon}
                    size={18}
                    color={destructive ? "hsl(0 84.2% 60.2%)" : "hsl(0 0% 45%)"}
                />
            </View>
            <View className="flex-1">
                <Text
                    className={cn(
                        "font-medium text-sm",
                        destructive ? "text-destructive" : "text-foreground",
                    )}
                >
                    {label}
                </Text>
                {subtitle && (
                    <Text className="text-muted-foreground text-xs mt-0.5">{subtitle}</Text>
                )}
            </View>
            {right ?? (
                <Ionicons name="chevron-forward" size={16} color="hsl(0 0% 45%)" />
            )}
        </Pressable>
    );
}

export default function MoreScreen() {
    const user = useAuthStore((s) => s.user);
    const logout = useAuthStore((s) => s.logout);

    function handleLogout() {
        Alert.alert("Sign Out", "Are you sure you want to sign out?", [
            { text: "Cancel", style: "cancel" },
            { text: "Sign Out", style: "destructive", onPress: logout },
        ]);
    }

    return (
        <Container>
            {/* Profile card */}
            <View className="mx-4 mt-4 p-4 rounded-xl bg-card border border-border">
                <View className="flex-row items-center">
                    <View className="w-12 h-12 rounded-full bg-primary items-center justify-center">
                        <Text className="text-primary-foreground text-lg font-bold">
                            {user?.name.charAt(0).toUpperCase()}
                        </Text>
                    </View>
                    <View className="ml-3 flex-1">
                        <Text className="text-foreground font-semibold text-base">{user?.name}</Text>
                        <Text className="text-muted-foreground text-xs">{user?.email}</Text>
                        <Text className="text-muted-foreground text-xs mt-0.5">
                            {ROLE_LABELS[user?.role ?? "CASHIER"]} · {user?.branch?.name ?? "No branch"}
                        </Text>
                    </View>
                </View>
            </View>

            {/* Settings sections */}
            <View className="mt-6">
                <Text className="text-muted-foreground text-xs uppercase tracking-wider px-4 mb-2">
                    Store
                </Text>
                <SettingsItem
                    icon="storefront-outline"
                    label="Branch Info"
                    subtitle={user?.branch?.name}
                />
                <SettingsItem icon="print-outline" label="Printer Setup" subtitle="Bluetooth printers" />
            </View>

            <Separator className="my-2" />

            <View>
                <Text className="text-muted-foreground text-xs uppercase tracking-wider px-4 mb-2">
                    Preferences
                </Text>
                <SettingsItem icon="moon-outline" label="Dark Mode" right={<ThemeToggle />} />
            </View>

            <Separator className="my-2" />

            <View>
                <Text className="text-muted-foreground text-xs uppercase tracking-wider px-4 mb-2">
                    Account
                </Text>
                <SettingsItem
                    icon="log-out-outline"
                    label="Sign Out"
                    destructive
                    onPress={handleLogout}
                />
            </View>

            {/* Version */}
            <View className="items-center mt-8 mb-4">
                <Text className="text-muted-foreground text-xs">EasyPOS v1.0.0</Text>
            </View>
        </Container>
    );
}
