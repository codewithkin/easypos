import { Redirect, Stack } from "expo-router";
import { useAuthStore } from "@/store/auth";

export default function AppLayout() {
    const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
    const user = useAuthStore((s) => s.user);

    if (!isAuthenticated) {
        return <Redirect href="/(auth)/login" />;
    }

    // If user hasn't selected a plan yet, lock them to the plans page
    if (user?.org.plan === "none") {
        return (
            <Stack screenOptions={{ headerShown: false, animation: "slide_from_right" }}>
                <Stack.Screen name="billing/plans" />
            </Stack>
        );
    }

    return (
        <Stack screenOptions={{ headerShown: false, animation: "slide_from_right" }}>
            <Stack.Screen name="(drawer)" />
            <Stack.Screen name="sale/create" />
            <Stack.Screen name="sale/[id]" />
            <Stack.Screen name="sale/verify" />
            <Stack.Screen name="products/add" />
            <Stack.Screen name="products/[id]" />
            <Stack.Screen name="customers/create" />
            <Stack.Screen name="customers/[id]" />
            <Stack.Screen name="team" />
            <Stack.Screen name="team/invite" />
            <Stack.Screen name="billing/plans" />
            <Stack.Screen name="billing/usage" />
            <Stack.Screen name="store/branches" />
            <Stack.Screen name="store/receipt-settings" />
            <Stack.Screen name="store/printer" />
        </Stack>
    );
}