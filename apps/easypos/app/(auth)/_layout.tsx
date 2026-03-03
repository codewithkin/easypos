import { Redirect, Stack } from "expo-router";
import { useAuthStore } from "@/store/auth";

export default function AuthLayout() {
    const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

    if (isAuthenticated) {
        return <Redirect href="/(app)" />;
    }

    return (
        <Stack
            screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: "transparent" },
                animation: "slide_from_right",
            }}
        >
            <Stack.Screen name="login" />
            <Stack.Screen name="register" />
            <Stack.Screen name="forgot-password" />
        </Stack>
    );
}
