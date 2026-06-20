import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS } from '../../config/constants';
import { IngredientData, StockLevel } from './inventoryApi';

export type InventoryLayout = 'list' | 'grid';
export type SortOption = 'name-asc' | 'name-desc' | 'stock-asc' | 'stock-desc';

export const INVENTORY_PREFS_KEY = 'inventory-view-preferences';

export interface InventoryPreferences {
  layout: InventoryLayout;
  sortBy: SortOption;
}

const VALID_LAYOUTS: InventoryLayout[] = ['list', 'grid'];
const VALID_SORTS: SortOption[] = ['name-asc', 'name-desc', 'stock-asc', 'stock-desc'];

export async function loadInventoryPreferences(): Promise<InventoryPreferences | null> {
  try {
    const raw = await AsyncStorage.getItem(INVENTORY_PREFS_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    if (
      VALID_LAYOUTS.includes(parsed.layout) &&
      VALID_SORTS.includes(parsed.sortBy)
    ) {
      return parsed as InventoryPreferences;
    }
  } catch (error) {
    console.error('Failed to load inventory preferences:', error);
  }
  return null;
}

export async function saveInventoryPreferences(prefs: InventoryPreferences): Promise<void> {
  try {
    await AsyncStorage.setItem(INVENTORY_PREFS_KEY, JSON.stringify(prefs));
  } catch (error) {
    console.error('Failed to save inventory preferences:', error);
  }
}

export const GRID_COLUMNS = 3;
export const GRID_HORIZONTAL_PADDING = 12;
export const GRID_GAP = 6;

export function getGridCardWidth(screenWidth: number): number {
  const available = screenWidth - GRID_HORIZONTAL_PADDING * 2;
  return (available - GRID_GAP * (GRID_COLUMNS - 1)) / GRID_COLUMNS;
}

export function getGridImageSize(cardWidth: number): number {
  return cardWidth - 8;
}

/** Approximate grid cell height for hit-testing while drag-selecting. */
export function getGridCardHeight(cardWidth: number, selectionMode: boolean): number {
  const imageSize = getGridImageSize(cardWidth);
  const nameBlock = 30;
  const stepperBlock = selectionMode ? 0 : 58;
  return 8 + imageSize + 4 + nameBlock + stepperBlock;
}

export function pageYToGridIndex(
  pageX: number,
  pageY: number,
  scrollY: number,
  listPageY: number,
  headerHeight: number,
  cardWidth: number,
  cardHeight: number,
  columns: number,
  horizontalPadding: number,
  gap: number,
  itemCount: number
): number {
  if (itemCount <= 0) return 0;

  const contentY = pageY - listPageY + scrollY - headerHeight;
  const rowHeight = cardHeight + gap;
  const row = Math.max(0, Math.floor(contentY / rowHeight));

  const localX = pageX - horizontalPadding;
  const colWidth = cardWidth + gap;
  let col = Math.floor(localX / colWidth);
  col = Math.max(0, Math.min(columns - 1, col));

  const index = row * columns + col;
  return Math.min(itemCount - 1, Math.max(0, index));
}

export function formatStock(stock: number, unit: string) {
  if (unit === 'g') {
    return `${(stock / 1000).toFixed(2)} kg`;
  }
  if (unit === 'ml') {
    return `${(stock / 1000).toFixed(2)} L`;
  }
  return `${stock} pcs`;
}

export function formatStockCompact(stock: number, unit: string) {
  if (unit === 'g') {
    const kg = stock / 1000;
    return Number.isInteger(kg) ? `${kg}kg` : `${kg.toFixed(1)}kg`;
  }
  if (unit === 'ml') {
    const liters = stock / 1000;
    return Number.isInteger(liters) ? `${liters}L` : `${liters.toFixed(1)}L`;
  }
  return `${stock}pcs`;
}

export function getPurchaseUnitPrice(ingredient: IngredientData): number | null {
  const batches = ingredient.batches || [];
  if (batches.length === 0) return null;

  const latestBatch = batches[batches.length - 1];
  if (!latestBatch.costPerBaseUnit) return null;

  const ratio = ingredient.unitRelation?.conversionRatio ?? 1;
  return latestBatch.costPerBaseUnit * ratio;
}

export function formatPurchasePrice(ingredient: IngredientData): string | null {
  const price = getPurchaseUnitPrice(ingredient);
  if (price === null || price <= 0) return null;

  const purchaseUnit = ingredient.unitRelation?.purchaseUnit ?? 'kg';
  const unitLabel = purchaseUnit === 'liter' ? 'L' : purchaseUnit === 'pack' ? 'pcs' : 'kg';
  const formatted = Number.isInteger(price) ? price.toString() : price.toFixed(2);

  return `₹${formatted}/${unitLabel}`;
}

export function getQuickStepAmount(baseUnit: string, conversionRatio: number): number {
  if (baseUnit === 'g' || baseUnit === 'ml') {
    return conversionRatio;
  }
  return 1;
}

export function getPurchaseUnitLabel(baseUnit: string): string {
  if (baseUnit === 'g') return 'kg';
  if (baseUnit === 'ml') return 'L';
  return 'pcs';
}

export function parseStepAmount(input: string, baseUnit: string, conversionRatio: number): number {
  const trimmed = input.trim();

  if (!trimmed) {
    return getQuickStepAmount(baseUnit, conversionRatio);
  }

  const match = trimmed.match(/^([0-9.]+)\s*([a-zA-Z]*)$/);
  if (!match) {
    const val = parseFloat(trimmed);
    if (isNaN(val) || val <= 0) {
      return getQuickStepAmount(baseUnit, conversionRatio);
    }
    if (baseUnit === 'g' || baseUnit === 'ml') {
      return val * conversionRatio;
    }
    return val;
  }

  const val = parseFloat(match[1]);
  if (isNaN(val) || val <= 0) {
    return getQuickStepAmount(baseUnit, conversionRatio);
  }

  const unit = match[2].toLowerCase();

  if (unit === 'g' || unit === 'gm' || unit === 'gram' || unit === 'grams') {
    return val;
  }
  if (unit === 'kg' || unit === 'kilo' || unit === 'kilogram' || unit === 'kilograms') {
    return val * 1000;
  }
  if (unit === 'ml' || unit === 'milliliter' || unit === 'milliliters') {
    return val;
  }
  if (unit === 'l' || unit === 'liter' || unit === 'liters') {
    return val * 1000;
  }
  if (unit === 'pcs' || unit === 'pc' || unit === 'piece' || unit === 'pieces') {
    return val;
  }

  if (baseUnit === 'g' || baseUnit === 'ml') {
    return val * conversionRatio;
  }
  return val * conversionRatio;
}

export function getCategoryDetails(catName?: string, itemName: string = '') {
  if (catName) {
    switch (catName) {
      case 'Meat':
        return { type: 'Meat', icon: '🍗', bgClass: 'bg-red-500/10', textClass: 'text-red-500 dark:text-red-400' };
      case 'Dairy':
        return { type: 'Dairy', icon: '🥛', bgClass: 'bg-blue-500/10', textClass: 'text-blue-500 dark:text-blue-400' };
      case 'Grains':
        return { type: 'Grains', icon: '🌾', bgClass: 'bg-amber-500/20', textClass: 'text-amber-700 dark:text-amber-400' };
      case 'Vegetables':
        return { type: 'Vegetables', icon: '🥦', bgClass: 'bg-green-500/10', textClass: 'text-green-500 dark:text-green-400' };
      case 'Seafood':
        return { type: 'Seafood', icon: '🐟', bgClass: 'bg-cyan-500/10', textClass: 'text-cyan-500 dark:text-cyan-400' };
      case 'Spices':
        return { type: 'Spices', icon: '🧂', bgClass: 'bg-orange-500/10', textClass: 'text-orange-500 dark:text-orange-400' };
      case 'Beverages':
        return { type: 'Beverages', icon: '🥤', bgClass: 'bg-pink-500/10', textClass: 'text-pink-500 dark:text-pink-400' };
      case 'Bakery':
        return { type: 'Bakery', icon: '🍞', bgClass: 'bg-yellow-600/10', textClass: 'text-yellow-600 dark:text-yellow-500' };
      case 'Packaging':
        return { type: 'Packaging', icon: '📦', bgClass: 'bg-purple-500/10', textClass: 'text-purple-500 dark:text-purple-400' };
      case 'Pantry':
        return { type: 'Pantry', icon: '🥫', bgClass: 'bg-emerald-500/10', textClass: 'text-emerald-500 dark:text-emerald-400' };
    }
  }

  const lowercaseName = itemName.toLowerCase();
  if (
    lowercaseName.includes('chicken') ||
    lowercaseName.includes('meat') ||
    lowercaseName.includes('mutton') ||
    lowercaseName.includes('fish') ||
    lowercaseName.includes('egg')
  ) {
    return { type: 'Meat', icon: '🍗', bgClass: 'bg-red-500/10', textClass: 'text-red-500 dark:text-red-400' };
  }
  if (
    lowercaseName.includes('butter') ||
    lowercaseName.includes('cream') ||
    lowercaseName.includes('milk') ||
    lowercaseName.includes('paneer') ||
    lowercaseName.includes('cheese') ||
    lowercaseName.includes('dairy')
  ) {
    return { type: 'Dairy', icon: '🥛', bgClass: 'bg-blue-500/10', textClass: 'text-blue-500 dark:text-blue-400' };
  }
  if (
    lowercaseName.includes('rice') ||
    lowercaseName.includes('grain') ||
    lowercaseName.includes('flour') ||
    lowercaseName.includes('basmati') ||
    lowercaseName.includes('wheat')
  ) {
    return { type: 'Grains', icon: '🌾', bgClass: 'bg-amber-500/20', textClass: 'text-amber-700 dark:text-amber-400' };
  }
  if (
    lowercaseName.includes('container') ||
    lowercaseName.includes('pack') ||
    lowercaseName.includes('box') ||
    lowercaseName.includes('bag') ||
    lowercaseName.includes('paper')
  ) {
    return { type: 'Packaging', icon: '📦', bgClass: 'bg-purple-500/10', textClass: 'text-purple-500 dark:text-purple-400' };
  }
  return { type: 'Pantry', icon: '🥫', bgClass: 'bg-emerald-500/10', textClass: 'text-emerald-500 dark:text-emerald-400' };
}

export function filterAndSortIngredients(
  ingredients: IngredientData[],
  searchQuery: string,
  sortBy: SortOption
): IngredientData[] {
  const filtered = ingredients.filter((item) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const sorted = [...filtered].sort((a, b) => {
    switch (sortBy) {
      case 'name-asc':
        return a.name.localeCompare(b.name);
      case 'name-desc':
        return b.name.localeCompare(a.name);
      case 'stock-asc':
        return a.currentStock - b.currentStock;
      case 'stock-desc':
        return b.currentStock - a.currentStock;
      default:
        return 0;
    }
  });

  return sorted;
}

export const SORT_OPTIONS: { value: SortOption; label: string; icon: string }[] = [
  { value: 'name-asc', label: 'Name A→Z', icon: 'text-outline' },
  { value: 'name-desc', label: 'Name Z→A', icon: 'text-outline' },
  { value: 'stock-asc', label: 'Stock Low→High', icon: 'trending-up-outline' },
  { value: 'stock-desc', label: 'Stock High→Low', icon: 'trending-down-outline' },
];

export interface StockLevelTheme {
  accentColor: string;
  badgeBgClass: string;
  badgeTextClass: string;
  label: string;
}

const STOCK_YELLOW = '#EAB308';
const STOCK_YELLOW_DARK = '#FACC15';

/** Theme-aligned stock indicators — uses app palette, no client-side stock math. */
export function getStockLevelTheme(stockLevel?: StockLevel, isDark = false): StockLevelTheme | null {
  if (!stockLevel) return null;

  switch (stockLevel) {
    case 'low':
      return {
        accentColor: COLORS.danger,
        badgeBgClass: 'bg-red-500/10',
        badgeTextClass: 'text-red-500',
        label: 'Low',
      };
    case 'average':
      return {
        accentColor: isDark ? STOCK_YELLOW_DARK : STOCK_YELLOW,
        badgeBgClass: 'bg-yellow-500/15',
        badgeTextClass: 'text-yellow-600 dark:text-yellow-400',
        label: 'Mid',
      };
    case 'high':
      return {
        accentColor: COLORS.success,
        badgeBgClass: 'bg-emerald-500/10',
        badgeTextClass: 'text-emerald-500 dark:text-emerald-400',
        label: 'Full',
      };
  }
}

export function getStockLevelBorderStyle(
  stockLevel: StockLevel | undefined,
  isDark: boolean,
  accentWidth = 4
): { borderLeftWidth: number; borderLeftColor: string } | null {
  const theme = getStockLevelTheme(stockLevel, isDark);
  if (!theme) return null;
  return {
    borderLeftWidth: accentWidth,
    borderLeftColor: theme.accentColor,
  };
}
