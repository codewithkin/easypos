import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { useColorScheme } from "nativewind";
import { THEME } from "@/lib/theme";

export default function TabLayout() {
    const { colorScheme } = useColorScheme();
    const theme = colorScheme === "dark" ? THEME.dark : THEME.light;

    return (
        <Tabs
            screenOptions={{
                headerStyle: { backgroundColor: theme.card },
                headerTintColor: theme.foreground,
                headerTitleStyle: { fontWeight: "600" },
                headerShadowVisible: false,
                tabBarStyle: {
                    backgroundColor: theme.card,
                    borderTopColor: theme.border,
                    height: 60,
                    paddingBottom: 8,
                    paddingTop: 4,
                },
                tabBarActiveTintColor: theme.primary,
                tabBarInactiveTintColor: theme.mutedForeground,
                tabBarLabelStyle: { fontSize: 11, fontWeight: "500" },
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: "Sell",
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="cart" size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="sales"
                options={{
                    title: "Today's Sales",
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="receipt" size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="more"
                options={{
                    title: "More",
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="menu" size={size} color={color} />
                    ),
                }}
            />
        </Tabs>
    );
}
