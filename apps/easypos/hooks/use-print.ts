/**
 * usePrint — shared hook for BLE thermal printing.
 *
 * Handles:
 *  • Requesting Bluetooth permissions
 *  • Scanning & connecting to the printer
 *  • Building ESC/POS bytes from ReceiptData
 *  • Sending raw bytes to the printer
 *  • Toast feedback for every possible outcome
 *
 * Usage:
 *   const { print, isPrinting } = usePrint();
 *   await print(receiptData);          // normal receipt
 *   await print(receiptData, rawBytes); // skip build step (pass prebuilt bytes)
 */

import { useState, useCallback } from "react";
import * as Haptics from "expo-haptics";

import {
    printReceiptBLE,
    buildEscPosReceipt,
    PrinterError,
    type ReceiptData,
} from "@/lib/thermal-printer";
import { toast } from "@/lib/toast";

// ── Types ────────────────────────────────────────────────────────────────────

export interface PrintOptions {
    /** Pre-built ESC/POS bytes. When provided, ReceiptData is ignored for building
     *  but you must still pass at least `null` as the first argument. */
    rawBytes?: Uint8Array;
    /** BLE scan timeout in milliseconds (default: 15 000). */
    timeoutMs?: number;
}

// ── Hook ─────────────────────────────────────────────────────────────────────

export function usePrint(callbacks?: {
    onSuccess?: (printerName: string) => void;
    onError?: (err: unknown) => void;
}) {
    const [isPrinting, setIsPrinting] = useState(false);

    const print = useCallback(
        async (
            data: ReceiptData | null,
            options: PrintOptions = {},
        ): Promise<boolean> => {
            if (isPrinting) return false;
            setIsPrinting(true);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

            try {
                // Build bytes — either use provided raw bytes or build from ReceiptData
                let bytes: Uint8Array;
                if (options.rawBytes) {
                    bytes = options.rawBytes;
                } else if (data) {
                    bytes = buildEscPosReceipt(data);
                } else {
                    throw new PrinterError(
                        "Either ReceiptData or rawBytes must be provided.",
                        "UNKNOWN",
                    );
                }

                const { printerName } = await printReceiptBLE(bytes, options.timeoutMs);

                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                toast.success("Receipt printed", `Sent to ${printerName}`);
                callbacks?.onSuccess?.(printerName);
                return true;
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
                            toast.error(
                                "Printer not found",
                                "Ensure printer is on, paired via Bluetooth, and in range.",
                            );
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

                callbacks?.onError?.(err);
                return false;
            } finally {
                setIsPrinting(false);
            }
        },
        [isPrinting, callbacks],
    );

    return { print, isPrinting };
}
