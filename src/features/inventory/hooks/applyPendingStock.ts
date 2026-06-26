import { IngredientData } from '../inventoryApi';
import { computeStockLevel } from '../inventoryUtils';

/** UI-only overlay — cache is updated only after the API confirms. */
export function applyPendingStock(ingredient: IngredientData, pendingDelta: number): IngredientData {
  if (pendingDelta === 0) return ingredient;

  const currentStock = Math.max(0, ingredient.currentStock + pendingDelta);
  return {
    ...ingredient,
    currentStock,
    stockLevel: computeStockLevel(currentStock, ingredient.minThreshold),
  };
}
