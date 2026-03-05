import { View, Pressable, ActivityIndicator } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";

import { Text } from "@/components/ui/text";
import { BackButton } from "@/components/back-button";
import { ProductsStep, ProductsFooterInfo } from "./steps/products-step";
import { CustomerStep } from "./steps/customer-step";
import { PaymentStep, paymentStepValid } from "./steps/payment-step";
import { SummaryStep } from "./steps/summary-step";
import {
    useSaleStore,
    cartTotal,
    totalTendered,
    SALE_STEPS,
} from "@/store/sale";
import { useApiPost } from "@/hooks/use-api";
import { formatCurrency } from "@easypos/utils";
import { cn } from "@/lib/utils";
import { BRAND } from "@/lib/theme";
import { toast } from "@/lib/toast";
import type { Sale, PaymentMethod } from "@easypos/types";

// â”€â”€ Step metadata â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const STEP_META = [
    { title: "New Sale" },
    { title: "Customer" },
    { title: "Payment" },
    { title: "Summary" },
] as const;

// â”€â”€ Helper types â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

interface CreateCustomerBody {
    name: string;
    phone?: string;
    gender?: "MALE" | "FEMALE";
}
interface CreatedCustomer {
    id: string;
    name: string;
    phone: string | null;
}

interface CreateSaleBody {
    items: { productId: string; quantity: number }[];
    paymentMethod: PaymentMethod;
    customerId?: string;
    discount?: number;
    amountTendered?: number;
    note?: string;
}

