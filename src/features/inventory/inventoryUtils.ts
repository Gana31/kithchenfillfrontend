import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS } from '../../config/constants';
import { IngredientData, StockLevel, UnitRelation } from './inventoryApi';

export type InventoryLayout = 'list' | 'grid';
export type SortOption = 'name-asc' | 'name-desc' | 'stock-asc' | 'stock-desc';

export function isStockLevelSortOption(sortBy: SortOption): boolean {
  return sortBy === 'stock-asc' || sortBy === 'stock-desc';
}

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
  return cardWidth - 2;
}

export const GRID_NAME_BLOCK_HEIGHT = 50;
export const GRID_STEPPER_BLOCK_HEIGHT = 50;

/** Fixed grid cell height — every card in a row matches this. */
export function getGridCardHeight(cardWidth: number, selectionMode: boolean): number {
  const imageSize = getGridImageSize(cardWidth);
  const stepperBlock = selectionMode ? 8 : GRID_STEPPER_BLOCK_HEIGHT;
  return 4 + imageSize + 6 + GRID_NAME_BLOCK_HEIGHT + stepperBlock;
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

export function normalizeUnitRelation(relation?: Partial<UnitRelation> | null): UnitRelation {
  const baseUnit = relation?.baseUnit ?? 'g';
  const ratio = relation?.conversionRatio && relation.conversionRatio > 0 ? relation.conversionRatio : 1;
  const rawPurchaseUnit = String(relation?.purchaseUnit ?? '').toLowerCase();

  let purchaseUnit: UnitRelation['purchaseUnit'];
  if (rawPurchaseUnit === 'liter' || rawPurchaseUnit === 'l' || rawPurchaseUnit === 'liters') {
    purchaseUnit = 'liter';
  } else if (
    rawPurchaseUnit === 'pack' ||
    rawPurchaseUnit === 'pcs' ||
    rawPurchaseUnit === 'pc' ||
    rawPurchaseUnit === 'piece' ||
    rawPurchaseUnit === 'pieces'
  ) {
    purchaseUnit = 'pack';
  } else if (rawPurchaseUnit === 'kg') {
    purchaseUnit = 'kg';
  } else if (baseUnit === 'ml') {
    purchaseUnit = 'liter';
  } else if (baseUnit === 'pcs') {
    purchaseUnit = 'pack';
  } else {
    purchaseUnit = 'kg';
  }

  let normalizedBase: UnitRelation['baseUnit'] = baseUnit;
  if (purchaseUnit === 'liter' && baseUnit !== 'ml') normalizedBase = 'ml';
  if (purchaseUnit === 'kg' && baseUnit !== 'g') normalizedBase = 'g';
  if (purchaseUnit === 'pack' && baseUnit !== 'pcs' && baseUnit !== 'g') normalizedBase = 'pcs';

  let conversionRatio = ratio;
  if (purchaseUnit === 'kg' || purchaseUnit === 'liter') {
    conversionRatio = ratio >= 1 ? ratio : 1000;
  } else if (conversionRatio < 1) {
    conversionRatio = 1;
  }

  return {
    purchaseUnit,
    baseUnit: normalizedBase,
    conversionRatio,
  };
}

/** Read stored price from any supported field on the ingredient record. */
export function resolveIngredientPrice(ingredient: IngredientData): number {
  const record = ingredient as IngredientData & { purchaseCost?: number | string };
  const candidates = [ingredient.purchasePrice, record.purchaseCost];

  for (const raw of candidates) {
    const price = typeof raw === 'string' ? Number(raw) : raw;
    if (typeof price === 'number' && Number.isFinite(price) && price > 0) {
      return price;
    }
  }

  return 0;
}

export function getPurchaseUnitPrice(ingredient: IngredientData): number | null {
  const price = resolveIngredientPrice(ingredient);
  return price > 0 ? price : null;
}

/** Human label for purchase price — kg, L, pc, or pack. */
export function getPurchasePriceUnitLabel(ingredient: IngredientData): string {
  const display = getDisplayPurchasePrice(ingredient);
  return display?.unitLabel ?? 'kg';
}

/** Price shown in UI — always per kg, per liter, or per pc (never per gram/ml). */
export function getDisplayPurchasePrice(
  ingredient: IngredientData
): { amount: number; unitLabel: string } | null {
  const stored = getPurchaseUnitPrice(ingredient);
  if (stored === null) return null;

  const unitRelation = normalizeUnitRelation(ingredient.unitRelation);

  if (unitRelation.purchaseUnit === 'liter') {
    let amount = stored;
    // Legacy data sometimes stored ₹/ml instead of ₹/liter
    if (amount > 0 && amount < 1 && unitRelation.conversionRatio >= 100) {
      amount = amount * unitRelation.conversionRatio;
    }
    return { amount, unitLabel: 'liter' };
  }

  if (unitRelation.purchaseUnit === 'kg') {
    let amount = stored;
    // Legacy data sometimes stored ₹/g instead of ₹/kg
    if (amount > 0 && amount < 1 && unitRelation.conversionRatio >= 100) {
      amount = amount * unitRelation.conversionRatio;
    }
    return { amount, unitLabel: 'kg' };
  }

  if (unitRelation.purchaseUnit === 'pack' && unitRelation.baseUnit === 'pcs') {
    const ratio = unitRelation.conversionRatio > 0 ? unitRelation.conversionRatio : 1;
    return { amount: stored / ratio, unitLabel: 'pc' };
  }

  return { amount: stored, unitLabel: 'pack' };
}

export function formatPurchasePriceLabel(unitLabel: string): string {
  if (unitLabel === 'liter') return 'per liter';
  if (unitLabel === 'kg') return 'per kg';
  if (unitLabel === 'pc') return 'per pc';
  return 'per pack';
}

export function formatPriceAmount(amount: number): string {
  const rounded = Math.round(amount * 100) / 100;
  if (Number.isInteger(rounded)) return String(rounded);
  return rounded.toFixed(2).replace(/0+$/, '').replace(/\.$/, '');
}

export function normalizeIngredientRecord(ingredient: IngredientData): IngredientData {
  return {
    ...ingredient,
    unitRelation: normalizeUnitRelation(ingredient.unitRelation),
    purchasePrice: resolveIngredientPrice(ingredient),
  };
}

export function computeStockLevel(currentStock: number, minThreshold: number): StockLevel {
  if (currentStock <= minThreshold) return 'low';
  if (minThreshold <= 0) return currentStock > 0 ? 'high' : 'low';
  if (currentStock <= minThreshold * 2) return 'average';
  return 'high';
}

const STOCK_LEVEL_RANK: Record<StockLevel, number> = {
  low: 0,
  average: 1,
  high: 2,
};

function getStockLevelRank(ingredient: IngredientData): number {
  const level = computeStockLevel(ingredient.currentStock, ingredient.minThreshold);
  return STOCK_LEVEL_RANK[level];
}

export function sortIngredientsByStockLevel(
  ingredients: IngredientData[],
  direction: 'asc' | 'desc'
): IngredientData[] {
  const dir = direction === 'asc' ? 1 : -1;
  return [...ingredients].sort((a, b) => {
    const rankDiff = getStockLevelRank(a) - getStockLevelRank(b);
    if (rankDiff !== 0) return rankDiff * dir;
    return (a.currentStock - b.currentStock) * dir;
  });
}

export function formatPurchasePrice(ingredient: IngredientData): string | null {
  const display = getDisplayPurchasePrice(ingredient);
  if (!display) return null;

  return `₹${formatPriceAmount(display.amount)} ${formatPurchasePriceLabel(display.unitLabel)}`;
}

/** Always returns a label for UI — shows hint when price is missing. */
export function formatPurchasePriceDisplay(ingredient: IngredientData): {
  text: string;
  hasPrice: boolean;
} {
  const formatted = formatPurchasePrice(ingredient);
  if (formatted) {
    return { text: formatted, hasPrice: true };
  }
  return { text: 'Set price', hasPrice: false };
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
  if (baseUnit === 'pcs') return 'pcs';
  return baseUnit;
}

/** Hint for recipe quantity field — user can type g or kg, ml or L, etc. */
export function getRecipeQtyHint(ingredient: IngredientData): string {
  const unitRelation = normalizeUnitRelation(ingredient.unitRelation);
  if (unitRelation.baseUnit === 'g') return 'g or kg';
  if (unitRelation.baseUnit === 'ml') return 'ml or L';
  return 'pcs';
}

export function getInventoryQtyPlaceholder(unitCategory: 'weight' | 'volume' | 'count'): string {
  if (unitCategory === 'weight') return 'e.g. 5 kg or 500 g';
  if (unitCategory === 'volume') return 'e.g. 2 L or 500 ml';
  return 'e.g. 30';
}

function parseQtyMatch(input: string): { value: number; unit: string } | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  const match = trimmed.match(/^([0-9.]+)\s*([a-zA-Z]*)$/);
  if (!match) {
    const value = parseFloat(trimmed);
    return Number.isFinite(value) ? { value, unit: '' } : null;
  }

  const value = parseFloat(match[1]);
  if (!Number.isFinite(value)) return null;
  return { value, unit: match[2].toLowerCase() };
}

