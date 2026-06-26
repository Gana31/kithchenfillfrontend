import { useState, useRef, useCallback, useEffect } from 'react';
import { IngredientData } from '../inventoryApi';

export interface GridSelectionState {
  active: boolean;
  count: number;
  total: number;
  allSelected: boolean;
}

interface UseGridSelectionOptions {
  items: IngredientData[];
  onBulkDelete: (items: IngredientData[]) => void;
  onSelectionChange?: (state: GridSelectionState) => void;
  selectionClearToken?: number;
}

export function useGridSelection({
  items,
  onBulkDelete,
  onSelectionChange,
  selectionClearToken = 0,
}: UseGridSelectionOptions) {
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectionTick, setSelectionTick] = useState(0);
  const suppressToggleUntil = useRef(0);

  const commitSelection = useCallback((next: Set<string>) => {
    setSelectedIds(next);
    setSelectionTick((tick) => tick + 1);
  }, []);

  const clearSelection = useCallback(() => {
    setSelectionMode(false);
    commitSelection(new Set());
  }, [commitSelection]);

  const enterSelectionWith = useCallback((id: string) => {
    suppressToggleUntil.current = Date.now() + 700;
    setSelectionMode(true);
    commitSelection(new Set([id]));
  }, [commitSelection]);

  const toggleSelect = useCallback((id: string) => {
    if (Date.now() < suppressToggleUntil.current) return;

    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      if (next.size === 0) {
        setSelectionMode(false);
      }
      return next;
    });
    setSelectionTick((tick) => tick + 1);
  }, []);

  const selectAll = useCallback(() => {
    if (items.length === 0) return;
    setSelectionMode(true);
    commitSelection(new Set(items.map((item) => item._id)));
  }, [items, commitSelection]);

  const deleteSelected = useCallback(() => {
    const selected = items.filter((item) => selectedIds.has(item._id));
    if (selected.length === 0) return;
    onBulkDelete(selected);
  }, [items, onBulkDelete, selectedIds]);

  useEffect(() => {
    if (selectionClearToken > 0) {
      clearSelection();
    }
  }, [selectionClearToken, clearSelection]);

  const selectedCount = selectedIds.size;
  const allSelected = items.length > 0 && selectedCount === items.length;

  useEffect(() => {
    onSelectionChange?.({
      active: selectionMode,
      count: selectedCount,
      total: items.length,
      allSelected,
    });
  }, [selectionMode, selectedCount, items.length, allSelected, onSelectionChange]);

  return {
    selectionMode,
    selectedIds,
    selectionTick,
    enterSelectionWith,
    toggleSelect,
    clearSelection,
    selectAll,
    deleteSelected,
  };
}