export default function CreateSaleScreen() {
    const insets = useSafeAreaInsets();
    const {
        step,
        cart,
        customer,
        payment,
        nextStep,
        prevStep,
        clearCart,
        reset,
        setCustomer,
    } = useSaleStore();

    const subtotal = cartTotal(cart);
    const discountAmount = payment.discount;
    const finalTotal = Math.max(0, subtotal - discountAmount);
    const tendered = totalTendered(payment.bills);

    // â”€â”€ Create customer (for new customers without an id) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    const { mutate: createCustomer, isPending: isCreatingCustomer } =
        useApiPost<CreatedCustomer, CreateCustomerBody>({
            path: "/customers",
            invalidateKeys: [["customers"]],
        });

    // â”€â”€ Create sale â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    const { mutate: createSale, isPending: isCreatingSale } =
        useApiPost<Sale, CreateSaleBody>({
            path: "/sales",
            invalidateKeys: [["sales"], ["reports"]],
            onSuccess: (data) => {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                toast.success("Sale completed", `Receipt #${data.receiptNumber ?? ""}`);
                reset();
                router.dismissAll();
                router.push(`/(app)/sale/${data.id}`);
            },
            onError: (err) => {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
                toast.error("Sale failed", err.message);
            },
        });

    const isPending = isCreatingCustomer || isCreatingSale;

    // â”€â”€ Navigation â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    function handleBack() {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        if (step === 0) {
            router.back();
        } else {
            prevStep();
        }
    }

    function handleNext() {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        nextStep();
    }

    // â”€â”€ Complete sale â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    function handleComplete() {
        if (isPending) return;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

        // If customer is new (no id), create them first then complete
        if (customer && !customer.id) {
            createCustomer(
                {
                    name: customer.name,
                    ...(customer.phone ? { phone: customer.phone } : {}),
                    ...(customer.gender ? { gender: customer.gender } : {}),
                },
                {
                    onSuccess: (created) => {
                        setCustomer({ ...customer, id: created.id });
                        doCreateSale(created.id);
                    },
                    onError: (err) => {
                        toast.error("Could not create customer", err.message);
                    },
                },
            );
        } else {
            doCreateSale(customer?.id);
        }
    }

    function doCreateSale(customerId?: string) {
        const body: CreateSaleBody = {
            items: cart.map((i) => ({ productId: i.product.id, quantity: i.quantity })),
            paymentMethod: payment.method,
        };

        if (customerId) body.customerId = customerId;
        if (payment.discount > 0) body.discount = payment.discount;
        if (payment.method === "CASH" && tendered > 0) body.amountTendered = tendered;
        if (payment.note.trim()) body.note = payment.note.trim();

        createSale(body);
    }

    // â”€â”€ Step-specific footer logic â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    const nextDisabled = (() => {
        if (step === 0) return cart.length === 0;
        if (step === 2) {
            return !paymentStepValid(payment.method, tendered, finalTotal, payment.saveBalanceAsCredit);
        }
        return false;
    })();

    // â”€â”€ Render â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    return (
        <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
            {/* â”€â”€ Header â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
            <View className="flex-row items-center px-4 h-14 border-b border-border bg-card">
                <Pressable onPress={handleBack} className="mr-3 w-9 h-9 items-center justify-center">
                    <Ionicons name="arrow-back" size={22} color={BRAND.darkest} />
                </Pressable>

                {/* Title + step dots */}
                <View className="flex-1 flex-row items-center gap-2">
                    <Text className="text-foreground font-bold text-base">
                        {STEP_META[step].title}
                    </Text>
                    <View className="flex-row gap-1 ml-1">
                        {SALE_STEPS.map((_, i) => (
                            <View
                                key={i}
                                className={cn(
                                    "rounded-full",
                                    i === step
                                        ? "w-4 h-2 bg-primary"
                                        : i < step
                                            ? "w-2 h-2 bg-primary/40"
                                            : "w-2 h-2 bg-border",
                                )}
                            />
                        ))}
                    </View>
                </View>

                {/* Clear cart action on step 0 */}
                {step === 0 && cart.length > 0 && (
                    <Pressable
                        onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                            clearCart();
                        }}
                        className="px-3 py-1"
                    >
                        <Text className="text-destructive text-sm font-medium">Clear</Text>
                    </Pressable>
                )}
            </View>

            {/* â”€â”€ Step body â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
            <View className="flex-1">
                {step === 0 && <ProductsStep />}
                {step === 1 && <CustomerStep />}
                {step === 2 && <PaymentStep />}
                {step === 3 && <SummaryStep />}
            </View>

            {/* â”€â”€ Footer â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
            <View
                className="bg-card border-t border-border px-4 pt-3"
                style={{ paddingBottom: insets.bottom + 12 }}
            >
                {/* Step 0: items info + Next */}
                {step === 0 && (
                    <View className="flex-row items-center gap-3">
                        <View className="flex-1">
                            <ProductsFooterInfo />
                        </View>
                        <Pressable
                            onPress={handleNext}
                            disabled={nextDisabled}
                            className={cn(
                                "h-12 px-6 rounded-xl bg-primary items-center justify-center flex-row gap-2",
                                nextDisabled && "opacity-40",
                            )}
                        >
                            <Text className="text-primary-foreground font-bold text-sm">Next</Text>
                            <Ionicons name="chevron-forward" size={16} color="white" />
                        </Pressable>
                    </View>
                )}

                {/* Step 1 (Customer): Skip | Next */}
                {step === 1 && (
                    <View className="flex-row items-center gap-2">
                        <Pressable
                            onPress={() => {
                                setCustomer(null);
                                handleNext();
                            }}
                            className="flex-1 h-12 rounded-xl border border-border items-center justify-center"
                        >
                            <Text className="text-muted-foreground font-medium text-sm">Skip</Text>
                        </Pressable>
                        <Pressable
                            onPress={handleNext}
                            className="flex-1 h-12 rounded-xl bg-primary items-center justify-center flex-row gap-2"
                        >
                            <Text className="text-primary-foreground font-bold text-sm">Next</Text>
                            <Ionicons name="chevron-forward" size={16} color="white" />
                        </Pressable>
                    </View>
                )}

                {/* Step 2 (Payment): total + Review */}
                {step === 2 && (
                    <View className="flex-row items-center gap-3">
                        <View className="flex-1">
                            <Text className="text-muted-foreground text-xs">Total</Text>
                            <Text className="text-foreground font-bold text-base">
                                {formatCurrency(finalTotal)}
                            </Text>
                        </View>
                        <Pressable
                            onPress={handleNext}
                            disabled={nextDisabled}
                            className={cn(
                                "h-12 px-6 rounded-xl bg-primary items-center justify-center flex-row gap-2",
                                nextDisabled && "opacity-40",
                            )}
                        >
                            <Text className="text-primary-foreground font-bold text-sm">Review</Text>
                            <Ionicons name="chevron-forward" size={16} color="white" />
                        </Pressable>
                    </View>
                )}

                {/* Step 3 (Summary): Complete Sale */}
                {step === 3 && (
                    <Pressable
                        onPress={handleComplete}
                        disabled={isPending}
                        className={cn(
                            "h-14 rounded-xl bg-primary items-center justify-center flex-row gap-2",
                            isPending && "opacity-70",
                        )}
                    >
                        {isPending ? (
                            <ActivityIndicator color="white" size="small" />
                        ) : (
                            <>
                                <Ionicons name="checkmark-circle" size={22} color="white" />
                                <Text className="text-primary-foreground font-bold text-base">
                                    Complete Sale
                                </Text>
                            </>
                        )}
                    </Pressable>
                )}
            </View>
        </View>
    );
}
