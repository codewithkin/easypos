/**
 * Test Screen
 *
 * • Checks whether the backend API is reachable (GET /api/health)
 * • Tests the BLE thermal printer via the shared usePrint hook
 */

import { useState, useCallback } from "react";
import { NoPlanGuard } from "@/components/no-plan-guard";
import { View, ScrollView, Pressable, ActivityIndicator } from "react-native";
import { useNavigation, DrawerActions } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useAuthStore } from "@/store/auth";
import { usePrint } from "@/hooks/use-print";
import { BRAND } from "@/lib/theme";
import { cn } from "@/lib/utils";
import type { ReceiptData } from "@/lib/thermal-printer";

const SERVER_URL = process.env.EXPO_PUBLIC_SERVER_URL ?? "http://localhost:3000";

// ── Types ─────────────────────────────────────────────────────────────────────

type CheckStatus = "idle" | "checking" | "ok" | "error";

interface CheckResult {
    status: CheckStatus;
    message?: string;
    latencyMs?: number;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: CheckStatus }) {
    if (status === "idle") return null;

    const config: Record<Exclude<CheckStatus, "idle">, { color: string; icon: keyof typeof Ionicons.glyphMap; label: string }> = {
        checking: { color: BRAND.brand, icon: "sync-outline", label: "Checking…" },
        ok: { color: "#22c55e", icon: "checkmark-circle", label: "Online" },
        error: { color: BRAND.red, icon: "close-circle", label: "Offline" },
    };

    const c = config[status as Exclude<CheckStatus, "idle">];
    return (
        <View className="flex-row items-center gap-1.5">
            <Ionicons name={c.icon} size={16} color={c.color} />
            <Text style={{ color: c.color }} className="text-sm font-semibold">
                {c.label}
            </Text>
        </View>
    );
}

function SectionHeader({ title }: { title: string }) {
    return (
        <View className="px-5 pt-5 pb-2">
            <Text className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
                {title}
            </Text>
        </View>
    );
}

function CheckRow({
    icon,
    label,
    subtitle,
    result,
    onPress,
}: {
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
    subtitle: string;
    result: CheckResult;
    onPress: () => void;
}) {
    return (
        <Pressable
            onPress={onPress}
            className="flex-row items-center px-5 py-4 active:bg-secondary"
        >
            <View className="w-10 h-10 rounded-xl bg-secondary items-center justify-center mr-3">
                <Ionicons name={icon} size={20} color={BRAND.dark} />
            </View>
            <View className="flex-1">
                <Text className="text-foreground font-medium text-sm">{label}</Text>
                <Text className="text-muted-foreground text-xs mt-0.5">{subtitle}</Text>
                {result.status !== "idle" && result.message && (
                    <Text
                        className={cn(
                            "text-xs mt-1",
                            result.status === "ok" ? "text-green-600" : "text-destructive",
                        )}
                        numberOfLines={2}
                    >
                        {result.message}
                    </Text>
                )}
            </View>
            <View className="ml-3 items-end gap-1">
                {result.status === "checking" ? (
                    <ActivityIndicator size="small" color={BRAND.brand} />
                ) : (
                    <StatusBadge status={result.status} />
                )}
                {result.latencyMs !== undefined && result.status === "ok" && (
                    <Text className="text-muted-foreground text-xs">{result.latencyMs}ms</Text>
                )}
            </View>
        </Pressable>
    );
}

// ── Screen ────────────────────────────────────────────────────────────────────

