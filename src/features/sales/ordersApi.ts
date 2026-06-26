import { baseApi } from '../../services/api';

export interface ManualOrderItem {
  recipeId?: string;
  portionId?: string;
  itemId?: string;
  name?: string;
  quantity: number;
  price?: number;
  makingCost?: number;
}

export interface ManualOrderPayload {
  items: ManualOrderItem[];
  commissionCut?: number;
}

export const ordersApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    createManualOrder: builder.mutation<{ success: boolean; message: string }, ManualOrderPayload>({
      query: (body) => ({
        url: '/orders/manual',
        method: 'POST',
        body,
      }),
      invalidatesTags: [
        { type: 'Order', id: 'ANALYTICS' },
        { type: 'Order', id: 'LIST' },
      ],
    }),
  }),
  overrideExisting: true,
});

export const { useCreateManualOrderMutation } = ordersApi;

export default ordersApi;
