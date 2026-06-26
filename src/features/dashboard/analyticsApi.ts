import { baseApi } from '../../services/api';

export interface DailySummary {
  date: string;
  grossRevenue: number;
  netRevenue: number;
  makingCost: number;
  netProfit: number;
  marginPercent: number;
  orderCount: number;
  lowStockCount: number;
}

export interface TopPlateRow {
  name: string;
  quantitySold: number;
  grossRevenue: number;
}

export interface PlatformRow {
  platform: string;
  gross: number;
  net: number;
  profit: number;
  orderCount: number;
}

export interface SalesTrendRow {
  date: string;
  gross: number;
  net: number;
  profit: number;
  makingCost: number;
  orders: number;
}

export const analyticsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getDailySummary: builder.query<{ success: boolean; summary: DailySummary }, string | undefined>({
      query: (date) => ({
        url: '/analytics/daily',
        params: date ? { date } : undefined,
      }),
      providesTags: [{ type: 'Order', id: 'ANALYTICS' }],
    }),
    getTopPlates: builder.query<
      { success: boolean; topPlates: TopPlateRow[] },
      { date?: string; limit?: number }
    >({
      query: ({ date, limit = 5 }) => ({
        url: '/analytics/top-plates',
        params: { date, limit },
      }),
      providesTags: [{ type: 'Order', id: 'ANALYTICS' }],
    }),
    getPlatformComparison: builder.query<
      { success: boolean; comparison: PlatformRow[] },
      string | undefined
    >({
      query: (date) => ({
        url: '/analytics/platform-comparison',
        params: date ? { date } : undefined,
      }),
      providesTags: [{ type: 'Order', id: 'ANALYTICS' }],
    }),
    getSalesTrend: builder.query<
      { success: boolean; trend: SalesTrendRow[] },
      { startDate?: string; endDate?: string }
    >({
      query: ({ startDate, endDate }) => ({
        url: '/analytics/sales-trend',
        params: { startDate, endDate },
      }),
      providesTags: [{ type: 'Order', id: 'ANALYTICS' }],
    }),
  }),
  overrideExisting: true,
});

export const {
  useGetDailySummaryQuery,
  useGetTopPlatesQuery,
  useGetPlatformComparisonQuery,
  useGetSalesTrendQuery,
} = analyticsApi;

export default analyticsApi;
