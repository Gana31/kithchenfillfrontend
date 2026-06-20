import { baseApi } from '../../services/api';
import type { SortOption } from './inventoryUtils';

export const INGREDIENTS_PAGE_SIZE = 25;

export interface IngredientsQueryArgs {
  page: number;
  limit: number;
  search: string;
  sortBy: SortOption;
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

export interface StockBatch {
  purchaseDate: string;
  originalQuantity: number;
  remainingQuantity: number;
  costPerBaseUnit: number;
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
  batches: StockBatch[];
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
  purchaseCost: number;
  image?: string;
}

export interface UpdateIngredientPayload {
  name: string;
  category?: string;
  minThreshold: number;
  purchaseUnit: 'kg' | 'liter' | 'pack';
  baseUnit: 'g' | 'ml' | 'pcs';
  conversionRatio: number;
  currentStock: number;
  image?: string;
  purchaseUnitPrice?: number;
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

  const ingredients = Array.isArray(payload.ingredients) ? payload.ingredients : [];

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

export const inventoryApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getIngredients: builder.query<IngredientsPageResponse, IngredientsQueryArgs>({
      query: ({ page, limit, search, sortBy }) => ({
        url: '/ingredients',
        params: {
          page,
          limit,
          search: search || undefined,
          sortBy,
        },
      }),
      transformResponse: (response: unknown, _meta, arg) =>
        normalizeIngredientsResponse(response, arg),
      serializeQueryArgs: ({ queryArgs }) => `${queryArgs.search}|${queryArgs.sortBy}|${queryArgs.limit}`,
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
      forceRefetch: ({ currentArg, previousArg }) =>
        currentArg?.page !== previousArg?.page,
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
      invalidatesTags: ['Ingredient'],
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
  useDeleteIngredientMutation,
  useGetUploadSignatureQuery,
  useLazyGetUploadSignatureQuery,
} = inventoryApi;
export default inventoryApi;