/** Stock/threshold on add/edit ingredient — default unit is kg, L, or pcs. */
export function parseInventoryQtyInput(input: string, unitRelation: UnitRelation): number {
  const parsed = parseQtyMatch(input);
  if (!parsed || parsed.value < 0) return NaN;

  const ur = normalizeUnitRelation(unitRelation);
  const { value, unit } = parsed;

  if (ur.purchaseUnit === 'kg') {
    if (unit === 'g' || unit === 'gm' || unit === 'gram' || unit === 'grams') return value;
    if (!unit || unit === 'kg' || unit === 'kilo' || unit === 'kilogram' || unit === 'kilograms') {
      return value * ur.conversionRatio;
    }
    return value * ur.conversionRatio;
  }

  if (ur.purchaseUnit === 'liter') {
    if (unit === 'ml' || unit === 'milliliter' || unit === 'milliliters') return value;
    if (!unit || unit === 'l' || unit === 'liter' || unit === 'liters') {
      return value * ur.conversionRatio;
    }
    return value * ur.conversionRatio;
  }

  if (unit === 'pack' || unit === 'packs') return value * ur.conversionRatio;
  if (!unit || unit === 'pcs' || unit === 'pc' || unit === 'piece' || unit === 'pieces') return value;
  if (ur.conversionRatio > 1) return value * ur.conversionRatio;
  return value;
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

  // Bare number in the stepper — matches the purchase-unit label (kg, L, pcs)
  if (!unit) {
    if (baseUnit === 'g' || baseUnit === 'ml') {
      return val * conversionRatio;
    }
    return val;
  }

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
  if (unit === 'pack' || unit === 'packs') {
    return val * conversionRatio;
  }

  if (baseUnit === 'g' || baseUnit === 'ml') {
    return val * conversionRatio;
  }
  return val;
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

export const SORT_OPTIONS: { value: SortOption; label: string; icon: string }[] = [
  { value: 'name-asc', label: 'Name A→Z', icon: 'text-outline' },
  { value: 'name-desc', label: 'Name Z→A', icon: 'text-outline' },
  { value: 'stock-asc', label: 'Low → Avg → High', icon: 'trending-up-outline' },
  { value: 'stock-desc', label: 'High → Avg → Low', icon: 'trending-down-outline' },
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
