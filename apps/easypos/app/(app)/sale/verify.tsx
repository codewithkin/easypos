import { useState, useCallback } from "react";
import { View, Pressable, ActivityIndicator, Linking } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CameraView, useCameraPermissions, type BarcodeScanningResult } from "expo-camera";
import * as Haptics from "expo-haptics";

import { Text } from "@/components/ui/text";
import { Separator } from "@/components/ui/separator";
import { BackButton } from "@/components/back-button";
import { cn } from "@/lib/utils";
import { BRAND } from "@/lib/theme";
import { formatCurrency, formatDateTime, PAYMENT_METHOD_LABELS, SALE_STATUS_LABELS } from "@easypos/utils";

const SERVER_BASE = process.env.EXPO_PUBLIC_SERVER_URL ?? "http://localhost:3000";
const VERIFY_PREFIX = `${SERVER_BASE}/api/sales/verify/`;

interface VerifiedSale {
    receiptNumber: string;
    status: string;
    total: number;
    subtotal: number;
    discount: number;
    tax: number;
    paymentMethod: string;
    createdAt: string;
    branch: { name: string };
    cashier: { name: string };
    customer?: { name: string } | null;
    items: {
        productName: string;
        quantity: number;
        unitPrice: number;
        total: number;
    }[];
}

type VerifyState =
    | { phase: "scanning" }
    | { phase: "loading" }
    | { phase: "success"; sale: VerifiedSale }
    | { phase: "error"; message: string };

