import { baseApi } from '../../services/api';
import { RecipeData } from '../recipes/recipesApi';

export interface PlateCustomItem {
  name: string;
  price: number;
  quantity: number;
  ingredientId?: string;
}

export interface PlateData {
  _id: string;
  name: string;
  recipeId?: string;
  recipe?: RecipeData;
  size: number;
  unit: 'g' | 'ml' | 'pcs';
  customFoodCost?: number;
  customItems: PlateCustomItem[];
  sellPrice: number;
  recipeName?: string;
  computedPortionCost?: number;
  computedPackagingCost?: number;
  computedTotalCost?: number;
  computedProfit?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreatePlatePayload {
  name: string;
  recipeId?: string;
  size: number;
  unit: 'g' | 'ml' | 'pcs';
  customFoodCost?: number;
  customItems: PlateCustomItem[];
  sellPrice: number;
}

export const platesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getPlates: builder.query<{ success: boolean; plates: PlateData[] }, void>({
      query: () => '/plates',
      providesTags: (result) =>
        result
          ? [
              ...result.plates.map(({ _id }) => ({ type: 'Plate' as const, id: _id })),
              { type: 'Plate', id: 'LIST' },
            ]
          : [{ type: 'Plate', id: 'LIST' }],
    }),
    createPlate: builder.mutation<{ success: boolean; plate: PlateData }, CreatePlatePayload>({
      query: (body) => ({
        url: '/plates',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'Plate', id: 'LIST' }],
    }),
    updatePlate: builder.mutation<{ success: boolean; plate: PlateData }, { id: string; body: CreatePlatePayload }>({
      query: ({ id, body }) => ({
        url: `/plates/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Plate', id },
        { type: 'Plate', id: 'LIST' },
      ],
    }),
    deletePlate: builder.mutation<{ success: boolean }, string>({
      query: (id) => ({
        url: `/plates/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'Plate', id: 'LIST' }],
    }),
  }),
  overrideExisting: true,
});

export const {
  useGetPlatesQuery,
  useCreatePlateMutation,
  useUpdatePlateMutation,
  useDeletePlateMutation,
} = platesApi;

export default platesApi;
