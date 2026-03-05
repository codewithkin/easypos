import { View, FlatList, Pressable, RefreshControl, useWindowDimensions, ActivityIndicator } from "react-native";
import { router } from "expo-router";
import { useNavigation, DrawerActions } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useState, useMemo, useCallback, useRef } from "react";
import BottomSheet, { BottomSheetScrollView, BottomSheetBackdrop } from "@gorhom/bottom-sheet";
import * as Haptics from "expo-haptics";

import { Text } from "@/components/ui/text";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { useAuthStore } from "@/store/auth";
import { useRole } from "@/hooks/use-role";
import { useApiPaginatedQuery, useApiPost } from "@/hooks/use-api";
import { formatCurrency, formatTime, formatDate, formatDateTime, PAYMENT_METHOD_LABELS, SALE_STATUS_LABELS } from "@easypos/utils";
import type { Sale, SaleItem } from "@easypos/types";
import { cn } from "@/lib/utils";
import { BRAND } from "@/lib/theme";
import { printReceiptBLE, buildEscPosReceipt, PrinterError, type ReceiptData } from "@/lib/thermal-printer";
import { toast } from "@/lib/toast";

type SaleWithDetails = Sale & {
    items: SaleItem[];
    cashier: { id: string; name: string };
};

const PERIODS = [
    { key: "today", label: "Today" },
    { key: "7d", label: "7 Days" },
    { key: "30d", label: "30 Days" },
    { key: "all", label: "All" },
] as const;

type PeriodKey = (typeof PERIODS)[number]["key"];

