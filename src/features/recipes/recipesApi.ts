import { baseApi } from '../../services/api';

export type CostingMode = 'weight' | 'piece';
export type YieldUnit = 'g' | 'ml' | 'pcs';

export interface RecipeIngredientLine {
  ingredientId: string;
  netAmount: number;
  wastagePercent: number;
}

export interface RecipePortion {
  portionId: string;
  name: string;
  amount: number;
  unit: YieldUnit;
  sellPrice: number;
}

export interface MakingCharges {
  fixedAmount: number;
  percentOfIngredients: number;
}

export interface CustomCostLine {
  label: string;
  amount: number;
}

export interface ComputedPortion extends RecipePortion {
  makingCost: number;
  profitPerUnit: number;
}

export interface RecipeCosting {
  ingredientCost: number;
  extraWastageCost?: number;
  customCostTotal?: number;
  makingCharges: number;
  batchCost: number;
  batchYieldAmount: number;
  batchYieldUnit: YieldUnit;
  costingMode: CostingMode;
  portions: ComputedPortion[];
}

export interface RecipeData {
  _id: string;
  name: string;
  costingMode: CostingMode;
  batchYieldAmount: number;
  batchYieldUnit: YieldUnit;
  ingredientsUsed: RecipeIngredientLine[];
  makingCharges: MakingCharges;
  customCostLines?: CustomCostLine[];
  extraWastagePercent?: number;
  portions: RecipePortion[];
  costing?: RecipeCosting;
}

export interface CounterMenuItem {
  recipeId: string;
  portionId: string;
  itemId: string;
  name: string;
  recipeName: string;
  price: number;
  makingCost: number;
  profitPerUnit: number;
  costingMode: CostingMode;
  portionLabel: string;
}

export type CreateRecipePayload = {
  name: string;
  costingMode: CostingMode;
  batchYieldAmount: number;
  batchYieldUnit: YieldUnit;
  ingredientsUsed: RecipeIngredientLine[];
  makingCharges: MakingCharges;
  customCostLines?: CustomCostLine[];
  extraWastagePercent?: number;
  portions?: Array<Omit<RecipePortion, 'portionId'> & { portionId?: string }>;
};

export type UpdateRecipePayload = CreateRecipePayload;

export type RecipeCostPreviewPayload = CreateRecipePayload;

export const recipesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getRecipes: builder.query<{ success: boolean; recipes: RecipeData[] }, void>({
      query: () => '/recipes',
      providesTags: [{ type: 'RecipeMapping', id: 'LIST' }],
    }),
    getCounterMenu: builder.query<{ success: boolean; items: CounterMenuItem[] }, void>({
      query: () => '/recipes/counter-menu',
      providesTags: [{ type: 'RecipeMapping', id: 'COUNTER' }],
    }),
    createRecipe: builder.mutation<{ success: boolean; recipe: RecipeData; costing?: RecipeCosting }, CreateRecipePayload>({
      query: (body) => ({
        url: '/recipes',
        method: 'POST',
        body,
      }),
      invalidatesTags: [
        { type: 'RecipeMapping', id: 'LIST' },
        { type: 'RecipeMapping', id: 'COUNTER' },
      ],
    }),
    updateRecipe: builder.mutation<
      { success: boolean; recipe: RecipeData },
      { id: string; body: UpdateRecipePayload }
    >({
      query: ({ id, body }) => ({
        url: `/recipes/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: [
        { type: 'RecipeMapping', id: 'LIST' },
        { type: 'RecipeMapping', id: 'COUNTER' },
      ],
    }),
    previewRecipeCost: builder.mutation<{ success: boolean; costing: RecipeCosting }, RecipeCostPreviewPayload>({
      query: (body) => ({
        url: '/recipes/preview-cost',
        method: 'POST',
        body,
      }),
    }),
    deleteRecipe: builder.mutation<{ success: boolean }, string>({
      query: (id) => ({
        url: `/recipes/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: [
        { type: 'RecipeMapping', id: 'LIST' },
        { type: 'RecipeMapping', id: 'COUNTER' },
      ],
    }),
  }),
  overrideExisting: true,
});

export const {
  useGetRecipesQuery,
  useGetCounterMenuQuery,
  useCreateRecipeMutation,
  useUpdateRecipeMutation,
  usePreviewRecipeCostMutation,
  useDeleteRecipeMutation,
} = recipesApi;

export default recipesApi;
