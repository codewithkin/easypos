import * as SecureStore from "expo-secure-store";
import type { CreateSaleRequest } from "@easypos/types";

const OUTBOX_KEY = "easypos_offline_outbox_v1";

export type SaleOutboxEntry = {
  id: string;
  type: "create_sale";
  createdAt: string;
  retryCount: number;
  lastError: string | null;
  payload: CreateSaleRequest;
};

type OutboxState = {
  version: 1;
  entries: SaleOutboxEntry[];
};

const EMPTY_STATE: OutboxState = {
  version: 1,
  entries: [],
};

function createEntryId() {
  return `outbox_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export function createClientMutationId() {
  return `sale_mut_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

async function readState(): Promise<OutboxState> {
  const raw = await SecureStore.getItemAsync(OUTBOX_KEY);
  if (!raw) return EMPTY_STATE;

  try {
    const parsed = JSON.parse(raw) as OutboxState;
    if (!parsed || parsed.version !== 1 || !Array.isArray(parsed.entries)) {
      return EMPTY_STATE;
    }
    return {
      version: 1,
      entries: parsed.entries.filter(
        (entry) =>
          !!entry &&
          typeof entry.id === "string" &&
          entry.type === "create_sale" &&
          typeof entry.createdAt === "string" &&
          typeof entry.retryCount === "number" &&
          !!entry.payload,
      ),
    };
  } catch {
    await SecureStore.deleteItemAsync(OUTBOX_KEY);
    return EMPTY_STATE;
  }
}

async function writeState(state: OutboxState): Promise<void> {
  await SecureStore.setItemAsync(OUTBOX_KEY, JSON.stringify(state));
}

export async function listOutboxEntries(): Promise<SaleOutboxEntry[]> {
  const state = await readState();
  return [...state.entries].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export async function getOutboxCount(): Promise<number> {
  const state = await readState();
  return state.entries.length;
}

export async function enqueueSaleMutation(payload: CreateSaleRequest): Promise<SaleOutboxEntry> {
  const state = await readState();
  const entry: SaleOutboxEntry = {
    id: createEntryId(),
    type: "create_sale",
    createdAt: new Date().toISOString(),
    retryCount: 0,
    lastError: null,
    payload,
  };

  state.entries.push(entry);
  await writeState(state);
  return entry;
}

export async function removeOutboxEntry(entryId: string): Promise<void> {
  const state = await readState();
  const nextEntries = state.entries.filter((entry) => entry.id !== entryId);
  if (nextEntries.length === state.entries.length) return;

  await writeState({
    version: 1,
    entries: nextEntries,
  });
}

export async function markOutboxEntryError(entryId: string, message: string): Promise<void> {
  const state = await readState();

  let changed = false;
  const nextEntries = state.entries.map((entry) => {
    if (entry.id !== entryId) return entry;
    changed = true;
    return {
      ...entry,
      retryCount: entry.retryCount + 1,
      lastError: message,
    };
  });

  if (!changed) return;

  await writeState({
    version: 1,
    entries: nextEntries,
  });
}

export async function clearOutbox(): Promise<void> {
  await SecureStore.deleteItemAsync(OUTBOX_KEY);
}