export default function SalesScreen() {
    const insets = useSafeAreaInsets();
    const navigation = useNavigation();
    const { width } = useWindowDimensions();
    const isTablet = width >= 768;
    const user = useAuthStore((s) => s.user);
    const { canManage } = useRole();
    const [period, setPeriod] = useState<PeriodKey>("today");

    // Bottom sheet for sale preview
    const bottomSheetRef = useRef<BottomSheet>(null);
    const [selectedSale, setSelectedSale] = useState<SaleWithDetails | null>(null);
    const [isPrinting, setIsPrinting] = useState(false);

    const { mutate: recordPrint } = useApiPost<unknown, { printerName?: string }>({
        path: selectedSale ? `/sales/${selectedSale.id}/print` : "/sales/noop/print",
    });

    const handlePrint = useCallback(async () => {
        if (!selectedSale || isPrinting) return;
        setIsPrinting(true);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        try {
            const verifyUrl = `easypos://verify?id=${selectedSale.id}`;
            const receiptData: ReceiptData = {
                orgName: user?.org.name ?? "EasyPOS",
                branchName: "",
                receiptNumber: selectedSale.receiptNumber,
                createdAt: formatDateTime(selectedSale.createdAt),
                cashierName: selectedSale.cashier.name,
                items: selectedSale.items.map((i) => ({
                    name: i.productName,
                    qty: i.quantity,
                    unitPrice: i.unitPrice,
                    total: i.total,
                })),
                subtotal: selectedSale.subtotal,
                discount: selectedSale.discount,
                tax: selectedSale.tax,
                total: selectedSale.total,
                paymentMethod: PAYMENT_METHOD_LABELS[selectedSale.paymentMethod],
                amountTendered: selectedSale.amountTendered ?? undefined,
                change: selectedSale.change ?? undefined,
                note: selectedSale.note ?? undefined,
                currency: user?.org.currency,
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
                if (err.code === "BLUETOOTH_OFF") toast.error("Bluetooth is off", "Turn on Bluetooth and try again.");
                else if (err.code === "NO_PRINTER_FOUND") toast.error("Printer not found", "Ensure printer is on, paired, and in range.");
                else toast.error("Print error", err.message);
            } else {
                toast.error("Print error", err?.message ?? "Unknown error");
            }
        } finally {
            setIsPrinting(false);
        }
    }, [selectedSale, isPrinting, user]);

    const {
        items: sales,
        total: salesTotal,
        isLoading,
        isError,
        error,
        refetch,
        isRefetching,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        data: rawQueryData,
    } = useApiPaginatedQuery<SaleWithDetails>({
        // Use "sales-list" namespace to avoid key collision with dashboard's useApiQuery(["sales","today"])
        queryKey: ["sales-list", period],
        path: `/sales?period=${period}`,
        pageSize: 10,
    });

    // Verbose logging for debugging
    console.log("[SalesScreen] period:", period);
    console.log("[SalesScreen] isLoading:", isLoading, "isError:", isError);
    console.log("[SalesScreen] rawQueryData pages:", rawQueryData?.pages?.length ?? "no data");
    console.log("[SalesScreen] sales count:", sales?.length ?? "undefined");
    if (isError) console.error("[SalesScreen] query error:", error);

    //  Computed stats 
    const stats = useMemo(() => {
        if (!sales || sales.length === 0) {
            return {
                salesCount: 0,
                totalItems: 0,
                totalRevenue: 0,
                totalCredit: 0,
                avgValue: 0,
                creditCount: 0,
            };
        }

        const completed = sales.filter((s) => s.status === "COMPLETED");
        const revenue = completed.filter((s) => s.paymentMethod !== "CREDIT");
        const credit = completed.filter((s) => s.paymentMethod === "CREDIT");

        const totalRevenue = revenue.reduce((sum, s) => sum + s.total, 0);
        const totalCredit = credit.reduce((sum, s) => sum + s.total, 0);
        const totalItems = completed.reduce(
            (sum, s) => sum + (s.items?.reduce((a, i) => a + i.quantity, 0) ?? 0),
            0,
        );
        const avgValue = completed.length > 0
            ? completed.reduce((sum, s) => sum + s.total, 0) / completed.length
            : 0;

        return {
            salesCount: completed.length,
            totalItems,
            totalRevenue,
            totalCredit,
            avgValue,
            creditCount: credit.length,
        };
    }, [sales]);

    //  Handlers 
    const handleSalePress = useCallback((sale: SaleWithDetails) => {
        setSelectedSale(sale);
        bottomSheetRef.current?.snapToIndex(0);
    }, []);

    const handleViewFull = useCallback(() => {
        if (selectedSale) {
            bottomSheetRef.current?.close();
            router.push(`/(app)/sale/${selectedSale.id}` as any);
        }
    }, [selectedSale]);

    const renderBackdrop = useCallback(
        (props: any) => (
            <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} opacity={0.4} />
        ),
        [],
    );

    //  Sale row 
    function renderSale({ item }: { item: SaleWithDetails }) {
        const isVoided = item.status !== "COMPLETED";
        const isCredit = item.paymentMethod === "CREDIT";
        const itemCount = item.items?.reduce((a, i) => a + i.quantity, 0) ?? 0;

        return (
            <Pressable
                onPress={() => handleSalePress(item)}
                className={cn(
                    "px-5 py-3.5 active:bg-secondary",
                    isCredit && !isVoided && "bg-amber-50",
                )}
            >
                <View className="flex-row items-center justify-between">
                    <View className="flex-1 mr-3">
                        <View className="flex-row items-center gap-2 flex-wrap">
                            <Text className={cn(
                                "text-sm font-semibold",
                                !isVoided && !isCredit ? "text-primary" : "text-foreground",
                            )}>
                                #{item.receiptNumber}
                            </Text>
                            {isCredit && !isVoided && (
                                <View className="px-1.5 py-0.5 rounded bg-amber-500/20 border border-amber-500/30">
                                    <Text className="text-[10px] font-semibold text-amber-700">CREDIT</Text>
                                </View>
                            )}
                            {isVoided && (
                                <Badge variant="outline" className="px-1.5 py-0.5 bg-destructive/10 border-destructive/30">
                                    <Text className="text-[10px] font-medium text-destructive">
                                        {SALE_STATUS_LABELS[item.status]}
                                    </Text>
                                </Badge>
                            )}
                        </View>
                        <View className="flex-row items-center gap-1.5 mt-0.5">
                            <Text className="text-muted-foreground text-xs">{formatTime(item.createdAt)}</Text>
                            <Text className="text-muted-foreground text-xs">{"\u00B7"}</Text>
                            <Text className="text-muted-foreground text-xs">
                                {itemCount} {itemCount === 1 ? "item" : "items"}
                            </Text>
                            <Text className="text-muted-foreground text-xs">{"\u00B7"}</Text>
                            <Text className="text-muted-foreground text-xs">
                                {PAYMENT_METHOD_LABELS[item.paymentMethod]}
                            </Text>
                            {canManage && (
                                <>
                                    <Text className="text-muted-foreground text-xs">{"\u00B7"}</Text>
                                    <Text className="text-muted-foreground text-xs">{item.cashier.name}</Text>
                                </>
                            )}
                        </View>
                    </View>
                    <View className="items-end">
                        <Text className={cn(
                            "font-bold text-base",
                            isVoided
                                ? "text-muted-foreground line-through"
                                : isCredit
                                    ? "text-amber-600"
                                    : "text-foreground",
                        )}>
                            {formatCurrency(item.total, user?.org.currency)}
                        </Text>
                    </View>
                </View>
            </Pressable>
        );
    }

    return (
        <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
            {/*  Header  */}
            <View className="px-5 pt-2 pb-3">
                <View className="flex-row items-center justify-between mb-3">
                    <View className="flex-row items-center gap-3">
                        {!isTablet && (
                            <Pressable
                                onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
                                className="w-10 h-10 rounded-xl bg-secondary items-center justify-center"
                            >
                                <Ionicons name="menu" size={22} color={BRAND.darkest} />
                            </Pressable>
                        )}
                        <View>
                            <Text className="text-2xl font-bold text-foreground">Sales</Text>
                            <Text className="text-muted-foreground text-xs">
                                {salesTotal} {salesTotal === 1 ? "sale" : "sales"}
                            </Text>
                        </View>
                    </View>
                    <View className="flex-row items-center gap-2">
                        <Pressable
                            onPress={() => router.push("/(app)/sale/verify")}
                            className="w-10 h-10 rounded-xl bg-secondary items-center justify-center"
                        >
                            <Ionicons name="qr-code-outline" size={20} color={BRAND.darkest} />
                        </Pressable>
                        <Button
                            onPress={() => router.push("/(app)/sale/create")}
                            className="flex-row items-center gap-2 h-10 px-4"
                        >
                            <Ionicons name="add-circle" size={18} color="hsl(0 0% 98%)" />
                            <Text className="text-primary-foreground font-semibold text-sm">New Sale</Text>
                        </Button>
                    </View>
                </View>

                {/*  Time filter chips  */}
                <View className="flex-row gap-2">
                    {PERIODS.map((p) => (
                        <Pressable
                            key={p.key}
                            onPress={() => setPeriod(p.key)}
                            className={cn(
                                "px-4 py-1.5 rounded-full border",
                                period === p.key
                                    ? "bg-primary border-primary"
                                    : "bg-card border-border",
                            )}
                        >
                            <Text className={cn(
                                "text-sm font-medium",
                                period === p.key ? "text-primary-foreground" : "text-foreground",
                            )}>
                                {p.label}
                            </Text>
                        </Pressable>
                    ))}
                </View>
            </View>

            {/*  Stats Row  */}
            {canManage && (
                <View className="px-5 mb-3">
                    <View className={cn("flex-row gap-2", isTablet ? "gap-3" : "")}>
                        {/* Revenue */}
                        <View className="flex-1 p-3 rounded-xl bg-card border border-border">
                            <Text className="text-muted-foreground text-[10px] uppercase tracking-wider">
                                Revenue
                            </Text>
                            <Text className="text-primary text-lg font-bold mt-0.5" numberOfLines={1}>
                                {isLoading ? "\u2014" : formatCurrency(stats.totalRevenue, user?.org.currency)}
                            </Text>
                            <Text className="text-muted-foreground text-[10px] mt-0.5">
                                {stats.salesCount - stats.creditCount} {stats.salesCount - stats.creditCount === 1 ? "sale" : "sales"}
                            </Text>
                        </View>

                        {/* Credit */}
                        {(isLoading || stats.creditCount > 0) && (
                            <View className="flex-1 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30">
                                <View className="flex-row items-center gap-1">
                                    <Ionicons name="time-outline" size={10} color={BRAND.yellow} />
                                    <Text className="text-amber-700 text-[10px] uppercase tracking-wider font-medium">
                                        Credit
                                    </Text>
                                </View>
                                <Text className="text-amber-700 text-lg font-bold mt-0.5" numberOfLines={1}>
                                    {isLoading ? "\u2014" : formatCurrency(stats.totalCredit, user?.org.currency)}
                                </Text>
                                <Text className="text-amber-700/60 text-[10px] mt-0.5">
                                    {stats.creditCount} {stats.creditCount === 1 ? "sale" : "sales"}
                                </Text>
                            </View>
                        )}
                    </View>

                    {/* Second stats row */}
                    <View className="flex-row gap-2 mt-2">
                        <View className="flex-1 p-3 rounded-xl bg-card border border-border">
                            <Text className="text-muted-foreground text-[10px] uppercase tracking-wider">
                                Items Sold
                            </Text>
                            <Text className="text-foreground text-lg font-bold mt-0.5">
                                {isLoading ? "\u2014" : stats.totalItems}
                            </Text>
                        </View>
                        <View className="flex-1 p-3 rounded-xl bg-card border border-border">
                            <Text className="text-muted-foreground text-[10px] uppercase tracking-wider">
                                Avg Sale
                            </Text>
                            <Text className="text-foreground text-lg font-bold mt-0.5" numberOfLines={1}>
                                {isLoading ? "\u2014" : formatCurrency(stats.avgValue, user?.org.currency)}
                            </Text>
                        </View>
                    </View>
                </View>
            )}

            {/*  Sales List  */}
            {isLoading ? (
                <View className="px-5 gap-3 mt-2">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <Skeleton key={i} className="h-16 rounded-xl" />
                    ))}
                </View>
            ) : !sales || sales.length === 0 ? (
                <View className="flex-1 items-center justify-center">
                    <Ionicons name="receipt-outline" size={48} color={BRAND.mid} />
                    <Text className="text-muted-foreground mt-3 text-base">
                        {period === "today" ? "No sales today" : "No sales found"}
                    </Text>
                    <Button
                        onPress={() => router.push("/(app)/sale/create")}
                        className="mt-4 h-10 px-6"
                    >
                        <Text className="text-primary-foreground font-semibold text-sm">Start Selling</Text>
                    </Button>
                </View>
            ) : (
                <FlatList
                    data={sales}
                    keyExtractor={(item) => item.id}
                    renderItem={renderSale}
                    ItemSeparatorComponent={() => <Separator className="ml-5" />}
                    refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
                    onEndReached={() => { if (hasNextPage && !isFetchingNextPage) fetchNextPage(); }}
                    onEndReachedThreshold={0.5}
                    ListFooterComponent={
                        isFetchingNextPage ? (
                            <View className="py-4 items-center">
                                <Text className="text-muted-foreground text-xs">Loading more...</Text>
                            </View>
                        ) : null
                    }
                    contentContainerStyle={{ paddingBottom: 20 }}
                />
            )}

            {/*  Bottom Sheet: Sale Preview  */}
            <BottomSheet
                ref={bottomSheetRef}
                index={-1}
                snapPoints={["55%", "80%"]}
                enablePanDownToClose
                backdropComponent={renderBackdrop}
                backgroundStyle={{ backgroundColor: "hsl(0 0% 100%)", borderRadius: 24 }}
                handleIndicatorStyle={{ backgroundColor: BRAND.mid, width: 40 }}
                onClose={() => setSelectedSale(null)}
            >
                {selectedSale ? (
                    <BottomSheetScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}>
                        {/* Sheet header */}
                        <View className="flex-row items-center justify-between mb-4">
                            <View>
                                <Text className="text-foreground font-bold text-lg">
                                    #{selectedSale.receiptNumber}
                                </Text>
                                <Text className="text-muted-foreground text-xs">
                                    {formatDateTime(selectedSale.createdAt)}
                                </Text>
                            </View>
                            <View className="flex-row items-center gap-2">
                                {selectedSale.paymentMethod === "CREDIT" && selectedSale.status === "COMPLETED" && (
                                    <View className="px-2 py-1 rounded-lg bg-amber-500/20 border border-amber-500/30">
                                        <Text className="text-xs font-semibold text-amber-700">CREDIT</Text>
                                    </View>
                                )}
                                <View className={cn(
                                    "px-2 py-1 rounded-lg",
                                    selectedSale.status === "COMPLETED"
                                        ? "bg-primary/10"
                                        : "bg-destructive/10",
                                )}>
                                    <Text className={cn(
                                        "text-xs font-semibold",
                                        selectedSale.status === "COMPLETED"
                                            ? "text-primary"
                                            : "text-destructive",
                                    )}>
                                        {SALE_STATUS_LABELS[selectedSale.status]}
                                    </Text>
                                </View>
                            </View>
                        </View>

                        <Separator />

                        {/* Items list */}
                        <View className="py-3 gap-2">
                            <Text className="text-muted-foreground text-xs uppercase tracking-wider mb-1">
                                Items
                            </Text>
                            {selectedSale.items.map((item) => (
                                <View key={item.id} className="flex-row items-start justify-between">
                                    <View className="flex-1 mr-2">
                                        <Text className="text-foreground text-sm">{item.productName}</Text>
                                        <Text className="text-muted-foreground text-xs">
                                            {item.quantity} x {formatCurrency(item.unitPrice, user?.org.currency)}
                                        </Text>
                                    </View>
                                    <Text className="text-foreground font-medium text-sm">
                                        {formatCurrency(item.total, user?.org.currency)}
                                    </Text>
                                </View>
                            ))}
                        </View>

                        <Separator />

                        {/* Totals */}
                        <View className="py-3 gap-1">
                            <View className="flex-row justify-between">
                                <Text className="text-muted-foreground text-sm">Subtotal</Text>
                                <Text className="text-foreground text-sm">
                                    {formatCurrency(selectedSale.subtotal, user?.org.currency)}
                                </Text>
                            </View>
                            {selectedSale.tax > 0 && (
                                <View className="flex-row justify-between">
                                    <Text className="text-muted-foreground text-sm">Tax</Text>
                                    <Text className="text-foreground text-sm">
                                        {formatCurrency(selectedSale.tax, user?.org.currency)}
                                    </Text>
                                </View>
                            )}
                            {selectedSale.discount > 0 && (
                                <View className="flex-row justify-between">
                                    <Text className="text-muted-foreground text-sm">Discount</Text>
                                    <Text className="text-destructive text-sm">
                                        -{formatCurrency(selectedSale.discount, user?.org.currency)}
                                    </Text>
                                </View>
                            )}
                            <View className="flex-row justify-between mt-1">
                                <Text className="text-foreground font-bold text-base">Total</Text>
                                <Text className="text-foreground font-bold text-base">
                                    {formatCurrency(selectedSale.total, user?.org.currency)}
                                </Text>
                            </View>
                        </View>

                        <Separator />

                        {/* Payment + meta */}
                        <View className="py-3 gap-1">
                            <View className="flex-row justify-between">
                                <Text className="text-muted-foreground text-sm">Payment</Text>
                                <Text className="text-foreground text-sm">
                                    {PAYMENT_METHOD_LABELS[selectedSale.paymentMethod]}
                                </Text>
                            </View>
                            {selectedSale.amountTendered != null && (
                                <View className="flex-row justify-between">
                                    <Text className="text-muted-foreground text-sm">Tendered</Text>
                                    <Text className="text-foreground text-sm">
                                        {formatCurrency(selectedSale.amountTendered, user?.org.currency)}
                                    </Text>
                                </View>
                            )}
                            {selectedSale.change != null && selectedSale.change > 0 && (
                                <View className="flex-row justify-between">
                                    <Text className="text-muted-foreground text-sm">Change</Text>
                                    <Text className="text-primary font-medium text-sm">
                                        {formatCurrency(selectedSale.change, user?.org.currency)}
                                    </Text>
                                </View>
                            )}
                            <View className="flex-row justify-between mt-1">
                                <Text className="text-muted-foreground text-sm">Cashier</Text>
                                <Text className="text-foreground text-sm">{selectedSale.cashier.name}</Text>
                            </View>
                            {selectedSale.note && (
                                <View className="mt-2 p-3 rounded-xl bg-secondary">
                                    <Text className="text-muted-foreground text-xs uppercase tracking-wider mb-1">Note</Text>
                                    <Text className="text-foreground text-sm">{selectedSale.note}</Text>
                                </View>
                            )}
                        </View>

                        {/* Action buttons */}
                        <View className="flex-row gap-3 mt-3">
                            <Button
                                onPress={handlePrint}
                                disabled={isPrinting || selectedSale?.status !== "COMPLETED"}
                                className="flex-1 h-12 flex-row items-center gap-2 bg-secondary"
                            >
                                {isPrinting ? (
                                    <ActivityIndicator size="small" color={BRAND.brand} />
                                ) : (
                                    <Ionicons name="print-outline" size={18} color={BRAND.brand} />
                                )}
                                <Text className="text-primary font-semibold text-sm">
                                    {isPrinting ? "Printing…" : "Print"}
                                </Text>
                            </Button>
                            <Button
                                onPress={handleViewFull}
                                className="flex-1 h-12 flex-row items-center gap-2"
                            >
                                <Ionicons name="receipt-outline" size={18} color="hsl(0 0% 98%)" />
                                <Text className="text-primary-foreground font-semibold text-sm">Full Receipt</Text>
                            </Button>
                        </View>
                    </BottomSheetScrollView>
                ) : (
                    <View className="flex-1 items-center justify-center">
                        <ActivityIndicator />
                    </View>
                )}
            </BottomSheet>
        </View>
    );
}