/**
 * Bluetooth Thermal Printer — ESC/POS over BLE
 *
 * Uses react-native-ble-plx to find a paired 58mm/80mm thermal printer and
 * write ESC/POS bytes to its characteristic.
 *
 * Most cheap BT thermal printers expose a Serial Port Profile or a generic
 * GATT service with a writable characteristic (SPP-over-BLE).
 * Common service/characteristic UUIDs for "cashino", "goojprt", "xprinter" etc:
 *   Service:        49535343-FE7D-4AE5-8FA9-9FAFD205E455
 *   Characteristic: 49535343-8841-43F4-A8D4-ECBE34729BB3
 * We try known UUIDs first, then fall back to scanning all characteristics
 * for one that is writable.
 */

import { BleManager, type Device, type Characteristic } from "react-native-ble-plx";
import { Platform, PermissionsAndroid } from "react-native";
import { Buffer } from "buffer";

// ── ESC/POS constants ────────────────────────────────────────────────

const ESC = 0x1b;
const GS = 0x1d;

// Known printer GATT service/characteristic UUID pairs
const KNOWN_PRINT_SERVICES = [
    // Generic BLE SPP (most common cheap printers)
    {
        service: "49535343-FE7D-4AE5-8FA9-9FAFD205E455",
        characteristic: "49535343-8841-43F4-A8D4-ECBE34729BB3",
    },
    // Cashino / GoojPrt
    {
        service: "000018F0-0000-1000-8000-00805F9B34FB",
        characteristic: "00002AF1-0000-1000-8000-00805F9B34FB",
    },
    // XPrinter / Rongta
    {
        service: "E7810A71-73AE-499D-8C15-FAA9AEF0C3F2",
        characteristic: "BEF8D6C9-9C21-4C9E-B632-BD58C1009F9F",
    },
];

// ── Singleton BleManager ─────────────────────────────────────────────

let _manager: BleManager | null = null;
function getManager(): BleManager {
    if (!_manager) {
        _manager = new BleManager();
    }
    return _manager;
}

// ── Error types ──────────────────────────────────────────────────────

export class PrinterError extends Error {
    constructor(
        message: string,
        public code:
            | "BLUETOOTH_OFF"
            | "NO_PRINTER_FOUND"
            | "CONNECTION_FAILED"
            | "NO_PRINT_CHARACTERISTIC"
            | "WRITE_FAILED"
            | "PERMISSION_DENIED"
            | "UNKNOWN",
    ) {
        super(message);
        this.name = "PrinterError";
    }
}

// ── Helpers ─────────────────────────────────────────────────────────

function strToBytes(str: string): Uint8Array {
    // Encode as latin-1 (ESC/POS standard charset)
    const bytes = new Uint8Array(str.length);
    for (let i = 0; i < str.length; i++) {
        bytes[i] = str.charCodeAt(i) & 0xff;
    }
    return bytes;
}

function concat(...arrays: Uint8Array[]): Uint8Array {
    const total = arrays.reduce((n, a) => n + a.length, 0);
    const out = new Uint8Array(total);
    let offset = 0;
    for (const a of arrays) {
        out.set(a, offset);
        offset += a.length;
    }
    return out;
}

function bytesToBase64(bytes: Uint8Array): string {
    return Buffer.from(bytes).toString("base64");
}

// ── ESC/POS receipt builder ──────────────────────────────────────────

export interface ReceiptData {
    orgName: string;
    branchName: string;
    receiptNumber: string;
    createdAt: string;       // formatted date/time string
    cashierName: string;
    customerName?: string;
    items: { name: string; qty: number; unitPrice: number; total: number }[];
    subtotal: number;
    discount: number;
    tax: number;
    total: number;
    paymentMethod: string;
    amountTendered?: number;
    change?: number;
    note?: string;
    currency?: string;
    verifyUrl: string;       // URL to print as QR
}

function center(text: string, width = 32): string {
    const pad = Math.max(0, Math.floor((width - text.length) / 2));
    return " ".repeat(pad) + text;
}

function leftRight(left: string, right: string, width = 32): string {
    const gap = Math.max(1, width - left.length - right.length);
    return left + " ".repeat(gap) + right;
}

function fmt(amount: number, currency = "$"): string {
    return `${currency}${amount.toFixed(2)}`;
}