export default function TestScreen() {
    const insets = useSafeAreaInsets();
    const navigation = useNavigation();
    const user = useAuthStore((s) => s.user);

    // ── Health check state ────────────────────────────────────────
    const [healthResult, setHealthResult] = useState<CheckResult>({ status: "idle" });

    const checkHealth = useCallback(async () => {
        setHealthResult({ status: "checking" });
        const t0 = Date.now();
        try {
            const res = await fetch(`${SERVER_URL}/api/health`, { method: "GET" });
            const latencyMs = Date.now() - t0;
            if (res.ok) {
                const body = await res.json() as { status: string; timestamp?: string };
                setHealthResult({
                    status: "ok",
                    message: `Server responded: ${body.status}${body.timestamp ? ` · ${new Date(body.timestamp).toLocaleTimeString()}` : ""}`,
                    latencyMs,
                });
            } else {
                setHealthResult({
                    status: "error",
                    message: `HTTP ${res.status} — ${res.statusText}`,
                    latencyMs,
                });
            }
        } catch (err: any) {
            setHealthResult({
                status: "error",
                message: err?.message ?? "Network error — server unreachable",
            });
        }
    }, []);

    // ── Print test ────────────────────────────────────────────────
    const { print, isPrinting } = usePrint();

    const testReceiptData: ReceiptData = {
        orgName: user?.org?.name ?? "EasyPOS",
        branchName: "Main Branch",
        receiptNumber: "TEST-001",
        createdAt: new Date().toLocaleString(),
        cashierName: user?.name ?? "Test Cashier",
        items: [
            { name: "Test Item A", qty: 2, unitPrice: 5.00, total: 10.00 },
            { name: "Test Item B", qty: 1, unitPrice: 7.50, total: 7.50 },
        ],
        subtotal: 17.50,
        discount: 0,
        tax: 0,
        total: 17.50,
        paymentMethod: "Cash",
        amountTendered: 20.00,
        change: 2.50,
        note: "*** PRINTER TEST — NOT A REAL RECEIPT ***",
        currency: user?.org?.currency ?? "$",
        verifyUrl: "easypos://test",
    };

    async function handlePrintTest() {
        await print(testReceiptData);
    }

    // ── Run all checks ────────────────────────────────────────────
    async function handleRunAll() {
        await checkHealth();
        // Print test is intentionally separate (requires user confirmation via button)
    }

    return (
        <NoPlanGuard>
        <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
            {/* ── Header ─────────────────────────────────────────────── */}
            <View className="flex-row items-center px-4 h-14 border-b border-border bg-card">
                <Pressable
                    onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
                    className="w-9 h-9 items-center justify-center rounded-lg active:bg-secondary mr-2"
                >
                    <Ionicons name="menu" size={22} color={BRAND.dark} />
                </Pressable>
                <Text className="text-foreground font-semibold text-lg flex-1">System Test</Text>
                <Pressable
                    onPress={handleRunAll}
                    className="px-3 py-1.5 rounded-lg bg-secondary active:opacity-70"
                >
                    <Text className="text-foreground text-sm font-medium">Run All</Text>
                </Pressable>
            </View>

            <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}>
                {/* ── API Connectivity ─────────────────────────────────── */}
                <SectionHeader title="API Connectivity" />
                <View className="bg-card rounded-2xl mx-4 overflow-hidden border border-border">
                    <CheckRow
                        icon="cloud-outline"
                        label="Backend Health"
                        subtitle={`GET ${SERVER_URL}/api/health`}
                        result={healthResult}
                        onPress={checkHealth}
                    />
                </View>

                <View className="mx-4 mt-2 px-4 py-3 rounded-xl bg-secondary/60">
                    <Text className="text-muted-foreground text-xs leading-relaxed">
                        Tap a check row to run it individually, or press{" "}
                        <Text className="text-foreground font-medium">Run All</Text> to run every
                        connectivity check at once.
                    </Text>
                </View>

                <Separator className="mx-4 my-5" />

                {/* ── Printer Test ─────────────────────────────────────── */}
                <SectionHeader title="Thermal Printer" />
                <View className="bg-card rounded-2xl mx-4 overflow-hidden border border-border">
                    <View className="px-5 py-4">
                        <View className="flex-row items-start gap-3 mb-4">
                            <View className="w-10 h-10 rounded-xl bg-secondary items-center justify-center mt-0.5">
                                <Ionicons name="print-outline" size={20} color={BRAND.dark} />
                            </View>
                            <View className="flex-1">
                                <Text className="text-foreground font-medium text-sm">
                                    Print Test Receipt
                                </Text>
                                <Text className="text-muted-foreground text-xs mt-0.5 leading-relaxed">
                                    Scans for a paired BLE thermal printer and sends a sample receipt.
                                    Make sure Bluetooth is on and your printer is paired and nearby.
                                </Text>
                            </View>
                        </View>

                        <Button
                            onPress={handlePrintTest}
                            disabled={isPrinting}
                            className="w-full"
                        >
                            {isPrinting ? (
                                <View className="flex-row items-center gap-2">
                                    <ActivityIndicator size="small" color="#fff" />
                                    <Text className="text-primary-foreground font-semibold">
                                        Connecting to printer…
                                    </Text>
                                </View>
                            ) : (
                                <View className="flex-row items-center gap-2">
                                    <Ionicons name="print" size={16} color="#fff" />
                                    <Text className="text-primary-foreground font-semibold">
                                        Print Test Page
                                    </Text>
                                </View>
                            )}
                        </Button>
                    </View>
                </View>

                <View className="mx-4 mt-2 px-4 py-3 rounded-xl bg-amber-50 border border-amber-200">
                    <View className="flex-row items-start gap-2">
                        <Ionicons name="warning-outline" size={14} color="#d97706" style={{ marginTop: 1 }} />
                        <Text className="text-amber-700 text-xs flex-1 leading-relaxed">
                            The test receipt is clearly marked as a test and is not saved to the
                            database. It uses the exact same print path as real sale receipts.
                        </Text>
                    </View>
                </View>

                <Separator className="mx-4 my-5" />

                {/* ── Environment Info ─────────────────────────────────── */}
                <SectionHeader title="Environment" />
                <View className="bg-card rounded-2xl mx-4 overflow-hidden border border-border">
                    {[
                        { label: "Server URL", value: SERVER_URL },
                        { label: "Org", value: user?.org?.name ?? "—" },
                        { label: "User", value: user?.name ?? "—" },
                        { label: "Role", value: user?.role ?? "—" },
                        { label: "Plan", value: user?.org?.plan ?? "—" },
                    ].map((row, i, arr) => (
                        <View key={row.label}>
                            <View className="flex-row items-center px-5 py-3.5">
                                <Text className="text-muted-foreground text-sm flex-1">{row.label}</Text>
                                <Text className="text-foreground text-sm font-mono" numberOfLines={1} style={{ maxWidth: "60%" }}>
                                    {row.value}
                                </Text>
                            </View>
                            {i < arr.length - 1 && <Separator />}
                        </View>
                    ))}
                </View>
            </ScrollView>
        </View>
        </NoPlanGuard>
    );
}