export default function SaleVerifyScreen() {
    const insets = useSafeAreaInsets();
    const [permission, requestPermission] = useCameraPermissions();
    const [state, setState] = useState<VerifyState>({ phase: "scanning" });
    const [scannedUrl, setScannedUrl] = useState<string | null>(null);

    const handleBarcode = useCallback(
        async (result: BarcodeScanningResult) => {
            const url = result.data;

            // Only handle our own verify URLs
            if (!url.includes("/api/sales/verify/")) return;
            // Avoid re-scanning while loading/showing result
            if (state.phase !== "scanning") return;

            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            setScannedUrl(url);
            setState({ phase: "loading" });

            try {
                const resp = await fetch(url);
                if (!resp.ok) {
                    const body = await resp.json().catch(() => ({}));
                    throw new Error(body?.error ?? `HTTP ${resp.status}`);
                }
                const sale: VerifiedSale = await resp.json();
                setState({ phase: "success", sale });
            } catch (err: any) {
                setState({
                    phase: "error",
                    message: err?.message ?? "Could not verify sale",
                });
            }
        },
        [state.phase],
    );

    function handleReset() {
        setState({ phase: "scanning" });
        setScannedUrl(null);
    }

    // ── Permission not granted ────────────────────────────────────

    if (!permission) {
        return (
            <View className="flex-1 bg-background items-center justify-center" style={{ paddingTop: insets.top }}>
                <ActivityIndicator color={BRAND.brand} />
            </View>
        );
    }

    if (!permission.granted) {
        return (
            <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
                <View className="flex-row items-center px-4 h-14 border-b border-border bg-card">
                    <BackButton />
                    <Text className="text-foreground font-semibold text-lg flex-1">Verify Sale</Text>
                </View>
                <View className="flex-1 items-center justify-center px-8 gap-5">
                    <View className="w-16 h-16 rounded-full bg-secondary items-center justify-center">
                        <Ionicons name="camera-outline" size={32} color={BRAND.dark} />
                    </View>
                    <View className="items-center gap-2">
                        <Text className="text-foreground font-bold text-lg text-center">
                            Camera access needed
                        </Text>
                        <Text className="text-muted-foreground text-sm text-center leading-5">
                            To scan sale QR codes, please grant camera permission.
                        </Text>
                    </View>
                    <Pressable
                        onPress={permission.canAskAgain ? requestPermission : () => Linking.openSettings()}
                        className="h-12 px-8 rounded-xl bg-primary items-center justify-center"
                    >
                        <Text className="text-primary-foreground font-bold text-sm">
                            {permission.canAskAgain ? "Grant Permission" : "Open Settings"}
                        </Text>
                    </Pressable>
                </View>
            </View>
        );
    }

    return (
        <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
            {/* Header */}
            <View className="flex-row items-center px-4 h-14 border-b border-border bg-card">
                <BackButton />
                <Text className="text-foreground font-semibold text-lg flex-1">Verify Sale</Text>
                {state.phase !== "scanning" && (
                    <Pressable onPress={handleReset} className="px-3 py-1">
                        <Text className="text-primary text-sm font-medium">Scan Again</Text>
                    </Pressable>
                )}
            </View>

            {/* ── Scanning phase ─────────────────────────────────────── */}
            {state.phase === "scanning" && (
                <View className="flex-1">
                    <CameraView
                        style={{ flex: 1 }}
                        facing="back"
                        barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
                        onBarcodeScanned={handleBarcode}
                    />
                    {/* Overlay frame */}
                    <View className="absolute inset-0 items-center justify-center">
                        <View className="w-64 h-64 relative">
                            {/* Corner brackets */}
                            {(["tl", "tr", "bl", "br"] as const).map((corner) => (
                                <View
                                    key={corner}
                                    style={{
                                        position: "absolute",
                                        width: 28,
                                        height: 28,
                                        borderColor: BRAND.brand,
                                        borderTopWidth: corner.startsWith("t") ? 3 : 0,
                                        borderBottomWidth: corner.startsWith("b") ? 3 : 0,
                                        borderLeftWidth: corner.endsWith("l") ? 3 : 0,
                                        borderRightWidth: corner.endsWith("r") ? 3 : 0,
                                        top: corner.startsWith("t") ? 0 : undefined,
                                        bottom: corner.startsWith("b") ? 0 : undefined,
                                        left: corner.endsWith("l") ? 0 : undefined,
                                        right: corner.endsWith("r") ? 0 : undefined,
                                        borderTopLeftRadius: corner === "tl" ? 6 : 0,
                                        borderTopRightRadius: corner === "tr" ? 6 : 0,
                                        borderBottomLeftRadius: corner === "bl" ? 6 : 0,
                                        borderBottomRightRadius: corner === "br" ? 6 : 0,
                                    }}
                                />
                            ))}
                        </View>
                        <Text className="text-white text-sm mt-6 opacity-90 font-medium">
                            Point at a sale receipt QR code
                        </Text>
                    </View>
                </View>
            )}

            {/* ── Loading phase ──────────────────────────────────────── */}
            {state.phase === "loading" && (
                <View className="flex-1 items-center justify-center gap-4">
                    <ActivityIndicator size="large" color={BRAND.brand} />
                    <Text className="text-muted-foreground text-sm">Verifying sale…</Text>
                </View>
            )}

            {/* ── Error phase ────────────────────────────────────────── */}
            {state.phase === "error" && (
                <View className="flex-1 items-center justify-center px-8 gap-5">
                    <View className="w-16 h-16 rounded-full bg-destructive/10 items-center justify-center">
                        <Ionicons name="close-circle" size={40} color={BRAND.red} />
                    </View>
                    <View className="items-center gap-2">
                        <Text className="text-foreground font-bold text-lg text-center">
                            Sale Not Verified
                        </Text>
                        <Text className="text-muted-foreground text-sm text-center leading-5">
                            {state.message}
                        </Text>
                    </View>
                    <Pressable
                        onPress={handleReset}
                        className="h-12 px-8 rounded-xl bg-primary items-center justify-center"
                    >
                        <Text className="text-primary-foreground font-bold text-sm">Try Again</Text>
                    </Pressable>
                </View>
            )}

            {/* ── Success phase ──────────────────────────────────────── */}
            {state.phase === "success" && (
                <View className="flex-1">
                    <View className="flex-1 bg-background">
                        {/* Hero */}
                        <View className={cn(
                            "mx-4 mt-4 rounded-2xl p-5 items-center gap-2",
                            state.sale.status === "VOIDED"
                                ? "bg-destructive/8 border border-destructive/20"
                                : "bg-primary/8 border border-primary/20",
                        )}>
                            <View className={cn(
                                "w-14 h-14 rounded-full items-center justify-center",
                                state.sale.status === "VOIDED" ? "bg-destructive/15" : "bg-primary/15",
                            )}>
                                <Ionicons
                                    name={state.sale.status === "VOIDED" ? "close-circle" : "shield-checkmark"}
                                    size={38}
                                    color={state.sale.status === "VOIDED" ? BRAND.red : BRAND.brand}
                                />
                            </View>
                            <Text className={cn(
                                "font-bold text-xl",
                                state.sale.status === "VOIDED" ? "text-destructive" : "text-primary",
                            )}>
                                {state.sale.status === "VOIDED" ? "Sale Voided" : "Sale Verified ✓"}
                            </Text>
                            <Text className="text-muted-foreground text-xs">
                                Receipt #{state.sale.receiptNumber}
                            </Text>
                            <Text className="text-foreground font-bold text-2xl mt-1">
                                {formatCurrency(state.sale.total)}
                            </Text>
                        </View>

                        {/* Sale details */}
                        <View className="mx-4 mt-4 rounded-xl bg-card border border-border overflow-hidden">
                            <View className="px-4 py-3 gap-1.5">
                                <VerifyRow label="Status" value={SALE_STATUS_LABELS[state.sale.status] ?? state.sale.status} />
                                <VerifyRow label="Branch" value={state.sale.branch.name} />
                                <VerifyRow label="Cashier" value={state.sale.cashier.name} />
                                {state.sale.customer && (
                                    <VerifyRow label="Customer" value={state.sale.customer.name} />
                                )}
                                <VerifyRow label="Date" value={formatDateTime(state.sale.createdAt)} />
                                <VerifyRow label="Payment" value={PAYMENT_METHOD_LABELS[state.sale.paymentMethod] ?? state.sale.paymentMethod} />
                            </View>

                            <Separator />

                            <View className="px-4 py-3 gap-2">
                                <Text className="text-muted-foreground text-xs uppercase tracking-wider mb-1">Items</Text>
                                {state.sale.items.map((item, idx) => (
                                    <View key={idx} className="flex-row justify-between">
                                        <View className="flex-1 mr-2">
                                            <Text className="text-foreground text-sm">{item.productName}</Text>
                                            <Text className="text-muted-foreground text-xs">
                                                {item.quantity} × {formatCurrency(item.unitPrice)}
                                            </Text>
                                        </View>
                                        <Text className="text-foreground text-sm font-medium">
                                            {formatCurrency(item.total)}
                                        </Text>
                                    </View>
                                ))}
                            </View>

                            <Separator />

                            <View className="px-4 py-3 gap-1.5">
                                {state.sale.discount > 0 && (
                                    <VerifyRow
                                        label="Discount"
                                        value={`−${formatCurrency(state.sale.discount)}`}
                                        valueClass="text-green-700"
                                    />
                                )}
                                <View className="flex-row justify-between items-center">
                                    <Text className="text-foreground font-bold text-sm">Total</Text>
                                    <Text className="text-foreground font-bold text-base">
                                        {formatCurrency(state.sale.total)}
                                    </Text>
                                </View>
                            </View>
                        </View>
                    </View>

                    {/* Footer */}
                    <View
                        className="px-4 py-3 bg-card border-t border-border"
                        style={{ paddingBottom: insets.bottom + 12 }}
                    >
                        <Pressable
                            onPress={handleReset}
                            className="h-12 rounded-xl bg-primary items-center justify-center flex-row gap-2"
                        >
                            <Ionicons name="qr-code-outline" size={18} color="white" />
                            <Text className="text-primary-foreground font-bold text-sm">Scan Another</Text>
                        </Pressable>
                    </View>
                </View>
            )}
        </View>
    );
}

// ── Helper ───────────────────────────────────────────────────────────

function VerifyRow({
    label,
    value,
    valueClass,
}: {
    label: string;
    value: string;
    valueClass?: string;
}) {
    return (
        <View className="flex-row justify-between items-center">
            <Text className="text-muted-foreground text-sm">{label}</Text>
            <Text className={cn("text-foreground text-sm", valueClass)}>{value}</Text>
        </View>
    );
}