export function buildEscPosReceipt(data: ReceiptData): Uint8Array {
    const curr = data.currency ?? "$";
    const lines: Uint8Array[] = [];

    function push(bytes: Uint8Array) {
        lines.push(bytes);
    }
    function text(s: string) {
        push(strToBytes(s + "\n"));
    }
    function rule(char = "-", width = 32) {
        text(char.repeat(width));
    }
    function nl(n = 1) {
        text("\n".repeat(n - 1));
    }

    // ── Initialize + center align ─────────────────────────────────
    push(new Uint8Array([ESC, 0x40]));                    // ESC @ — initialize
    push(new Uint8Array([ESC, 0x61, 0x01]));              // ESC a 1 — center

    // ───────────────────────────────────────────────────────────────
    // ── STORE HEADER ──────────────────────────────────────────────
    // ───────────────────────────────────────────────────────────────
    push(new Uint8Array([ESC, 0x21, 0x18]));              // triple height + bold
    text(data.orgName.toUpperCase().slice(0, 32));
    push(new Uint8Array([ESC, 0x21, 0x00]));              // normal

    nl();
    
    push(new Uint8Array([ESC, 0x21, 0x08]));              // bold
    text(data.branchName.slice(0, 32));
    push(new Uint8Array([ESC, 0x21, 0x00]));              // normal

    nl();
    text(data.createdAt);
    text("─".repeat(32));

    // ───────────────────────────────────────────────────────────────
    // ── RECEIPT METADATA ──────────────────────────────────────────
    // ───────────────────────────────────────────────────────────────
    push(new Uint8Array([ESC, 0x61, 0x00]));              // left align

    push(new Uint8Array([ESC, 0x21, 0x08]));              // bold
    text(`Receipt #${data.receiptNumber}`);
    push(new Uint8Array([ESC, 0x21, 0x00]));              // normal

    nl();
    text(leftRight("Cashier:", data.cashierName.slice(0, 20)));
    
    if (data.customerName) {
        text(leftRight("Customer:", data.customerName.slice(0, 20)));
    }
    
    text("─".repeat(32));

    // ───────────────────────────────────────────────────────────────
    // ── ITEMS WITH FORMATTED GRID ────────────────────────────────
    // ───────────────────────────────────────────────────────────────
    nl();
    push(new Uint8Array([ESC, 0x21, 0x08]));              // bold header
    text(leftRight("Item", "Price"));
    push(new Uint8Array([ESC, 0x21, 0x00]));              // normal
    text(leftRight("Qty x Unit", "Total"));
    text("─".repeat(32));

    for (const item of data.items) {
        const itemName = item.name.slice(0, 20);
        text(leftRight(itemName, fmt(item.total, curr)));
        text(leftRight(`  ${item.qty}x ${fmt(item.unitPrice, curr)}`, ""));
    }

    text("═".repeat(32));

    // ───────────────────────────────────────────────────────────────
    // ── TOTALS SECTION ────────────────────────────────────────────
    // ───────────────────────────────────────────────────────────────
    nl();
    text(leftRight("Subtotal:", fmt(data.subtotal, curr)));
    
    if (data.discount > 0) {
        push(new Uint8Array([ESC, 0x21, 0x04]));          // bold discount
        text(leftRight("Discount:", `-${fmt(data.discount, curr)}`));
        push(new Uint8Array([ESC, 0x21, 0x00]));          // normal
    }
    
    if (data.tax > 0) {
        text(leftRight("Tax:", fmt(data.tax, curr)));
    }

    nl();
    push(new Uint8Array([ESC, 0x21, 0x18]));              // triple height + bold
    text(leftRight("TOTAL", fmt(data.total, curr)));
    push(new Uint8Array([ESC, 0x21, 0x00]));              // normal

    // ───────────────────────────────────────────────────────────────
    // ── PAYMENT METHOD ────────────────────────────────────────────
    // ───────────────────────────────────────────────────────────────
    text("─".repeat(32));
    text(leftRight("Payment:", data.paymentMethod));
    
    if (data.amountTendered !== undefined) {
        text(leftRight("Tendered:", fmt(data.amountTendered, curr)));
        push(new Uint8Array([ESC, 0x21, 0x08]));          // bold change
        text(leftRight("Change:", fmt(data.change ?? 0, curr)));
        push(new Uint8Array([ESC, 0x21, 0x00]));          // normal
    }

    // ───────────────────────────────────────────────────────────────
    // ── SALE NOTE (if any) ────────────────────────────────────────
    // ───────────────────────────────────────────────────────────────
    if (data.note?.trim()) {
        text("─".repeat(32));
        const noteLines = data.note.trim().match(/.{1,28}/g) || [];
        push(new Uint8Array([ESC, 0x21, 0x04]));          // bold note label
        text("Note:");
        push(new Uint8Array([ESC, 0x21, 0x00]));          // normal
        for (const line of noteLines.slice(0, 3)) {
            text(line);
        }
    }

    // ───────────────────────────────────────────────────────────────
    // ── QR CODE & VERIFICATION ───────────────────────────────────
    // ───────────────────────────────────────────────────────────────
    text("═".repeat(32));
    nl();
    push(new Uint8Array([ESC, 0x61, 0x01]));              // center
    
    push(new Uint8Array([ESC, 0x21, 0x08]));              // bold
    text("SCAN TO VERIFY");
    push(new Uint8Array([ESC, 0x21, 0x00]));              // normal
    nl();

    // GS ( k — store data in QR symbol buffer
    const qrData = strToBytes(data.verifyUrl);
    const pL = (qrData.length + 3) & 0xff;
    const pH = ((qrData.length + 3) >> 8) & 0xff;
    push(new Uint8Array([GS, 0x28, 0x6b, 0x04, 0x00, 0x31, 0x41, 0x32, 0x00])); // model 2
    push(new Uint8Array([GS, 0x28, 0x6b, 0x03, 0x00, 0x31, 0x43, 0x07]));        // size 7
    push(new Uint8Array([GS, 0x28, 0x6b, 0x03, 0x00, 0x31, 0x45, 0x30]));        // error M
    push(new Uint8Array([GS, 0x28, 0x6b, pL, pH, 0x31, 0x50, 0x30]));            // store data
    push(qrData);
    push(new Uint8Array([GS, 0x28, 0x6b, 0x03, 0x00, 0x31, 0x51, 0x30]));        // print

    // ───────────────────────────────────────────────────────────────
    // ── FOOTER MESSAGE ────────────────────────────────────────────
    // ───────────────────────────────────────────────────────────────
    nl(2);
    text("═".repeat(32));
    push(new Uint8Array([ESC, 0x61, 0x01]));              // center
    
    push(new Uint8Array([ESC, 0x21, 0x10]));              // double height
    text("THANK YOU!");
    push(new Uint8Array([ESC, 0x21, 0x00]));              // normal
    
    text(`For shopping at`);
    push(new Uint8Array([ESC, 0x21, 0x08]));              // bold
    text(data.orgName);
    push(new Uint8Array([ESC, 0x21, 0x00]));              // normal
    
    nl();
    text("Visit us soon!");
    text("═".repeat(32));

    push(new Uint8Array([ESC, 0x61, 0x00]));              // left align

    // ── Feed + cut ───────────────────────────────────────────────────
    nl(2);
    push(new Uint8Array([ESC, 0x64, 0x05]));              // feed 5 lines
    push(new Uint8Array([GS, 0x56, 0x41, 0x00]));         // partial cut

    return concat(...lines);
}

