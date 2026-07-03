import { useCallback, useEffect, useState } from 'react';
import {
  InventoryLayout,
  SortOption,
  loadInventoryPreferences,
  saveInventoryPreferences,
  isStockLevelSortOption,
} from '../inventoryUtils';

export function useInventoryPreferences() {
  const [prefsLoaded, setPrefsLoaded] = useState(false);
  const [layout, setLayout] = useState<InventoryLayout>('list');
  const [grouped, setGrouped] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('name-asc');

  useEffect(() => {
    loadInventoryPreferences().then((prefs) => {
      if (prefs) {
        setLayout(prefs.layout);
        setGrouped(prefs.grouped);
        setSortBy(prefs.sortBy);
      }
      setPrefsLoaded(true);
    });
  }, []);

  const handleLayoutChange = useCallback(
    (newLayout: InventoryLayout) => {
      if (newLayout === layout) return;
      setLayout(newLayout);
      saveInventoryPreferences({ layout: newLayout, grouped, sortBy });
    },
    [layout, grouped, sortBy]
  );

  const handleGroupedChange = useCallback(
    (newGrouped: boolean) => {
      if (newGrouped === grouped) return;
      setGrouped(newGrouped);
      saveInventoryPreferences({ layout, grouped: newGrouped, sortBy });
    },
    [layout, grouped, sortBy]
  );

  const handleSortChange = useCallback(
    (newSort: SortOption) => {
      setSortBy(newSort);
      saveInventoryPreferences({ layout, grouped, sortBy: newSort });
    },
    [layout, grouped]
  );

  return {
    prefsLoaded,
    layout,
    grouped,
    sortBy,
    stockLevelSort: isStockLevelSortOption(sortBy),
    handleLayoutChange,
    handleGroupedChange,
    handleSortChange,
  };
}
