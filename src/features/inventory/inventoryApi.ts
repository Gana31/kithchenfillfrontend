import { baseApi } from '../../services/api';

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

export interface IngredientData {
  _id: string;
  tenantId: string;
  restaurantId: string;
  name: string;
  currentStock: number;
  minThreshold: number;
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
  minThreshold: number;
  purchaseUnit: 'kg' | 'liter' | 'pack';
  baseUnit: 'g' | 'ml' | 'pcs';
  conversionRatio: number;
  currentStock: number;
  image?: string;
}

export interface UploadSignatureResponse {
  success: boolean;
  signature: string;
  timestamp: number;
  apiKey: string;
  uploadUrl: string;
  folder: string;
}

export const inventoryApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getIngredients: builder.query<{ success: boolean; ingredients: IngredientData[] }, void>({
      query: () => '/ingredients',
      providesTags: ['Ingredient'],
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
  useGetUploadSignatureQuery,
  useLazyGetUploadSignatureQuery,
} = inventoryApi;
export default inventoryApi;
