import * as Network from "expo-network";
import { ApiError, api } from "@/lib/api";
import {
  listOutboxEntries,
  markOutboxEntryError,
  removeOutboxEntry,
  getOutboxCount,
  type SaleOutboxEntry,
} from "@/lib/offline-outbox";
import { queryClient } from "@/lib/query-client";
import { useAuthStore } from "@/store/auth";

export type SyncResult = {
  pushed: number;
  remaining: number;
  offline: boolean;
  locked: boolean;
  error: string | null;
};

async function hasInternetAccess() {
  const networkState = await Network.getNetworkStateAsync();
  return Boolean(networkState.isConnected && networkState.isInternetReachable !== false);
}

async function pushSaleEntry(entry: SaleOutboxEntry) {
  await api.post("/sales", entry.payload);
}

export async function syncSalesOutbox(): Promise<SyncResult> {
  const online = await hasInternetAccess();
  if (!online) {
    useAuthStore.getState().setOfflineMode(true);
    return {
      pushed: 0,
      remaining: await getOutboxCount(),
      offline: true,
      locked: false,
      error: "No internet connection",
    };
  }

  const entries = await listOutboxEntries();
  if (entries.length === 0) {
    useAuthStore.getState().setOfflineMode(false);
    return {
      pushed: 0,
      remaining: 0,
      offline: false,
      locked: false,
      error: null,
    };
  }

  let pushed = 0;
  let locked = false;
  let errorMessage: string | null = null;

  for (const entry of entries) {
    try {
      await pushSaleEntry(entry);
      await removeOutboxEntry(entry.id);
      pushed += 1;
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.status === 0) {
          useAuthStore.getState().setOfflineMode(true);
          errorMessage = error.message;
          break;
        }

        if (error.status === 402) {
          locked = true;
          errorMessage = error.message;
          break;
        }

        await markOutboxEntryError(entry.id, error.message);
        errorMessage = error.message;
        continue;
      }

      const fallbackMessage = error instanceof Error ? error.message : "Unknown sync error";
      await markOutboxEntryError(entry.id, fallbackMessage);
      errorMessage = fallbackMessage;
    }
  }

  const remaining = await getOutboxCount();

  if (pushed > 0) {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["sales"] }),
      queryClient.invalidateQueries({ queryKey: ["reports"] }),
    ]);
  }

  if (!locked && errorMessage == null) {
    useAuthStore.getState().setOfflineMode(false);
  }

  return {
    pushed,
    remaining,
    offline: errorMessage === "No internet connection" || useAuthStore.getState().isOfflineMode,
    locked,
    error: errorMessage,
  };
}