// ── BLE writing ─────────────────────────────────────────────────────

const CHUNK_SIZE = 200; // BLE MTU safe chunk

async function writeInChunks(
    char: Characteristic,
    data: Uint8Array,
): Promise<void> {
    for (let offset = 0; offset < data.length; offset += CHUNK_SIZE) {
        const chunk = data.slice(offset, offset + CHUNK_SIZE);
        const b64 = bytesToBase64(chunk);
        await char.writeWithoutResponse(b64);
        // small delay to avoid buffer overflow on cheap printers
        await new Promise((r) => setTimeout(r, 20));
    }
}

async function findPrintCharacteristic(
    device: Device,
): Promise<Characteristic | null> {
    const services = await device.services();

    // Try known UUIDs first
    for (const pair of KNOWN_PRINT_SERVICES) {
        const svc = services.find(
            (s) => s.uuid.toLowerCase() === pair.service.toLowerCase(),
        );
        if (svc) {
            const chars = await svc.characteristics();
            const c = chars.find(
                (ch) => ch.uuid.toLowerCase() === pair.characteristic.toLowerCase() && ch.isWritableWithoutResponse,
            );
            if (c) return c;
        }
    }

    // Fallback: scan all services for the first writable-without-response characteristic
    for (const svc of services) {
        const chars = await svc.characteristics();
        const c = chars.find((ch) => ch.isWritableWithoutResponse);
        if (c) return c;
    }

    return null;
}

/** Request Bluetooth permissions on Android */
async function requestBlePermissions(): Promise<boolean> {
    if (Platform.OS !== "android") {
        return true; // iOS handles permissions via Info.plist + the expo-camera/ble-plx plugins
    }

    try {
        if (Number(Platform.Version) >= 31) {
            // Android 12+ (API 31+): needs BLUETOOTH_SCAN + BLUETOOTH_CONNECT
            const result = await PermissionsAndroid.requestMultiple([
                PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
                PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
            ]);
            return (
                result[PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN] ===
                    PermissionsAndroid.RESULTS.GRANTED &&
                result[PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT] ===
                    PermissionsAndroid.RESULTS.GRANTED
            );
        } else {
            // Android < 12 (API < 31): BLE scanning requires ACCESS_FINE_LOCATION
            const result = await PermissionsAndroid.request(
                PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
                {
                    title: "Location Permission Required",
                    message:
                        "Bluetooth printing requires location access on this Android version to scan for nearby printers.",
                    buttonPositive: "Allow",
                    buttonNegative: "Deny",
                },
            );
            return result === PermissionsAndroid.RESULTS.GRANTED;
        }
    } catch (err) {
        console.error("Error requesting BLE permissions:", err);
        return false;
    }
}

