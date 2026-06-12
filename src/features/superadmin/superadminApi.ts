import { baseApi } from '../../services/api';

export interface TenantOwner {
  id: string;
  name: string;
  email: string;
  status: 'active' | 'deactivated';
}

export interface TenantData {
  _id: string;
  businessName: string;
  ownerId: TenantOwner;
  status: 'active' | 'deactivated';
  createdAt: string;
}

export const superadminApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getTenants: builder.query<{ success: boolean; tenants: TenantData[] }, void>({
      query: () => '/auth/admin/tenants',
      providesTags: ['Tenant'],
    }),
    toggleTenantStatus: builder.mutation<{ success: boolean; message: string; tenant: TenantData }, { id: string; status: 'active' | 'deactivated' }>({
      query: ({ id, status }) => ({
        url: `/auth/admin/tenants/${id}/status`,
        method: 'PUT',
        body: { status },
      }),
      invalidatesTags: ['Tenant'],
    }),
    createTenant: builder.mutation<{ success: boolean; message: string; user: any }, { name: string; email: string; password: string; businessName: string }>({
      query: (body) => ({
        url: '/auth/admin/tenants',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Tenant'],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetTenantsQuery,
  useToggleTenantStatusMutation,
  useCreateTenantMutation,
} = superadminApi;
