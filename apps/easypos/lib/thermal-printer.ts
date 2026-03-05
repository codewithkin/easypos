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
import { Platform } from "react-native";
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

    // ── Header ───────────────────────────────────────────────────
    push(new Uint8Array([ESC, 0x21, 0x10]));              // double height
    text(data.orgName.toUpperCase().slice(0, 32));
    push(new Uint8Array([ESC, 0x21, 0x00]));              // normal
    text(data.branchName.slice(0, 32));
    text(data.createdAt);
    rule();

    // ── Receipt metadata ─────────────────────────────────────────
    push(new Uint8Array([ESC, 0x61, 0x00]));              // left align
    text(leftRight("Receipt #:", data.receiptNumber));
    text(leftRight("Cashier:", data.cashierName.slice(0, 18)));
    if (data.customerName) {
        text(leftRight("Customer:", data.customerName.slice(0, 18)));
    }
    rule();

    // ── Items ────────────────────────────────────────────────────
    for (const item of data.items) {
        const nameLine = item.name.slice(0, 22);
        text(leftRight(nameLine, fmt(item.total, curr)));
        text(`  ${item.qty} x ${fmt(item.unitPrice, curr)}`);
    }
    rule();

    // ── Totals ───────────────────────────────────────────────────
    text(leftRight("Subtotal:", fmt(data.subtotal, curr)));
    if (data.discount > 0) {
        text(leftRight("Discount:", `-${fmt(data.discount, curr)}`));
    }
    if (data.tax > 0) {
        text(leftRight("Tax:", fmt(data.tax, curr)));
    }
    push(new Uint8Array([ESC, 0x21, 0x08]));              // bold
    text(leftRight("TOTAL:", fmt(data.total, curr)));
    push(new Uint8Array([ESC, 0x21, 0x00]));              // normal

    // ── Payment ──────────────────────────────────────────────────
    rule();
    text(leftRight("Payment:", data.paymentMethod));
    if (data.amountTendered !== undefined) {
        text(leftRight("Tendered:", fmt(data.amountTendered, curr)));
        text(leftRight("Change:", fmt(data.change ?? 0, curr)));
    }

    // ── Note ────────────────────────────────────────────────────
    if (data.note?.trim()) {
        rule();
        text("Note: " + data.note.trim().slice(0, 60));
    }

    // ── QR code ─────────────────────────────────────────────────
    rule();
    push(new Uint8Array([ESC, 0x61, 0x01]));              // center
    text("Scan to verify");

    // GS ( k — store data in QR symbol buffer
    const qrData = strToBytes(data.verifyUrl);
    const pL = (qrData.length + 3) & 0xff;
    const pH = ((qrData.length + 3) >> 8) & 0xff;
    push(new Uint8Array([GS, 0x28, 0x6b, 0x04, 0x00, 0x31, 0x41, 0x32, 0x00])); // model 2
    push(new Uint8Array([GS, 0x28, 0x6b, 0x03, 0x00, 0x31, 0x43, 0x06]));        // size 6
    push(new Uint8Array([GS, 0x28, 0x6b, 0x03, 0x00, 0x31, 0x45, 0x30]));        // error M
    push(new Uint8Array([GS, 0x28, 0x6b, pL, pH, 0x31, 0x50, 0x30]));            // store data
    push(qrData);
    push(new Uint8Array([GS, 0x28, 0x6b, 0x03, 0x00, 0x31, 0x51, 0x30]));        // print

    // ── Footer ───────────────────────────────────────────────────
    rule("=");
    push(new Uint8Array([ESC, 0x61, 0x01]));
    text("Thank you!");
    push(new Uint8Array([ESC, 0x61, 0x00]));

    // ── Feed + cut ───────────────────────────────────────────────
    push(new Uint8Array([ESC, 0x64, 0x04]));              // feed 4 lines
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

/** Scan for a nearby thermal printer, connect, print receipt, disconnect. */
export async function printReceiptBLE(
    receipt: Uint8Array,
    timeoutMs = 15_000,
): Promise<{ printerName: string }> {
    const manager = getManager();

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

    // Scan for devices
    const device = await new Promise<Device>((resolve, reject) => {
        const timer = setTimeout(() => {
            manager.stopDeviceScan();
            reject(
                new PrinterError(
                    "No printer found nearby. Make sure your printer is on and in range.",
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

            // Match on name: thermal printers commonly include these keywords
            const name = (d.name ?? d.localName ?? "").toLowerCase();
            const isPrinter =
                name.includes("print") ||
                name.includes("pos") ||
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
                resolve(d);
            }
        });
    });

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
