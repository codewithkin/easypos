import { useState } from "react";
import { View, Pressable, FlatList, RefreshControl } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { useAuthStore } from "@/store/auth";
import { useApiQuery, useApiDelete } from "@/hooks/use-api";
import { formatCurrency, formatDate, formatTime, PAYMENT_METHOD_LABELS } from "@easypos/utils";
import { toast } from "@/lib/toast";
import type { Sale } from "@easypos/types";
import { cn } from "@/lib/utils";
import { BRAND } from "@/lib/theme";

interface CustomerDetail {
    id: string;
    name: string;
    phone: string | null;
    email: string | null;
    notes: string | null;
    createdAt: string;
    updatedAt: string;
    sales: (Sale & { cashier: { id: string; name: string } })[];
    _count?: { sales: number };
}

export default function CustomerDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const insets = useSafeAreaInsets();
    const user = useAuthStore((s) => s.user);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);

    const { data: customer, isLoading, refetch, isRefetching } = useApiQuery<CustomerDetail>({
        queryKey: ["customer", id],
        path: `/customers/${id}`,
    });

    const { mutate: deleteCustomer, isPending: deleting } = useApiDelete({
        path: `/customers/${id}`,
        invalidateKeys: [["customers"]],
        onSuccess: () => {
            toast.success("Customer deleted");
            router.back();
        },
        onError: (err) => toast.error(err.message),
    });

    if (isLoading) {
        return (
            <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
                <View className="flex-row items-center px-4 h-14 border-b border-border bg-card">
                    <Pressable onPress={() => router.back()} className="mr-3">
                        <Ionicons name="arrow-back" size={24} color={BRAND.dark} />
                    </Pressable>
                    <Skeleton className="h-6 w-40" />
                </View>
                <View className="px-4 py-6 gap-4">
                    <Skeleton className="h-32 rounded-xl" />
                    <Skeleton className="h-48 rounded-xl" />
                </View>
            </View>
        );
    }

    if (!customer) {
        return (
            <View className="flex-1 bg-background items-center justify-center">
                <Ionicons name="person-outline" size={48} color={BRAND.mid} />
                <Text className="text-muted-foreground mt-3">Customer not found</Text>
                <Button onPress={() => router.back()} className="mt-4">
                    <Text className="text-primary-foreground">Go Back</Text>
                </Button>
            </View>
        );
    }

    const totalSpent = customer.sales
        ?.filter((s) => s.status === "COMPLETED")
        .reduce((sum, s) => sum + s.total, 0) ?? 0;
    const orderCount = customer._count?.sales ?? customer.sales?.length ?? 0;

    function renderSale({ item }: { item: CustomerDetail["sales"][0] }) {
        const isVoided = item.status !== "COMPLETED";
        return (
            <Pressable
                onPress={() => router.push(`/(app)/sale/${item.id}`)}
                className="px-5 py-3.5 active:bg-secondary"
            >
                <View className="flex-row items-center justify-between">
                    <View className="flex-1 mr-3">
                        <Text className="text-foreground font-medium text-sm">
                            #{item.receiptNumber}
                        </Text>
                        <View className="flex-row items-center gap-1.5 mt-0.5">
                            <Text className="text-muted-foreground text-xs">
                                {formatDate(item.createdAt)} · {formatTime(item.createdAt)}
                            </Text>
                            <Text className="text-muted-foreground text-xs">·</Text>
                            <Text className="text-muted-foreground text-xs">
                                {PAYMENT_METHOD_LABELS[item.paymentMethod]}
                            </Text>
                        </View>
                    </View>
                    <Text className={cn(
                        "font-bold text-sm",
                        isVoided ? "text-muted-foreground line-through" : "text-foreground",
                    )}>
                        {formatCurrency(item.total, user?.org.currency)}
                    </Text>
                </View>
            </Pressable>
        );
    }

    return (
        <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
            {/* Header */}
            <View className="flex-row items-center px-4 h-14 border-b border-border bg-card">
                <Pressable onPress={() => router.back()} className="mr-3">
                    <Ionicons name="arrow-back" size={24} color={BRAND.dark} />
                </Pressable>
                <Text className="text-foreground font-bold text-lg flex-1">Customer</Text>
                <Pressable onPress={() => setShowDeleteDialog(true)}>
                    <Ionicons name="trash-outline" size={20} color={BRAND.red} />
                </Pressable>
            </View>

            <FlatList
                data={customer.sales ?? []}
                keyExtractor={(item) => item.id}
                renderItem={renderSale}
                ItemSeparatorComponent={() => <Separator className="ml-5" />}
                refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
                contentContainerStyle={{ paddingBottom: 40 }}
                ListHeaderComponent={() => (
                    <>
                        {/* Customer info card */}
                        <View className="mx-4 mt-4 p-5 rounded-2xl bg-card border border-border">
                            <View className="flex-row items-center mb-4">
                                <View className="w-14 h-14 rounded-full bg-primary/10 items-center justify-center mr-4">
                                    <Text className="text-primary font-bold text-xl">
                                        {customer.name.charAt(0).toUpperCase()}
                                    </Text>
                                </View>
                                <View className="flex-1">
                                    <Text className="text-foreground font-bold text-lg">{customer.name}</Text>
                                    <Text className="text-muted-foreground text-xs">
                                        Customer since {formatDate(customer.createdAt)}
                                    </Text>
                                </View>
                            </View>

                            <Separator className="mb-3" />

                            {/* Contact details */}
                            <View className="gap-2">
                                {customer.phone && (
                                    <View className="flex-row items-center gap-2">
                                        <Ionicons name="call-outline" size={16} color={BRAND.dark} />
                                        <Text className="text-foreground text-sm">{customer.phone}</Text>
                                    </View>
                                )}
                                {customer.email && (
                                    <View className="flex-row items-center gap-2">
                                        <Ionicons name="mail-outline" size={16} color={BRAND.dark} />
                                        <Text className="text-foreground text-sm">{customer.email}</Text>
                                    </View>
                                )}
                                {customer.notes && (
                                    <View className="flex-row items-center gap-2">
                                        <Ionicons name="document-text-outline" size={16} color={BRAND.dark} />
                                        <Text className="text-muted-foreground text-sm">{customer.notes}</Text>
                                    </View>
                                )}
                                {!customer.phone && !customer.email && !customer.notes && (
                                    <Text className="text-muted-foreground text-sm">No contact details</Text>
                                )}
                            </View>
                        </View>

                        {/* Stats */}
                        <View className="flex-row gap-3 mx-4 mt-3 mb-4">
                            <View className="flex-1 p-4 rounded-2xl bg-card border border-border items-center">
                                <Text className="text-foreground font-bold text-xl">
                                    {formatCurrency(totalSpent, user?.org.currency)}
                                </Text>
                                <Text className="text-muted-foreground text-xs mt-0.5">Total Spent</Text>
                            </View>
                            <View className="flex-1 p-4 rounded-2xl bg-card border border-border items-center">
                                <Text className="text-foreground font-bold text-xl">{orderCount}</Text>
                                <Text className="text-muted-foreground text-xs mt-0.5">Orders</Text>
                            </View>
                        </View>

                        {/* Purchase history header */}
                        <Text className="text-muted-foreground text-xs uppercase tracking-wider px-5 mb-2">
                            Purchase History
                        </Text>

                        {customer.sales?.length === 0 && (
                            <View className="items-center py-8">
                                <Ionicons name="receipt-outline" size={36} color={BRAND.mid} />
                                <Text className="text-muted-foreground text-sm mt-2">No purchases yet</Text>
                            </View>
                        )}
                    </>
                )}
            />

            <ConfirmDialog
                open={showDeleteDialog}
                onOpenChange={setShowDeleteDialog}
                title="Delete Customer"
                description={`Remove ${customer.name} from your customer list? This cannot be undone.`}
                confirmText="Delete"
                destructive
                isLoading={deleting}
                onConfirm={() => deleteCustomer(undefined as any)}
            />
        </View>
    );
}
