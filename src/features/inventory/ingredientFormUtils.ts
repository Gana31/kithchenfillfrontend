import { UnitRelation } from './inventoryApi';
import { normalizeUnitRelation, parseInventoryQtyInput } from './inventoryUtils';

export type UnitCategory = 'weight' | 'volume' | 'count';
export type RecipeQtyUnit = 'g' | 'kg' | 'ml' | 'L' | 'pcs';

export interface IngredientFormSnapshot {
  name: string;
  category: string;
  unitCategory: UnitCategory;
  purchaseUnit: UnitRelation['purchaseUnit'];
  baseUnit: UnitRelation['baseUnit'];
  conversionRatio: number;
  minThresholdInput: string;
  qtyInput: string;
  purchaseCostInput: string;
  image: string | null;
}

export function unitCategoryFromPurchaseUnit(purchaseUnit: string): UnitCategory {
  if (purchaseUnit === 'liter') return 'volume';
  if (purchaseUnit === 'pack') return 'count';
  return 'weight';
}

export function formatQtyForInput(valueInBase: number, ratio: number): string {
  const value = valueInBase / ratio;
  if (Number.isInteger(value)) return String(value);
  const rounded = Math.round(value * 1000) / 1000;
  return String(rounded);
}

/** Format stored base qty (g/ml/pcs) for the selected input unit. */
export function formatQtyForUnit(valueInBase: number, qtyUnit: RecipeQtyUnit, ratio: number): string {
  if (qtyUnit === 'kg' || qtyUnit === 'L') {
    return formatQtyForInput(valueInBase, ratio);
  }
  if (Number.isInteger(valueInBase)) return String(valueInBase);
  const rounded = Math.round(valueInBase * 1000) / 1000;
  return String(rounded);
}

export function getDefaultIngredientQtyUnit(unitCategory: UnitCategory): RecipeQtyUnit {
  if (unitCategory === 'volume') return 'L';
  if (unitCategory === 'count') return 'pcs';
  return 'kg';
}

export function getIngredientQtyUnitOptions(unitCategory: UnitCategory): RecipeQtyUnit[] {
  if (unitCategory === 'weight') return ['g', 'kg'];
  if (unitCategory === 'volume') return ['ml', 'L'];
  return ['pcs'];
}

export function parseIngredientFormQty(
  input: string,
  qtyUnit: RecipeQtyUnit,
  unitCategory: UnitCategory,
  unitRelation: UnitRelation
): number {
  if (unitCategory === 'weight' || unitCategory === 'volume') {
    return parseRecipeQtyWithUnit(input, qtyUnit);
  }
  return parseInventoryQtyInput(input, unitRelation);
}

/** Convert a form field string when switching g ↔ kg (weight only). */
export function convertIngredientQtyInput(
  input: string,
  fromUnit: RecipeQtyUnit,
  toUnit: RecipeQtyUnit,
  ratio: number
): string {
  const trimmed = input.trim();
  if (!trimmed || fromUnit === toUnit) return input;
  const base = parseRecipeQtyWithUnit(trimmed, fromUnit);
  if (!Number.isFinite(base)) return input;
  return formatQtyForUnit(base, toUnit, ratio);
}

export function getDefaultRecipeQtyUnit(unitRelation: UnitRelation): RecipeQtyUnit {
  const ur = normalizeUnitRelation(unitRelation);
  if (ur.baseUnit === 'g') return 'g';
  if (ur.baseUnit === 'ml') return 'ml';
  return 'pcs';
}

export function getRecipeQtyUnitOptions(unitRelation: UnitRelation): RecipeQtyUnit[] {
  const ur = normalizeUnitRelation(unitRelation);
  if (ur.baseUnit === 'g') return ['g', 'kg'];
  if (ur.baseUnit === 'ml') return ['ml', 'L'];
  return ['pcs'];
}

export function formatPriceForInput(price: number): string {
  if (price <= 0) return '';
  const rounded = Math.round(price * 100) / 100;
  if (Number.isInteger(rounded)) return String(rounded);
  return rounded.toFixed(2).replace(/0+$/, '').replace(/\.$/, '');
}

export function parseRecipeQtyWithUnit(input: string, qtyUnit: RecipeQtyUnit): number {
  const normalized = input.trim().replace(/,/g, '');
  if (!normalized || normalized === '.') return NaN;
  const value = Number(normalized);
  if (!Number.isFinite(value) || value <= 0) return NaN;
  if (qtyUnit === 'kg' || qtyUnit === 'L') return value * 1000;
  return value;
}

export function resolveUnitConfig(
  unitCategory: UnitCategory,
  existing?: UnitRelation
): Pick<UnitRelation, 'purchaseUnit' | 'baseUnit' | 'conversionRatio'> {
  if (unitCategory === 'volume') {
    return { purchaseUnit: 'liter', baseUnit: 'ml', conversionRatio: 1000 };
  }
  if (unitCategory === 'weight') {
    return { purchaseUnit: 'kg', baseUnit: 'g', conversionRatio: 1000 };
  }
  if (existing?.purchaseUnit === 'pack') {
    return {
      purchaseUnit: 'pack',
      baseUnit: 'pcs',
      conversionRatio: existing.conversionRatio > 0 ? existing.conversionRatio : 1,
    };
  }
  return { purchaseUnit: 'pack', baseUnit: 'pcs', conversionRatio: 1 };
}

export function snapshotFromIngredient(ingredient: {
  name: string;
  category?: string;
  minThreshold: number;
  currentStock: number;
  purchasePrice: number;
  image: string | null;
  unitRelation: UnitRelation;
}): IngredientFormSnapshot {
  const unitRelation = ingredient.unitRelation;
  const unitCategory = unitCategoryFromPurchaseUnit(unitRelation.purchaseUnit);
  const ratio = unitRelation.conversionRatio;

  return {
    name: ingredient.name,
    category: ingredient.category || 'Pantry',
    unitCategory,
    purchaseUnit: unitRelation.purchaseUnit,
    baseUnit: unitRelation.baseUnit,
    conversionRatio: ratio,
    minThresholdInput: formatQtyForInput(ingredient.minThreshold, ratio),
    qtyInput: formatQtyForInput(ingredient.currentStock, ratio),
    purchaseCostInput: formatPriceForInput(ingredient.purchasePrice),
    image: ingredient.image,
  };
}
