import { RecipeData } from './recipesApi';
import { getDefaultRecipeQtyUnit, RecipeQtyUnit } from '../inventory/ingredientFormUtils';
import { IngredientData } from '../inventory/inventoryApi';

export type LineKind = 'stock' | 'custom';

export interface RecipeLine {
  id: string;
  kind: LineKind;
  ingredientId: string;
  netAmount: string;
  qtyUnit: RecipeQtyUnit;
  customLabel: string;
  customAmount: string;
}

let lineCounter = 0;
export const newRecipeLineId = () => `line-${++lineCounter}`;

export const emptyStockLine = (): RecipeLine => ({
  id: newRecipeLineId(),
  kind: 'stock',
  ingredientId: '',
  netAmount: '',
  qtyUnit: 'g',
  customLabel: '',
  customAmount: '',
});

export const emptyCustomLine = (): RecipeLine => ({
  id: newRecipeLineId(),
  kind: 'custom',
  ingredientId: '',
  netAmount: '',
  qtyUnit: 'g',
  customLabel: '',
  customAmount: '',
});

export function createEmptyFormState() {
  return {
    name: '',
    extraWastagePercent: '5',
    lines: [emptyStockLine()] as RecipeLine[],
    formError: '',
  };
}

export function recipeToFormState(recipe: RecipeData, ingredients: IngredientData[] = []) {
  const stockLines: RecipeLine[] = recipe.ingredientsUsed.map((row) => {
    const ingredient = ingredients.find((item) => item._id === String(row.ingredientId));
    const qtyUnit = ingredient ? getDefaultRecipeQtyUnit(ingredient.unitRelation) : 'g';

    return {
      id: newRecipeLineId(),
      kind: 'stock',
      ingredientId: String(row.ingredientId),
      netAmount: String(row.netAmount),
      qtyUnit,
      customLabel: '',
      customAmount: '',
    };
  });

  const customLines: RecipeLine[] = (recipe.customCostLines ?? []).map((row) => ({
    id: newRecipeLineId(),
    kind: 'custom',
    ingredientId: '',
    netAmount: '',
    qtyUnit: 'g' as RecipeQtyUnit,
    customLabel: row.label,
    customAmount: String(row.amount),
  }));

  const lines = [...stockLines, ...customLines];

  return {
    name: recipe.name,
    extraWastagePercent: String(recipe.extraWastagePercent ?? 0),
    lines: lines.length > 0 ? lines : [emptyStockLine()],
    formError: '',
  };
}

export function filterRecipesBySearch(recipes: RecipeData[], query: string): RecipeData[] {
  const q = query.trim().toLowerCase();
  if (!q) return recipes;
  return recipes.filter((recipe) => recipe.name.toLowerCase().includes(q));
}
