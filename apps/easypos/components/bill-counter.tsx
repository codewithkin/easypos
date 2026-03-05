import { View, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { Text } from "@/components/ui/text";
import { BRAND } from "@/lib/theme";
import { cn } from "@/lib/utils";
import type { BillDenomination } from "@/store/sale";

const USD_BILLS: BillDenomination[] = [1, 2, 5, 10, 20, 50, 100];

interface BillRowProps {
    denom: BillDenomination;
    count: number;
    onChange: (denom: BillDenomination, count: number) => void;
}

function BillRow({ denom, count, onChange }: BillRowProps) {
    function decrement() {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onChange(denom, count - 1);
    }
    function increment() {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onChange(denom, count + 1);
    }

    const isActive = count > 0;

    return (
        <View className={cn(
            "flex-row items-center px-4 py-3 rounded-xl border",
            isActive ? "bg-primary/5 border-primary/40" : "bg-card border-border",
        )}>
            {/* Label */}
            <Text className={cn("font-bold text-sm w-10", isActive ? "text-primary" : "text-foreground")}>
                ${denom}
            </Text>

            {/* Contribution */}
            <Text className="text-muted-foreground text-xs flex-1 text-center">
                {count > 0 ? `${count} × $${denom} = $${count * denom}` : ""}
            </Text>

            {/* – count + */}
            <View className="flex-row items-center gap-2">
                <Pressable
                    onPress={decrement}
                    disabled={count === 0}
                    className={cn(
                        "w-8 h-8 rounded-lg items-center justify-center",
                        count === 0 ? "bg-muted opacity-40" : "bg-secondary",
                    )}
                >
                    <Ionicons name="remove" size={16} color={BRAND.darkest} />
                </Pressable>

                <Text className={cn(
                    "font-bold text-sm w-6 text-center",
                    isActive ? "text-primary" : "text-foreground",
                )}>
                    {count}
                </Text>

                <Pressable
                    onPress={increment}
                    className="w-8 h-8 rounded-lg items-center justify-center bg-secondary"
                >
                    <Ionicons name="add" size={16} color={BRAND.darkest} />
                </Pressable>
            </View>
        </View>
    );
}

interface BillCounterProps {
    bills: Record<BillDenomination, number>;
    onChange: (denom: BillDenomination, count: number) => void;
}

/**
 * USD bill denomination counter.
 * Shows rows for each denomination ($1–$100).
 * Displays total tendered at the bottom.
 */
export function BillCounter({ bills, onChange }: BillCounterProps) {
    const total = USD_BILLS.reduce((sum, d) => sum + d * bills[d], 0);

    return (
        <View className="gap-2">
            {USD_BILLS.map((denom) => (
                <BillRow
                    key={denom}
                    denom={denom}
                    count={bills[denom]}
                    onChange={onChange}
                />
            ))}
            {total > 0 && (
                <View className="flex-row justify-between items-center px-1 mt-1">
                    <Text className="text-muted-foreground text-xs">Total tendered</Text>
                    <Text className="text-foreground font-bold text-sm">${total.toFixed(2)}</Text>
                </View>
            )}
        </View>
    );
}

/** Compute total cash from bill counts */
export function computeTendered(bills: Record<BillDenomination, number>): number {
    return USD_BILLS.reduce((sum, d) => sum + d * bills[d], 0);
}
