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
  const [sortBy, setSortBy] = useState<SortOption>('name-asc');

  useEffect(() => {
    loadInventoryPreferences().then((prefs) => {
      if (prefs) {
        setLayout(prefs.layout);
        setSortBy(prefs.sortBy);
      }
      setPrefsLoaded(true);
    });
  }, []);

  const handleLayoutChange = useCallback(
    (newLayout: InventoryLayout) => {
      if (newLayout === layout) return;
      setLayout(newLayout);
      saveInventoryPreferences({ layout: newLayout, sortBy });
    },
    [layout, sortBy]
  );

  const handleSortChange = useCallback(
    (newSort: SortOption) => {
      setSortBy(newSort);
      saveInventoryPreferences({ layout, sortBy: newSort });
    },
    [layout]
  );

  return {
    prefsLoaded,
    layout,
    sortBy,
    stockLevelSort: isStockLevelSortOption(sortBy),
    handleLayoutChange,
    handleSortChange,
  };
}
