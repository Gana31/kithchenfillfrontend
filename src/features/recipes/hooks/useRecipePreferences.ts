import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';
import { InventoryLayout } from '../../inventory/inventoryUtils';

const RECIPE_PREFS_KEY = 'recipe-view-preferences';
const VALID_LAYOUTS: InventoryLayout[] = ['list', 'grid'];

/** Persists the recipes list/grid layout choice, mirroring the inventory prefs pattern. */
export function useRecipePreferences() {
  const [prefsLoaded, setPrefsLoaded] = useState(false);
  const [layout, setLayout] = useState<InventoryLayout>('list');

  useEffect(() => {
    AsyncStorage.getItem(RECIPE_PREFS_KEY)
      .then((raw) => {
        if (raw) {
          try {
            const parsed = JSON.parse(raw);
            if (VALID_LAYOUTS.includes(parsed.layout)) {
              setLayout(parsed.layout);
            }
          } catch {
            // ignore malformed prefs
          }
        }
      })
      .finally(() => setPrefsLoaded(true));
  }, []);

  const handleLayoutChange = useCallback((next: InventoryLayout) => {
    setLayout((prev) => {
      if (prev === next) return prev;
      AsyncStorage.setItem(RECIPE_PREFS_KEY, JSON.stringify({ layout: next })).catch(() => {});
      return next;
    });
  }, []);

  return { prefsLoaded, layout, handleLayoutChange };
}
