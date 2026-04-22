import { useEffect } from "react";
import { Redirect, Stack } from "expo-router";
import { AppState } from "react-native";
import { useAuthStore } from "@/store/auth";
import { useSyncStore } from "@/store/sync";
import { api, ApiError } from "@/lib/api";

type BillingLockReason = "trial_expired" | "payment_due";

interface BillingUsageResponse {
    lock?: {
        isLocked: boolean;
        reason: BillingLockReason | null;
    };
}

export default function AppLayout() {
    const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
    const user = useAuthStore((s) => s.user);
    const billingLockReason = useAuthStore((s) => s.billingLockReason);
    const setBillingLockReason = useAuthStore((s) => s.setBillingLockReason);
    const setOfflineMode = useAuthStore((s) => s.setOfflineMode);
    const syncNow = useSyncStore((s) => s.syncNow);
    const refreshPendingCount = useSyncStore((s) => s.refreshPendingCount);

    useEffect(() => {
        if (!isAuthenticated) return;

        let cancelled = false;

        const checkBillingStatus = async () => {
            try {
                const usage = await api.get<BillingUsageResponse>("/billing/usage");
                if (cancelled) return;

                const reason = usage.lock?.isLocked ? usage.lock.reason : null;
                setBillingLockReason(reason);
                setOfflineMode(false);
            } catch (error) {
                if (cancelled) return;

                if (error instanceof ApiError && error.status === 0) {
                    setOfflineMode(true);
                }
            }
        };

        const runSyncCycle = async () => {
            await checkBillingStatus();
            await syncNow();
            await refreshPendingCount();
        };

        void runSyncCycle();
        const interval = setInterval(() => {
            void runSyncCycle();
        }, 3 * 60 * 1000);

        const appStateSub = AppState.addEventListener("change", (state) => {
            if (state === "active") {
                void runSyncCycle();
            }
        });

        return () => {
            cancelled = true;
            clearInterval(interval);
            appStateSub.remove();
        };
    }, [isAuthenticated, setBillingLockReason, setOfflineMode, syncNow, refreshPendingCount]);

    if (!isAuthenticated) {
        return <Redirect href="/(auth)/login" />;
    }

    // Trial is active if:
    // 1. trialEndsAt is set and in the future (normal case), OR
    // 2. trialPlan is set but trialEndsAt is null (server-side bug grace period)
    const isOnTrial =
        user?.org.plan === "none" &&
        (
            (user.org.trialEndsAt && new Date(user.org.trialEndsAt) > new Date()) ||
            (!user.org.trialEndsAt && user.org.trialPlan != null)
        );

    const trialExpired =
        user?.org.plan === "none" && !isOnTrial;

    const paymentDueLocked = billingLockReason === "payment_due";

    // If trial expired and no plan, lock to billing only
    if (trialExpired || paymentDueLocked) {
        return (
            <Stack screenOptions={{ headerShown: false, animation: "slide_from_right" }}>
                <Stack.Screen name="billing/plans" />
                <Stack.Screen name="billing/confirm" />
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
            <Stack.Screen name="billing/confirm" />
            <Stack.Screen name="store/branches" />
            <Stack.Screen name="store/receipt-settings" />
            <Stack.Screen name="store/printer" />
        </Stack>
    );
}