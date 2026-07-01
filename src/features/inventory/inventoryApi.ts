import { baseApi } from '../../services/api';
import type { SortOption, StockLevelFilter } from './inventoryUtils';
import { isStockLevelSortOption, normalizeIngredientRecord } from './inventoryUtils';

export const INGREDIENTS_PAGE_SIZE = 100;
/** Single request when sorting by stock level — avoids reorder flicker while pages load. */
export const STOCK_SORT_FETCH_LIMIT = 500;

export interface IngredientsQueryArgs {
  page: number;
  limit: number;
  search: string;
  sortBy: SortOption;
  stockFilter: StockLevelFilter;
}

export interface IngredientsPageResponse {
  success: boolean;
  ingredients: IngredientData[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
  lowStockCount: number;
}

export interface UnitRelation {
  purchaseUnit: 'kg' | 'liter' | 'pack';
  baseUnit: 'g' | 'ml' | 'pcs';
  conversionRatio: number;
}

export type StockLevel = 'low' | 'average' | 'high';

export interface IngredientData {
  _id: string;
  tenantId: string;
  restaurantId: string;
  name: string;
  category?: string;
  currentStock: number;
  minThreshold: number;
  stockLevel?: StockLevel;
  unitRelation: UnitRelation;
  /** Price per purchase unit (₹/kg, ₹/L, ₹/pack) */
  purchasePrice: number;
  image: string | null;
  alerts: {
    isAcknowledged: boolean;
    snoozedUntil: string | null;
  };
}

export interface CreateIngredientPayload {
  name: string;
  category?: string;
  minThreshold: number;
  purchaseUnit: 'kg' | 'liter' | 'pack';
  baseUnit: 'g' | 'ml' | 'pcs';
  conversionRatio: number;
  initialQuantity: number;
  purchasePrice: number;
  image?: string;
}

export interface UpdateIngredientPayload {
  name?: string;
  category?: string;
  minThreshold?: number;
  purchaseUnit?: 'kg' | 'liter' | 'pack';
  baseUnit?: 'g' | 'ml' | 'pcs';
  conversionRatio?: number;
  currentStock?: number;
  image?: string | null;
  purchasePrice?: number;
}

export interface AdjustStockPayload {
  id: string;
  delta: number;
  purchasePrice?: number;
}

export interface AdjustStockResponse {
  success: boolean;
  message: string;
  ingredient: IngredientData;
  lowStockCount: number;
}

export interface UploadSignatureResponse {
  success: boolean;
  signature: string;
  timestamp: number;
  apiKey: string;
  uploadUrl: string;
  folder: string;
}

function normalizeIngredientsResponse(
  response: unknown,
  arg: IngredientsQueryArgs
): IngredientsPageResponse {
  const payload = (response ?? {}) as {
    success?: boolean;
    ingredients?: IngredientData[];
    pagination?: IngredientsPageResponse['pagination'];
    lowStockCount?: number;
  };

  const ingredients = (Array.isArray(payload.ingredients) ? payload.ingredients : []).map(
    normalizeIngredientRecord
  );

  if (payload.pagination && typeof payload.pagination.hasMore === 'boolean') {
    return {
      success: payload.success ?? true,
      ingredients,
      pagination: payload.pagination,
      lowStockCount: payload.lowStockCount ?? 0,
    };
  }

  // Legacy API: returns full list without pagination metadata
  if (arg.page > 1) {
    return {
      success: payload.success ?? true,
      ingredients: [],
      pagination: {
        page: arg.page,
        limit: arg.limit,
        total: ingredients.length,
        hasMore: false,
      },
      lowStockCount: 0,
    };
  }

  return {
    success: payload.success ?? true,
    ingredients,
    pagination: {
      page: 1,
      limit: arg.limit,
      total: ingredients.length,
      hasMore: false,
    },
    lowStockCount:
      payload.lowStockCount ??
      ingredients.filter((item) => item.currentStock <= item.minThreshold).length,
  };
}

function dedupeIngredients(items: IngredientData[]): IngredientData[] {
  const seen = new Set<string>();
  const unique: IngredientData[] = [];

  for (const item of items) {
    if (!item?._id || seen.has(item._id)) {
      continue;
    }
    seen.add(item._id);
    unique.push(item);
  }

  return unique;
}

function patchIngredientInCache(
  draft: IngredientsPageResponse,
  ingredient: IngredientData,
  lowStockCount?: number
) {
  const index = draft.ingredients.findIndex((item) => item._id === ingredient._id);
  if (index >= 0) {
    const previous = draft.ingredients[index];
    const merged = normalizeIngredientRecord({ ...previous, ...ingredient });
    draft.ingredients[index] = {
      ...merged,
      purchasePrice: merged.purchasePrice > 0 ? merged.purchasePrice : previous.purchasePrice,
      image: ingredient.image ?? previous.image,
    };
  }
  if (typeof lowStockCount === 'number') {
    draft.lowStockCount = lowStockCount;
  }
}

function ingredientsCacheKey(args: IngredientsQueryArgs): string {
  const stockLevelSort = isStockLevelSortOption(args.sortBy);
  const sortKey = stockLevelSort ? 'stock-level' : args.sortBy;
  const filterKey = args.stockFilter !== 'all' ? args.stockFilter : 'all';
  return `${args.search}|${sortKey}|${filterKey}|${args.limit}`;
}

export const inventoryApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getIngredients: builder.query<IngredientsPageResponse, IngredientsQueryArgs>({
      query: ({ page, limit, search, sortBy, stockFilter }) => ({
        url: '/ingredients',
        params: {
          page,
          limit,
          search: search || undefined,
          stockLevel: stockFilter !== 'all' ? stockFilter : undefined,
          sortBy:
            sortBy === 'stock-asc' || sortBy === 'stock-desc' ? 'name-asc' : sortBy,
        },
      }),
      transformResponse: (response: unknown, _meta, arg) =>
        normalizeIngredientsResponse(response, arg),
      serializeQueryArgs: ({ queryArgs }) => ingredientsCacheKey(queryArgs),
      merge: (currentCache, newItems, { arg }) => {
        if (arg.page === 1 || !currentCache?.ingredients) {
          return {
            ...newItems,
            ingredients: dedupeIngredients(newItems.ingredients),
          };
        }
        return {
          ...newItems,
          ingredients: dedupeIngredients([...currentCache.ingredients, ...newItems.ingredients]),
        };
      },
      forceRefetch: ({ currentArg, previousArg }) => {
        if (!currentArg || !previousArg) return true;
        if (ingredientsCacheKey(currentArg) !== ingredientsCacheKey(previousArg)) return true;
        return currentArg.page !== previousArg.page;
      },
      keepUnusedDataFor: 300,
      providesTags: (result) =>
        result
          ? [
              ...result.ingredients.map(({ _id }) => ({ type: 'Ingredient' as const, id: _id })),
              { type: 'Ingredient' as const, id: 'LIST' },
            ]
          : [{ type: 'Ingredient' as const, id: 'LIST' }],
    }),
    createIngredient: builder.mutation<{ success: boolean; message: string; ingredient: IngredientData }, CreateIngredientPayload>({
      query: (body) => ({
        url: '/ingredients',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Ingredient'],
    }),
    updateIngredient: builder.mutation<{ success: boolean; message: string; ingredient: IngredientData }, { id: string; body: UpdateIngredientPayload }>({
      query: ({ id, body }) => ({
        url: `/ingredients/${id}`,
        method: 'PUT',
        body,
      }),
      async onQueryStarted(_arg, { dispatch, queryFulfilled, getState }) {
        try {
          const { data } = await queryFulfilled;
          for (const args of inventoryApi.util.selectCachedArgsForQuery(getState(), 'getIngredients')) {
            dispatch(
              inventoryApi.util.updateQueryData('getIngredients', args, (draft) => {
                patchIngredientInCache(draft, data.ingredient);
              })
            );
          }
        } catch {
          // Toast handled in UI
        }
      },
      invalidatesTags: (_result, _error, { id }) => [{ type: 'Ingredient', id }],
    }),
    adjustStock: builder.mutation<AdjustStockResponse, AdjustStockPayload>({
      query: ({ id, delta, purchasePrice }) => ({
        url: `/ingredients/${id}/stock`,
        method: 'PATCH',
        body: { delta, ...(purchasePrice !== undefined ? { purchasePrice } : {}) },
      }),
      async onQueryStarted(_arg, { dispatch, queryFulfilled, getState }) {
        try {
          const { data } = await queryFulfilled;
          for (const args of inventoryApi.util.selectCachedArgsForQuery(getState(), 'getIngredients')) {
            dispatch(
              inventoryApi.util.updateQueryData('getIngredients', args, (draft) => {
                patchIngredientInCache(draft, data.ingredient, data.lowStockCount);
              })
            );
          }
        } catch {
          // Error toast handled by useDebouncedStockAdjust
        }
      },
    }),
    deleteIngredient: builder.mutation<{ success: boolean; message: string }, string>({
      query: (id) => ({
        url: `/ingredients/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Ingredient'],
    }),
    getUploadSignature: builder.query<UploadSignatureResponse, void>({
      query: () => '/ingredients/upload-signature',
    }),
  }),
  overrideExisting: true,
});

export const {
  useGetIngredientsQuery,
  useCreateIngredientMutation,
  useUpdateIngredientMutation,
  useAdjustStockMutation,
  useDeleteIngredientMutation,
  useLazyGetUploadSignatureQuery,
} = inventoryApi;
