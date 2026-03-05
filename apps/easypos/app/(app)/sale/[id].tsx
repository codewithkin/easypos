import { useState } from "react";
import { View, ScrollView, Pressable, ActivityIndicator } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import QRCode from "react-native-qrcode-svg";

import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { BackButton } from "@/components/back-button";
import { useAuthStore } from "@/store/auth";
import { useApiQuery, useApiPost } from "@/hooks/use-api";
import { toast } from "@/lib/toast";
import {
    formatCurrency,
    formatDateTime,
    PAYMENT_METHOD_LABELS,
    SALE_STATUS_LABELS,
} from "@easypos/utils";
import type { Sale, SaleItem } from "@easypos/types";
import { cn } from "@/lib/utils";
import { BRAND } from "@/lib/theme";
import {
    printReceiptBLE,
    buildEscPosReceipt,
    PrinterError,
    type ReceiptData,
} from "@/lib/thermal-printer";

type SaleDetail = Sale & {
    items: (SaleItem & { product?: { name: string } })[];
    cashier: { id: string; name: string; role: string };
    branch: { id: string; name: string };
    customer?: { id: string; name: string } | null;
};

const SERVER_BASE = process.env.EXPO_PUBLIC_SERVER_URL ?? "http://localhost:3000";

export default function SaleDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const insets = useSafeAreaInsets();
    const user = useAuthStore((s) => s.user);
    const [showVoidDialog, setShowVoidDialog] = useState(false);
    const [isPrinting, setIsPrinting] = useState(false);

    const { data: sale, isLoading } = useApiQuery<SaleDetail>({
        queryKey: ["sale", id],
        path: `/sales/${id}`,
    });

    const { mutate: recordPrint } = useApiPost<unknown, { printerName?: string }>({
        path: `/sales/${id}/print`,
    });

    const { mutate: voidSale, isPending: voiding } = useApiPost<
        Sale,
        { reason: string }
    >({
        path: `/sales/${id}/void`,
        invalidateKeys: [["sales"], ["sale", id], ["reports"]],
        onSuccess: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            toast.success("Sale Voided", "The sale has been marked as voided.");
        },
        onError: (err) => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            toast.error("Void Failed", err.message);
        },
    });

    const canVoid =
        sale?.status === "COMPLETED" && (user?.role === "ADMIN" || user?.role === "MANAGER");

    function handleNewSale() {
        router.dismissAll();
        router.replace("/(app)/sale/create");
    }

    async function handlePrint() {
        if (!sale || isPrinting) return;
        setIsPrinting(true);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

        try {
            const verifyUrl = `${SERVER_BASE}/api/sales/verify/${sale.receiptNumber}`;

            const receiptData: ReceiptData = {
                orgName: user?.org?.name ?? "EasyPOS",
                branchName: sale.branch.name,
                receiptNumber: sale.receiptNumber,
                createdAt: formatDateTime(sale.createdAt),
                cashierName: sale.cashier.name,
                customerName: sale.customer?.name,
                items: sale.items.map((i) => ({
                    name: i.productName,
                    qty: i.quantity,
                    unitPrice: i.unitPrice,
                    total: i.total,
                })),
                subtotal: sale.subtotal,
                discount: sale.discount,
                tax: sale.tax,
                total: sale.total,
                paymentMethod: PAYMENT_METHOD_LABELS[sale.paymentMethod],
                amountTendered: sale.amountTendered ?? undefined,
                change: sale.change ?? undefined,
                note: sale.note ?? undefined,
                currency: user?.org?.currency,
                verifyUrl,
            };

            const bytes = buildEscPosReceipt(receiptData);
            const { printerName } = await printReceiptBLE(bytes);

            recordPrint({ printerName });
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            toast.success("Receipt printed", `Sent to ${printerName}`);
        } catch (err: any) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

            if (err instanceof PrinterError) {
                switch (err.code) {
                    case "BLUETOOTH_OFF":
                        toast.error("Bluetooth is off", "Turn on Bluetooth and try again.");
                        break;
                    case "PERMISSION_DENIED":
                        toast.error("Permission denied", "Grant Bluetooth access in Settings.");
                        break;
                    case "NO_PRINTER_FOUND":
                        toast.error("Printer not found", "Make sure your printer is on and paired.");
                        break;
                    case "CONNECTION_FAILED":
                        toast.error("Connection failed", err.message);
                        break;
                    case "NO_PRINT_CHARACTERISTIC":
                        toast.error("Unsupported printer", err.message);
                        break;
                    case "WRITE_FAILED":
                        toast.error("Print failed", "Data could not be sent to the printer.");
                        break;
                    default:
                        toast.error("Print error", err.message);
                }
            } else {
                toast.error("Print error", err?.message ?? "Unknown error");
            }
        } finally {
            setIsPrinting(false);
        }
    }

    // ── Loading state ─────────────────────────────────────────────

    if (isLoading) {
        return (
            <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
                <View className="px-4 py-6 gap-4">
                    <Skeleton className="h-8 w-48" />
                    <Skeleton className="h-32 rounded-xl" />
                    <Skeleton className="h-48 rounded-xl" />
                </View>
            </View>
        );
    }

    if (!sale) {
        return (
            <View className="flex-1 bg-background items-center justify-center">
                <Ionicons name="alert-circle-outline" size={48} color={BRAND.mid} />
                <Text className="text-muted-foreground mt-3">Sale not found</Text>
                <Button onPress={() => router.back()} className="mt-4">
                    <Text className="text-primary-foreground">Go Back</Text>
                </Button>
            </View>
        );
    }

    const isVoided = sale.status === "VOIDED";
    const isCredit = sale.paymentMethod === "CREDIT";
    const verifyUrl = `${SERVER_BASE}/api/sales/verify/${sale.receiptNumber}`;

    return (
        <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
            {/* ── Header ─────────────────────────────────────────────── */}
            <View className="flex-row items-center px-4 h-14 border-b border-border bg-card">
                <BackButton />
                <Text className="text-foreground font-semibold text-lg flex-1">Receipt</Text>
                {canVoid && !isVoided && (
                    <Pressable onPress={() => setShowVoidDialog(true)} disabled={voiding}>
                        <Text className="text-destructive font-medium text-sm">
                            {voiding ? "Voiding…" : "Void"}
                        </Text>
                    </Pressable>
                )}
            </View>

            <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 40 }}>
                {/* ── Success / Void hero ─────────────────────────────── */}
                <View className={cn(
                    "mx-4 mt-4 rounded-2xl p-6 items-center gap-3",
                    isVoided ? "bg-destructive/8 border border-destructive/20" : "bg-primary/8 border border-primary/20",
                )}>
                    <View className={cn(
                        "w-16 h-16 rounded-full items-center justify-center",
                        isVoided ? "bg-destructive/15" : "bg-primary/15",
                    )}>
                        <Ionicons
                            name={isVoided ? "close-circle" : "checkmark-circle"}
                            size={44}
                            color={isVoided ? BRAND.red : BRAND.brand}
                        />
                    </View>
                    <View className="items-center gap-1">
                        <Text className={cn(
                            "font-bold text-xl",
                            isVoided ? "text-destructive" : "text-primary",
                        )}>
                            {isVoided ? "Sale Voided" : "Sale Complete!"}
                        </Text>
                        <Text className="text-muted-foreground text-sm">
                            Receipt #{sale.receiptNumber}
                        </Text>
                        <Text className={cn(
                            "text-2xl font-bold mt-1",
                            isVoided ? "text-destructive" : "text-foreground",
                        )}>
                            {formatCurrency(sale.total, user?.org?.currency)}
                        </Text>
                    </View>

                    {/* Credit badge */}
                    {isCredit && !isVoided && (
                        <View className="flex-row items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-100 border border-amber-300">
                            <Ionicons name="time-outline" size={14} color="#B45309" />
                            <Text className="text-amber-800 text-xs font-semibold">
                                Credit Sale — Payment Pending
                            </Text>
                        </View>
                    )}
                </View>

                {/* ── Receipt card ────────────────────────────────────── */}
                <View className="mx-4 mt-4 rounded-xl bg-card border border-border overflow-hidden">
                    {/* Org + branch */}
                    <View className="items-center py-4 px-4">
                        <Text className="text-foreground font-bold text-base">
                            {user?.org?.name ?? "EasyPOS"}
                        </Text>
                        <Text className="text-muted-foreground text-xs">{sale.branch.name}</Text>
                        <Text className="text-muted-foreground text-xs mt-0.5">
                            {formatDateTime(sale.createdAt)}
                        </Text>
                    </View>

                    <Separator />

                    {/* Meta rows */}
                    <View className="px-4 py-3 gap-1.5">
                        <MetaRow label="Status" value={SALE_STATUS_LABELS[sale.status]}
                            valueClass={isVoided ? "text-destructive font-semibold" : "text-primary font-semibold"} />
                        <MetaRow label="Cashier" value={sale.cashier.name} />
                        {sale.customer && <MetaRow label="Customer" value={sale.customer.name} />}
                    </View>

                    <Separator />

                    {/* Items */}
                    <View className="px-4 py-3 gap-2.5">
                        {sale.items.map((item) => (
                            <View key={item.id} className="flex-row items-start justify-between">
                                <View className="flex-1 mr-2">
                                    <Text className="text-foreground text-sm">{item.productName}</Text>
                                    <Text className="text-muted-foreground text-xs">
                                        {item.quantity} × {formatCurrency(item.unitPrice, user?.org?.currency)}
                                    </Text>
                                </View>
                                <Text className="text-foreground font-medium text-sm">
                                    {formatCurrency(item.total, user?.org?.currency)}
                                </Text>
                            </View>
                        ))}
                    </View>

                    <Separator />

                    {/* Totals */}
                    <View className="px-4 py-3 gap-1.5">
                        <MetaRow label="Subtotal" value={formatCurrency(sale.subtotal, user?.org?.currency)} />
                        {sale.tax > 0 && <MetaRow label="Tax" value={formatCurrency(sale.tax, user?.org?.currency)} />}
                        {sale.discount > 0 && (
                            <MetaRow label="Discount" value={`−${formatCurrency(sale.discount, user?.org?.currency)}`}
                                valueClass="text-green-700" />
                        )}
                        <View className="flex-row justify-between items-center pt-1">
                            <Text className="text-foreground font-bold text-base">Total</Text>
                            <Text className="text-foreground font-bold text-base">
                                {formatCurrency(sale.total, user?.org?.currency)}
                            </Text>
                        </View>
                    </View>

                    <Separator />

                    {/* Payment */}
                    <View className="px-4 py-3 gap-1.5">
                        <MetaRow label="Payment" value={PAYMENT_METHOD_LABELS[sale.paymentMethod]} />
                        {sale.amountTendered != null && (
                            <>
                                <MetaRow label="Tendered" value={formatCurrency(sale.amountTendered, user?.org?.currency)} />
                                <MetaRow label="Change" value={formatCurrency(sale.change ?? 0, user?.org?.currency)}
                                    valueClass="text-primary font-semibold" />
                            </>
                        )}
                    </View>

                    {/* Note */}
                    {sale.note && (
                        <>
                            <Separator />
                            <View className="px-4 py-3">
                                <Text className="text-muted-foreground text-xs uppercase tracking-wider mb-1">Note</Text>
                                <Text className="text-foreground text-sm">{sale.note}</Text>
                            </View>
                        </>
                    )}

                    {/* QR code */}
                    {!isVoided && (
                        <>
                            <Separator />
                            <View className="items-center py-5 gap-2">
                                <View className="p-3 bg-white rounded-xl border border-border">
                                    <QRCode
                                        value={verifyUrl}
                                        size={140}
                                        color="#000"
                                        backgroundColor="#fff"
                                    />
                                </View>
                                <Text className="text-muted-foreground text-xs">
                                    Scan to verify this sale
                                </Text>
                            </View>
                        </>
                    )}
                </View>
            </ScrollView>

            {/* ── Bottom actions ──────────────────────────────────────── */}
            <View
                className="flex-row px-4 py-3 gap-3 bg-card border-t border-border"
                style={{ paddingBottom: insets.bottom + 12 }}
            >
                {!isVoided && (
                    <Pressable
                        onPress={handlePrint}
                        disabled={isPrinting}
                        className={cn(
                            "flex-1 h-12 rounded-xl border border-border items-center justify-center flex-row gap-2",
                            isPrinting && "opacity-60",
                        )}
                    >
                        {isPrinting ? (
                            <>
                                <ActivityIndicator size="small" color={BRAND.dark} />
                                <Text className="text-muted-foreground text-sm font-medium">Printing…</Text>
                            </>
                        ) : (
                            <>
                                <Ionicons name="print-outline" size={18} color={BRAND.dark} />
                                <Text className="text-foreground font-medium text-sm">Print</Text>
                            </>
                        )}
                    </Pressable>
                )}
                <Pressable
                    onPress={handleNewSale}
                    className={cn(
                        "h-12 rounded-xl bg-primary items-center justify-center flex-row gap-2",
                        isVoided ? "flex-1" : "flex-1",
                    )}
                >
                    <Ionicons name="add-circle" size={18} color="white" />
                    <Text className="text-primary-foreground font-bold text-sm">New Sale</Text>
                </Pressable>
            </View>

            <ConfirmDialog
                open={showVoidDialog}
                onOpenChange={setShowVoidDialog}
                title="Void Sale"
                description="This action cannot be undone. The sale will be marked as voided."
                confirmText="Void Sale"
                destructive
                isLoading={voiding}
                onConfirm={() => voidSale({ reason: "Voided by " + user?.name })}
            />
        </View>
    );
}

// ── Helpers ──────────────────────────────────────────────────────────

function MetaRow({
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

