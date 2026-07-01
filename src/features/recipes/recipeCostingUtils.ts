import { IngredientData } from '../inventory/inventoryApi';
import {
  formatQtyForUnit,
  getDefaultRecipeQtyUnit,
} from '../inventory/ingredientFormUtils';
import {
  getRecipeQtyHint,
  normalizeUnitRelation,
  resolveIngredientPrice,
} from '../inventory/inventoryUtils';
import { CustomCostLine, RecipeIngredientLine } from './recipesApi';

export function getCostPerBaseUnit(purchasePrice: number, conversionRatio: number): number {
  const ratio = conversionRatio > 0 ? conversionRatio : 1;
  return (purchasePrice || 0) / ratio;
}

export function lineIngredientCost(
  netAmount: number,
  wastagePercent: number,
  costPerBaseUnit: number
): number {
  const grossAmount = netAmount * (1 + wastagePercent / 100);
  return grossAmount * costPerBaseUnit;
}

export interface IngredientLineCost {
  ingredientId: string;
  name: string;
  lineCost: number;
}

export interface RecipeCostPreview {
  ingredientSubtotal: number;
  customCostTotal: number;
  subtotalBeforeWaste: number;
  extraWastageCost: number;
  ingredientCost: number;
  makingCharges: number;
  batchCost: number;
  lines: IngredientLineCost[];
}

export interface RecipeCostPreviewInput {
  ingredientsUsed: RecipeIngredientLine[];
  customCostLines: CustomCostLine[];
  extraWastagePercent: number;
  makingCharges: { fixedAmount: number; percentOfIngredients: number };
}

export function computeRecipeCostPreview(
  inventory: IngredientData[],
  input: RecipeCostPreviewInput
): RecipeCostPreview {
  const byId = new Map(inventory.map((item) => [item._id, item]));
  let ingredientSubtotal = 0;
  const lines: IngredientLineCost[] = [];

  for (const line of input.ingredientsUsed) {
    const ingredient = byId.get(line.ingredientId);
    if (!ingredient || line.netAmount <= 0) continue;

    const unitRelation = normalizeUnitRelation(ingredient.unitRelation);
    const ratio = unitRelation.conversionRatio;
    const unitCost = getCostPerBaseUnit(resolveIngredientPrice(ingredient), ratio);
    const lineCost = lineIngredientCost(line.netAmount, line.wastagePercent ?? 0, unitCost);
    ingredientSubtotal += lineCost;
    lines.push({
      ingredientId: line.ingredientId,
      name: ingredient.name,
      lineCost: Math.round(lineCost * 100) / 100,
    });
  }

  const extraWastagePercent = Math.max(0, input.extraWastagePercent ?? 0);
  const customCostTotal = input.customCostLines.reduce(
    (sum, row) => sum + Math.max(0, Number(row.amount) || 0),
    0
  );
  const subtotalBeforeWaste = ingredientSubtotal + customCostTotal;
  const extraWastageCost = subtotalBeforeWaste * (extraWastagePercent / 100);

  const fixed = Math.max(0, input.makingCharges?.fixedAmount ?? 0);
  const percent = Math.max(0, input.makingCharges?.percentOfIngredients ?? 0);
  const variableCharges = ingredientSubtotal * (percent / 100);
  const makingCharges = fixed + variableCharges;
  const ingredientCost = subtotalBeforeWaste + extraWastageCost;
  const batchCost = ingredientCost + makingCharges;

  return {
    ingredientSubtotal: Math.round(ingredientSubtotal * 100) / 100,
    customCostTotal: Math.round(customCostTotal * 100) / 100,
    subtotalBeforeWaste: Math.round(subtotalBeforeWaste * 100) / 100,
    extraWastageCost: Math.round(extraWastageCost * 100) / 100,
    ingredientCost: Math.round(ingredientCost * 100) / 100,
    makingCharges: Math.round(makingCharges * 100) / 100,
    batchCost: Math.round(batchCost * 100) / 100,
    lines,
  };
}

export function getIngredientBaseUnitLabel(ingredient: IngredientData): string {
  return normalizeUnitRelation(ingredient.unitRelation).baseUnit;
}

export function getIngredientUnitDisplay(ingredient: IngredientData) {
  const unitRelation = normalizeUnitRelation(ingredient.unitRelation);
  const purchaseLabel =
    unitRelation.purchaseUnit === 'kg'
      ? 'kg'
      : unitRelation.purchaseUnit === 'liter'
        ? 'liter'
        : 'pc';

  return {
    baseUnit: unitRelation.baseUnit,
    purchaseLabel,
    qtyHint: getRecipeQtyHint(ingredient),
  };
}

export function formatRecipeLineQtyDisplay(netAmount: number, ingredient?: IngredientData): string {
  if (!ingredient) return `${netAmount}`;
  const unitRelation = normalizeUnitRelation(ingredient.unitRelation);
  const qtyUnit = getDefaultRecipeQtyUnit(ingredient.unitRelation);
  const formatted = formatQtyForUnit(netAmount, qtyUnit, unitRelation.conversionRatio);
  return `${formatted} ${qtyUnit}`;
}

export function parseRecipeNameYield(name: string): { amount: number; unit: 'g' | 'ml' | 'pcs' } | null {
  const match = name.trim().match(/^(\d+(?:\.\d+)?)\s*(kg|g|l|ml|pc|pcs|piece|pieces)/i);
  if (!match) return null;

  const value = Number(match[1]);
  const unitRaw = match[2].toLowerCase();

  if (unitRaw === 'kg') return { amount: value * 1000, unit: 'g' };
  if (unitRaw === 'g') return { amount: value, unit: 'g' };
  if (unitRaw === 'l') return { amount: value * 1000, unit: 'ml' };
  if (unitRaw === 'ml') return { amount: value, unit: 'ml' };
  return { amount: value, unit: 'pcs' };
}

/** Hidden backend field — parsed from name like "1kg Biryani", else 1 batch. */
export function resolveBatchYieldFromName(name: string): {
  batchYieldAmount: number;
  batchYieldUnit: 'g' | 'ml' | 'pcs';
  costingMode: 'weight' | 'piece';
} {
  const parsed = parseRecipeNameYield(name);
  if (parsed) {
    return {
      batchYieldAmount: parsed.amount,
      batchYieldUnit: parsed.unit,
      costingMode: parsed.unit === 'pcs' ? 'piece' : 'weight',
    };
  }
  return { batchYieldAmount: 1, batchYieldUnit: 'g', costingMode: 'weight' };
}
