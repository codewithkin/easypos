import { Redirect, Stack } from "expo-router";
import { useAuthStore } from "@/store/auth";

export default function AppLayout() {
    const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

    if (!isAuthenticated) {
        return <Redirect href="/(auth)/login" />;
    }

    return (
        <Stack screenOptions={{ headerShown: false, animation: "slide_from_right" }}>
            <Stack.Screen name="(drawer)" />
            <Stack.Screen name="sale/create" />
            <Stack.Screen name="sale/[id]" />
            <Stack.Screen name="products/add" />
            <Stack.Screen name="products/[id]" />
            <Stack.Screen name="customers/create" />
            <Stack.Screen name="customers/[id]" />
            <Stack.Screen name="team" />
            <Stack.Screen name="team/invite" />
            <Stack.Screen name="billing/plans" />
            <Stack.Screen name="billing/usage" />
        </Stack>
    );
}