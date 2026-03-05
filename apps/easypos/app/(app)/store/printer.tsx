import { useState } from "react";
import { View, Pressable, ScrollView, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { Text } from "@/components/ui/text";
import { BackButton } from "@/components/back-button";
import { useAuthStore } from "@/store/auth";
import { toast } from "@/lib/toast";
import { BRAND } from "@/lib/theme";
import { cn } from "@/lib/utils";
import { printReceiptBLE, buildEscPosReceipt, PrinterError, type ReceiptData } from "@/lib/thermal-printer";
import { formatDateTime } from "@easypos/utils";

type PrinterStatus = "idle" | "scanning" | "printing" | "success" | "error";

interface LastResult {
    printerName: string;
    timestamp: string;
}

export default function PrinterSetupScreen() {
    const insets = useSafeAreaInsets();
    const user = useAuthStore((s) => s.user);
    const [status, setStatus] = useState<PrinterStatus>("idle");
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [lastResult, setLastResult] = useState<LastResult | null>(null);

    async function handleTestPrint() {
        if (status === "scanning" || status === "printing") return;
        setStatus("scanning");
        setErrorMessage(null);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

        try {
            const now = new Date().toISOString();
            const receiptData: ReceiptData = {
                orgName: user?.org.name ?? "EasyPOS",
                branchName: user?.branch?.name ?? "Main Branch",
                receiptNumber: "TEST-001",
                createdAt: formatDateTime(now),
                cashierName: user?.name ?? "Admin",
                items: [
                    { name: "Test Item A", qty: 2, unitPrice: 5000, total: 10000 },
                    { name: "Test Item B", qty: 1, unitPrice: 8500, total: 8500 },
                ],
                subtotal: 18500,
                discount: 0,
                tax: 0,
                total: 18500,
                paymentMethod: "Cash",
                currency: user?.org.currency,
                verifyUrl: "easypos://verify?id=test",
                note: "*** TEST RECEIPT — NOT A REAL SALE ***",
            };

            const bytes = buildEscPosReceipt(receiptData);
            setStatus("printing");
            const { printerName } = await printReceiptBLE(bytes);

            setStatus("success");
            setLastResult({ printerName, timestamp: formatDateTime(now) });
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            toast.success("Test printed!", `Sent to ${printerName}`);
        } catch (err: any) {
            setStatus("error");

            let message = err?.message ?? "Unknown error";
            if (err instanceof PrinterError) {
                switch (err.code) {
                    case "BLUETOOTH_OFF":
                        message = "Bluetooth is off. Turn it on and try again.";
                        break;
                    case "PERMISSION_DENIED":
                        message = "Bluetooth permission denied. Grant access in Settings.";
                        break;
                    case "NO_PRINTER_FOUND":
                        message = "No printer found. Make sure it's on, paired, and in range.";
                        break;
                    case "CONNECTION_FAILED":
                        message = `Connection failed: ${err.message}`;
                        break;
                    case "NO_PRINT_CHARACTERISTIC":
                        message = "Unsupported printer model.";
                        break;
                    case "WRITE_FAILED":
                        message = "Data could not be sent to the printer.";
                        break;
                }
            }

            setErrorMessage(message);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }
    }

    const isLoading = status === "scanning" || status === "printing";
    const statusLabel = status === "scanning" ? "Searching for printer…" : "Sending to printer…";

    return (
        <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
            {/* Header */}
            <View className="flex-row items-center px-4 h-14 border-b border-border bg-card">
                <BackButton />
                <Text className="text-foreground font-semibold text-lg flex-1">Printer Setup</Text>
            </View>

            <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}>
                {/* How it works */}
                <View className="mx-5 mt-6 p-5 rounded-2xl bg-card border border-border gap-3">
                    <View className="flex-row items-center gap-3">
                        <View className="w-10 h-10 rounded-xl bg-primary/10 items-center justify-center">
                            <Ionicons name="bluetooth-outline" size={20} color={BRAND.brand} />
                        </View>
                        <View className="flex-1">
                            <Text className="text-foreground font-semibold text-sm">Bluetooth Thermal Printing</Text>
                            <Text className="text-muted-foreground text-xs mt-0.5">
                                Connects to a paired 58mm / 80mm ESC/POS printer
                            </Text>
                        </View>
                    </View>

                    <View className="gap-2.5">
                        {[
                            "Pair your thermal printer in your device's Bluetooth settings first",
                            "EasyPOS automatically finds and connects to paired printers",
                            "Works with most 58mm / 80mm ESC/POS Bluetooth printers",
                            "Use the test button below to verify the connection",
                        ].map((step, i) => (
                            <View key={i} className="flex-row items-start gap-2.5">
                                <View className="w-5 h-5 rounded-full bg-primary/10 items-center justify-center mt-0.5 shrink-0">
                                    <Text className="text-primary text-[10px] font-bold">{i + 1}</Text>
                                </View>
                                <Text className="text-foreground text-sm flex-1 leading-5">{step}</Text>
                            </View>
                        ))}
                    </View>
                </View>

                {/* Compatible printers */}
                <View className="mx-5 mt-4 p-5 rounded-2xl bg-card border border-border gap-2">
                    <Text className="text-muted-foreground text-xs uppercase tracking-wider font-medium mb-1">
                        Compatible Brands
                    </Text>
                    {["Cashino / GoojPrt", "Rongta / Xprinter", "EPSON TM series (BLE)", "Most generic BT-58xx / BT-series printers"].map((brand) => (
                        <View key={brand} className="flex-row items-center gap-2">
                            <Ionicons name="checkmark-circle" size={14} color={BRAND.brand} />
                            <Text className="text-foreground text-sm">{brand}</Text>
                        </View>
                    ))}
                </View>

                {/* Test print button */}
                <View className="mx-5 mt-6 gap-3">
                    <Pressable
                        onPress={handleTestPrint}
                        disabled={isLoading}
                        className={cn(
                            "h-14 rounded-2xl flex-row items-center justify-center gap-3",
                            isLoading
                                ? "bg-primary/60"
                                : status === "success"
                                    ? "bg-primary"
                                    : status === "error"
                                        ? "bg-destructive"
                                        : "bg-primary",
                        )}
                    >
                        {isLoading ? (
                            <>
                                <ActivityIndicator color="white" size="small" />
                                <Text className="text-white font-semibold">{statusLabel}</Text>
                            </>
                        ) : status === "success" ? (
                            <>
                                <Ionicons name="checkmark-circle" size={22} color="white" />
                                <Text className="text-white font-semibold">Test Successful! Print Again</Text>
                            </>
                        ) : status === "error" ? (
                            <>
                                <Ionicons name="refresh" size={22} color="white" />
                                <Text className="text-white font-semibold">Retry Test Print</Text>
                            </>
                        ) : (
                            <>
                                <Ionicons name="print-outline" size={22} color="white" />
                                <Text className="text-white font-semibold">Send Test Print</Text>
                            </>
                        )}
                    </Pressable>

                    {/* Error message */}
                    {status === "error" && errorMessage && (
                        <View className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 flex-row items-start gap-2">
                            <Ionicons name="alert-circle-outline" size={18} color={BRAND.red} className="mt-0.5" />
                            <Text className="text-destructive text-sm flex-1 leading-5">{errorMessage}</Text>
                        </View>
                    )}

                    {/* Last print result */}
                    {lastResult && status === "success" && (
                        <View className="p-4 rounded-xl bg-primary/8 border border-primary/20 flex-row items-center gap-3">
                            <Ionicons name="checkmark-circle" size={18} color={BRAND.brand} />
                            <View className="flex-1">
                                <Text className="text-primary font-medium text-sm">{lastResult.printerName}</Text>
                                <Text className="text-muted-foreground text-xs">{lastResult.timestamp}</Text>
                            </View>
                        </View>
                    )}
                </View>

                {/* Troubleshooting */}
                <View className="mx-5 mt-6 gap-3">
                    <Text className="text-muted-foreground text-xs uppercase tracking-wider font-medium">
                        Troubleshooting
                    </Text>
                    {[
                        { q: "Printer not found?", a: "Make sure it's paired in Bluetooth settings, turned on, and not connected to another device." },
                        { q: "Connection keeps failing?", a: "Un-pair and re-pair the printer. Also try turning Bluetooth off and back on." },
                        { q: "Blank or garbled print?", a: "Your printer may use a non-standard protocol. Check that it supports ESC/POS commands." },
                    ].map((item) => (
                        <View key={item.q} className="p-4 rounded-xl bg-card border border-border gap-1">
                            <Text className="text-foreground font-medium text-sm">{item.q}</Text>
                            <Text className="text-muted-foreground text-sm leading-5">{item.a}</Text>
                        </View>
                    ))}
                </View>
            </ScrollView>
        </View>
    );
}
