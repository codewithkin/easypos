import { View, Pressable, useWindowDimensions } from "react-native";
import { Drawer } from "expo-router/drawer";
import {
    DrawerContentScrollView,
    type DrawerContentComponentProps,
} from "@react-navigation/drawer";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useState } from "react";

import { Text } from "@/components/ui/text";
import { Separator } from "@/components/ui/separator";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { useAuthStore } from "@/store/auth";
import { useRole } from "@/hooks/use-role";
import { BRAND } from "@/lib/theme";
import { cn } from "@/lib/utils";

type NavItem = {
    name: string;
    label: string;
    icon: keyof typeof Ionicons.glyphMap;
    activeIcon: keyof typeof Ionicons.glyphMap;
    adminOnly?: boolean;
    managerOnly?: boolean;
};

const NAV_ITEMS: NavItem[] = [
    { name: "index", label: "Dashboard", icon: "grid-outline", activeIcon: "grid" },
    { name: "sales", label: "Sales", icon: "receipt-outline", activeIcon: "receipt" },
    { name: "products", label: "Products", icon: "cube-outline", activeIcon: "cube" },
    { name: "customers", label: "Customers", icon: "people-outline", activeIcon: "people" },
    { name: "store", label: "My Store", icon: "storefront-outline", activeIcon: "storefront" },
    { name: "test", label: "System Test", icon: "flask-outline", activeIcon: "flask", adminOnly: true },
];

function CustomDrawerContent(props: DrawerContentComponentProps) {
    const user = useAuthStore((s) => s.user);
    const logout = useAuthStore((s) => s.logout);
    const { isAdmin, canManage } = useRole();
    const insets = useSafeAreaInsets();
    const [showLogoutDialog, setShowLogoutDialog] = useState(false);

    const currentIndex = props.state.index;
    const currentRouteName = props.state.routes[currentIndex]?.name;

    const visibleItems = NAV_ITEMS.filter((item) => {
        if (item.adminOnly && !isAdmin) return false;
        if (item.managerOnly && !canManage) return false;
        return true;
    });

    return (
        <View className="flex-1 bg-card" style={{ paddingTop: insets.top }}>
            {/* ── Brand Header ── */}
            <View className="px-5 pt-5 pb-4">
                <View className="flex-row items-center gap-3">
                    <View className="w-11 h-11 rounded-xl bg-primary items-center justify-center">
                        <View className="items-center justify-center">
                            <Ionicons name="expand" size={28} color="rgba(255,255,255,0.25)" style={{ position: "absolute" }} />
                            <View className="w-5 h-5 rounded-full border-2 border-white items-center justify-center">
                                <Text className="text-white font-bold text-[10px]">$</Text>
                            </View>
                        </View>
                    </View>
                    <View className="flex-1">
                        <Text className="text-foreground font-bold text-lg tracking-tight leading-tight">
                            <Text className="text-amber-500">Easy</Text>POS
                        </Text>
                        <Text className="text-muted-foreground text-[11px]">Point of Sale</Text>
                    </View>
                </View>
            </View>

            <Separator />

            {/* ── User Info ── */}
            <View className="px-5 py-4">
                <View className="flex-row items-center gap-3">
                    {user?.org.logoUrl ? (
                        <View className="w-10 h-10 rounded-full overflow-hidden bg-secondary">
                            {/* Image would go here */}
                            <View className="w-10 h-10 rounded-full bg-primary/10 items-center justify-center">
                                <Text className="text-primary font-bold text-sm">
                                    {user?.name?.charAt(0).toUpperCase()}
                                </Text>
                            </View>
                        </View>
                    ) : (
                        <View className="w-10 h-10 rounded-full bg-primary/10 items-center justify-center">
                            <Text className="text-primary font-bold text-sm">
                                {user?.name?.charAt(0).toUpperCase()}
                            </Text>
                        </View>
                    )}
                    <View className="flex-1">
                        <Text className="text-foreground font-semibold text-sm" numberOfLines={1}>
                            {user?.name}
                        </Text>
                        <Text className="text-muted-foreground text-xs" numberOfLines={1}>
                            {user?.org.name}
                        </Text>
                    </View>
                </View>
            </View>

            <Separator />

            {/* ── Navigation ── */}
            <DrawerContentScrollView
                {...props}
                contentContainerStyle={{ paddingTop: 8, paddingHorizontal: 12 }}
            >
                {visibleItems.map((item) => {
                    const isActive = currentRouteName === item.name;

                    return (
                        <Pressable
                            key={item.name}
                            onPress={() => props.navigation.navigate(item.name)}
                            className={cn(
                                "flex-row items-center gap-3 px-4 py-3.5 rounded-xl mb-1",
                                isActive ? "bg-primary/10" : "active:bg-secondary",
                            )}
                        >
                            <Ionicons
                                name={isActive ? item.activeIcon : item.icon}
                                size={22}
                                color={isActive ? BRAND.brand : "#5C6277"}
                            />
                            <Text
                                className={cn(
                                    "font-medium text-[15px]",
                                    isActive ? "text-primary" : "text-foreground",
                                )}
                            >
                                {item.label}
                            </Text>
                        </Pressable>
                    );
                })}
            </DrawerContentScrollView>

            {/* ── Logout ── */}
            <Separator />
            <View className="px-3 py-3" style={{ paddingBottom: insets.bottom + 8 }}>
                <Pressable
                    onPress={() => setShowLogoutDialog(true)}
                    className="flex-row items-center gap-3 px-4 py-3 rounded-xl active:bg-destructive/10"
                >
                    <Ionicons name="log-out-outline" size={22} color={BRAND.red} />
                    <Text className="text-destructive font-medium text-sm">Sign Out</Text>
                </Pressable>
            </View>

            <ConfirmDialog
                open={showLogoutDialog}
                onOpenChange={setShowLogoutDialog}
                title="Sign Out"
                description="Are you sure you want to sign out?"
                confirmText="Sign Out"
                destructive
                onConfirm={logout}
            />
        </View>
    );
}

export default function DrawerLayout() {
    const { width } = useWindowDimensions();
    const isTablet = width >= 768;

    return (
        <Drawer
            drawerContent={(props) => <CustomDrawerContent {...props} />}
            screenOptions={{
                headerShown: false,
                drawerType: isTablet ? "permanent" : "slide",
                drawerStyle: {
                    width: isTablet ? 280 : 300,
                    backgroundColor: "hsl(0 0% 100%)",
                    borderRightColor: "hsl(203 24% 88%)",
                },
                overlayColor: "rgba(0, 0, 0, 0.25)",
                swipeEnabled: !isTablet,
            }}
        >
            <Drawer.Screen name="index" options={{ title: "Dashboard" }} />
            <Drawer.Screen name="sales" options={{ title: "Sales" }} />
            <Drawer.Screen name="products" options={{ title: "Products" }} />
            <Drawer.Screen name="customers" options={{ title: "Customers" }} />
            <Drawer.Screen name="store" options={{ title: "My Store" }} />
            <Drawer.Screen name="test" options={{ title: "System Test" }} />
        </Drawer>
    );
}
