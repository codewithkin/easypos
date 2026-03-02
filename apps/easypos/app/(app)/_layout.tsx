import { Stack } from "expo-router";

export default function AppLayout() {
    return (
        <Stack screenOptions={{ headerShown: false, animation: "slide_from_right" }}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="checkout" options={{ presentation: "modal" }} />
            <Stack.Screen name="sale/[id]" />
            <Stack.Screen name="products" />
            <Stack.Screen name="products/add" />
            <Stack.Screen name="products/[id]" />
            <Stack.Screen name="team" />
            <Stack.Screen name="team/invite" />
            <Stack.Screen name="billing/plans" />
            <Stack.Screen name="billing/usage" />
