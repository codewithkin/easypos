import { create } from "zustand";
import { getOutboxCount } from "@/lib/offline-outbox";
import { syncSalesOutbox, type SyncResult } from "@/lib/sync";

type SyncState = {
  pendingCount: number;
  isSyncing: boolean;
  lastSyncedAt: string | null;
  lastError: string | null;
  refreshPendingCount: () => Promise<void>;
  syncNow: () => Promise<SyncResult>;
};

const EMPTY_RESULT: SyncResult = {
  pushed: 0,
  remaining: 0,
  offline: false,
  locked: false,
  error: null,
};

export const useSyncStore = create<SyncState>((set, get) => ({
  pendingCount: 0,
  isSyncing: false,
  lastSyncedAt: null,
  lastError: null,

  refreshPendingCount: async () => {
    const pendingCount = await getOutboxCount();
    set({ pendingCount });
  },

  syncNow: async () => {
    if (get().isSyncing) {
      return {
        ...EMPTY_RESULT,
        remaining: get().pendingCount,
      };
    }

    set({ isSyncing: true, lastError: null });

    try {
      const result = await syncSalesOutbox();
      set({
        isSyncing: false,
        pendingCount: result.remaining,
        lastSyncedAt: result.pushed > 0 ? new Date().toISOString() : get().lastSyncedAt,
        lastError: result.error,
      });
      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Sync failed";
      const pendingCount = await getOutboxCount();
      set({
        isSyncing: false,
        pendingCount,
        lastError: message,
      });
      return {
        ...EMPTY_RESULT,
        remaining: pendingCount,
        error: message,
      };
    }
  },
}));