/** Scan for a nearby thermal printer, connect, print receipt, disconnect. */
export async function printReceiptBLE(
    receipt: Uint8Array,
    timeoutMs = 15_000,
): Promise<{ printerName: string }> {
    const manager = getManager();

    // Request Bluetooth permissions on Android 12+
    if (Platform.OS === "android") {
        const hasPermissions = await requestBlePermissions();
        if (!hasPermissions) {
            throw new PrinterError(
                "Bluetooth permissions were denied. Please grant BLUETOOTH_SCAN and BLUETOOTH_CONNECT permissions in Settings.",
                "PERMISSION_DENIED",
            );
        }
    }

    // Check Bluetooth state
    const state = await manager.state();
    if (state === "PoweredOff") {
        throw new PrinterError(
            "Bluetooth is turned off. Please enable Bluetooth and try again.",
            "BLUETOOTH_OFF",
        );
    }
    if (state === "Unauthorized") {
        throw new PrinterError(
            "Bluetooth permission was denied. Please grant Bluetooth access in Settings.",
            "PERMISSION_DENIED",
        );
    }

    // First, try to connect to known paired devices
    // (paired devices don't need to be actively advertising)
    let device: Device | null = null;

    try {
        const paired = await manager.connectedDevices([]);
        if (paired.length > 0) {
            console.log(`[BLE] Found ${paired.length} connected devices, trying them...`);
            for (const p of paired) {
                const name = (p.name ?? p.localName ?? "").toLowerCase();
                if (name.length > 0) {
                    // Any paired device with a non-empty name is worth trying
                    // (could be a printer; we'll validate the characteristic later)
                    console.log(`[BLE] Trying paired device: ${p.name ?? p.localName}`);
                    device = p;
                    break;
                }
            }
        }
    } catch (err) {
        console.warn("[BLE] Could not get connected devices:", err);
    }

    // If no paired device found, scan for advertising devices
    if (!device) {
        console.log("[BLE] No suitable paired device found, scanning...");
        device = await new Promise<Device>((resolve, reject) => {
            const timer = setTimeout(() => {
                manager.stopDeviceScan();
                reject(
                    new PrinterError(
                        "No printer found. Make sure your printer is on, paired, and in range.",
                        "NO_PRINTER_FOUND",
                    ),
                );
            }, timeoutMs);

            manager.startDeviceScan(null, { allowDuplicates: false }, (err, d) => {
                if (err) {
                    clearTimeout(timer);
                    manager.stopDeviceScan();
                    reject(new PrinterError(err.message ?? "BLE scan error", "UNKNOWN"));
                    return;
                }
                if (!d) return;

                // Log all found devices for debugging
                const name = (d.name ?? d.localName ?? "").toLowerCase();
                console.log(`[BLE] Found device: ${d.name ?? d.localName ?? "(no name)"} [${d.id}]`);

                // Match on name: thermal printers commonly include these keywords
                const isPrinter =
                    name.includes("print") ||
                    name.includes("pos") ||
                    name.includes("bt-") ||
                    name.includes("cashino") ||
                    name.includes("rongta") ||
                    name.includes("xprinter") ||
                    name.includes("goojprt") ||
                    name.includes("rpp") ||
                    name.includes("mtp") ||
                    name.includes("btp") ||
                    name.includes("pt-");

                if (isPrinter) {
                    clearTimeout(timer);
                    manager.stopDeviceScan();
                    console.log(`[BLE] ✓ Matched printer: ${d.name ?? d.localName}`);
                    resolve(d);
                }
            });
        });
    }

    // Connect
    let connected: Device;
    try {
        connected = await manager.connectToDevice(device.id);
        await connected.discoverAllServicesAndCharacteristics();
    } catch (err: any) {
        throw new PrinterError(
            `Could not connect to ${device.name ?? "printer"}: ${err?.message ?? "unknown error"}`,
            "CONNECTION_FAILED",
        );
    }

    let printerName = device.name ?? device.localName ?? "Unknown printer";

    try {
        const char = await findPrintCharacteristic(connected);
        if (!char) {
            throw new PrinterError(
                "Connected to printer but could not find a writable print characteristic. The printer model may not be supported.",
                "NO_PRINT_CHARACTERISTIC",
            );
        }

        await writeInChunks(char, receipt);
    } catch (err: any) {
        if (err instanceof PrinterError) throw err;
        throw new PrinterError(
            `Failed to write receipt data: ${err?.message ?? "unknown error"}`,
            "WRITE_FAILED",
        );
    } finally {
        // Always disconnect
        try {
            await manager.cancelDeviceConnection(device.id);
        } catch {
            // ignore disconnect errors
        }
    }

    return { printerName };
}
