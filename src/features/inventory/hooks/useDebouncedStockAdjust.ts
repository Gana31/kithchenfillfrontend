import { useCallback, useEffect, useRef, useState } from 'react';
import { useAppDispatch } from '../../../store/store';
import { showToast } from '../../../store/toastSlice';
import { useAdjustStockMutation } from '../inventoryApi';

export { applyPendingStock } from './applyPendingStock';

export const STOCK_ADJUST_DEBOUNCE_MS = 700;

interface PendingEntry {
  pendingDelta: number;
  timer: ReturnType<typeof setTimeout> | null;
  savingTimer: ReturnType<typeof setTimeout> | null;
  isFlushing: boolean;
  isAwaitingSave: boolean;
}

export function useDebouncedStockAdjust() {
  const dispatch = useAppDispatch();
  const [adjustStock] = useAdjustStockMutation();
  const pendingRef = useRef<Map<string, PendingEntry>>(new Map());
  const [pendingVersion, setPendingVersion] = useState(0);

  const bumpPendingVersion = useCallback(() => {
    setPendingVersion((v) => v + 1);
  }, []);

  const getPendingDelta = useCallback(
    (id: string) => pendingRef.current.get(id)?.pendingDelta ?? 0,
    [pendingVersion]
  );

  const isSyncing = useCallback(
    (id: string) => {
      const entry = pendingRef.current.get(id);
      if (!entry) return false;
      return entry.isFlushing || entry.isAwaitingSave;
    },
    [pendingVersion]
  );

  const flushRef = useRef<(id: string) => Promise<void>>(async () => {});

  const scheduleFlush = useCallback(
    (id: string) => {
      const entry = pendingRef.current.get(id);
      if (!entry || entry.isFlushing) return;

      if (entry.timer) {
        clearTimeout(entry.timer);
      }
      if (entry.savingTimer) {
        clearTimeout(entry.savingTimer);
      }

      entry.isAwaitingSave = false;

      entry.savingTimer = setTimeout(() => {
        entry.savingTimer = null;
        if (entry.pendingDelta !== 0 && !entry.isFlushing) {
          entry.isAwaitingSave = true;
          bumpPendingVersion();
        }
      }, STOCK_ADJUST_DEBOUNCE_MS);

      entry.timer = setTimeout(() => {
        void flushRef.current(id);
      }, STOCK_ADJUST_DEBOUNCE_MS);
    },
    [bumpPendingVersion]
  );

  const flush = useCallback(
    async (id: string) => {
      const entry = pendingRef.current.get(id);
      if (!entry || entry.isFlushing) return;

      if (entry.timer) {
        clearTimeout(entry.timer);
        entry.timer = null;
      }
      if (entry.savingTimer) {
        clearTimeout(entry.savingTimer);
        entry.savingTimer = null;
      }

      const deltaToSend = entry.pendingDelta;
      if (deltaToSend === 0) return;

      entry.isFlushing = true;
      bumpPendingVersion();

      try {
        await adjustStock({ id, delta: deltaToSend }).unwrap();
        entry.pendingDelta -= deltaToSend;
        if (entry.pendingDelta < 0) {
          entry.pendingDelta = 0;
        }
      } catch (err: any) {
        dispatch(
          showToast({
            title: 'Adjustment Failed',
            message: err?.data?.error || 'Failed to update stock.',
            type: 'error',
          })
        );
      } finally {
        entry.isFlushing = false;
        entry.isAwaitingSave = false;
        bumpPendingVersion();

        if (entry.pendingDelta !== 0) {
          scheduleFlush(id);
        }
      }
    },
    [adjustStock, bumpPendingVersion, dispatch, scheduleFlush]
  );

  flushRef.current = flush;

  const queueAdjust = useCallback(
    (ingredientId: string, delta: number) => {
      if (delta === 0) return;

      let entry = pendingRef.current.get(ingredientId);
      if (!entry) {
        entry = {
          pendingDelta: 0,
          timer: null,
          savingTimer: null,
          isFlushing: false,
          isAwaitingSave: false,
        };
        pendingRef.current.set(ingredientId, entry);
      }

      entry.isAwaitingSave = false;
      entry.pendingDelta += delta;
      scheduleFlush(ingredientId);
      bumpPendingVersion();
    },
    [scheduleFlush, bumpPendingVersion]
  );

  useEffect(() => {
    const pending = pendingRef.current;
    return () => {
      pending.forEach((entry, id) => {
        if (entry.timer) {
          clearTimeout(entry.timer);
        }
        if (entry.savingTimer) {
          clearTimeout(entry.savingTimer);
        }
        if (entry.pendingDelta !== 0 && !entry.isFlushing) {
          void adjustStock({ id, delta: entry.pendingDelta });
        }
      });
      pending.clear();
    };
  }, [adjustStock]);

  return {
    queueAdjust,
    getPendingDelta,
    isSyncing,
    pendingVersion,
  };
}
