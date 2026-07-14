import { baseApi } from '../../services/api';

export interface UdhaarData {
  _id: string;
  customerName: string;
  plateId?: string;
  plateName: string;
  amount: number;
  status: 'unpaid' | 'paid' | 'cancelled';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUdhaarPayload {
  customerName: string;
  plateId?: string;
  plateName: string;
  amount: number;
  status: 'unpaid' | 'paid' | 'cancelled';
  notes?: string;
}

export const udhaarApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getUdhaars: builder.query<{ success: boolean; udhaars: UdhaarData[] }, void>({
      query: () => '/udhaar',
      providesTags: (result) =>
        result
          ? [
              ...result.udhaars.map(({ _id }) => ({ type: 'Udhaar' as const, id: _id })),
              { type: 'Udhaar', id: 'LIST' },
            ]
          : [{ type: 'Udhaar', id: 'LIST' }],
    }),
    createUdhaar: builder.mutation<{ success: boolean; udhaar: UdhaarData }, CreateUdhaarPayload>({
      query: (body) => ({
        url: '/udhaar',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'Udhaar', id: 'LIST' }],
    }),
    updateUdhaar: builder.mutation<{ success: boolean; udhaar: UdhaarData }, { id: string; body: Partial<CreateUdhaarPayload> }>({
      query: ({ id, body }) => ({
        url: `/udhaar/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Udhaar', id },
        { type: 'Udhaar', id: 'LIST' },
      ],
    }),
    deleteUdhaar: builder.mutation<{ success: boolean }, string>({
      query: (id) => ({
        url: `/udhaar/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'Udhaar', id: 'LIST' }],
    }),
  }),
  overrideExisting: true,
});

export const {
  useGetUdhaarsQuery,
  useCreateUdhaarMutation,
  useUpdateUdhaarMutation,
  useDeleteUdhaarMutation,
} = udhaarApi;

export default udhaarApi;
