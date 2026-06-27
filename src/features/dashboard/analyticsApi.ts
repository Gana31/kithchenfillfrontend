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

export interface AnalyticsQueryScope {
  /** Included in RTK cache key only — scopes data per tenant workspace */
  tenantKey?: string | null;
}

export const analyticsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getDailySummary: builder.query<
      { success: boolean; summary: DailySummary },
      ({ date?: string } & AnalyticsQueryScope) | void
    >({
      query: (args) => ({
        url: '/analytics/daily',
        params: args?.date ? { date: args.date } : undefined,
      }),
      providesTags: [{ type: 'Order', id: 'ANALYTICS' }],
    }),
    getTopPlates: builder.query<
      { success: boolean; topPlates: TopPlateRow[] },
      ({ date?: string; limit?: number } & AnalyticsQueryScope) | void
    >({
      query: (args) => ({
        url: '/analytics/top-plates',
        params: { date: args?.date, limit: args?.limit ?? 5 },
      }),
      providesTags: [{ type: 'Order', id: 'ANALYTICS' }],
    }),
    getPlatformComparison: builder.query<
      { success: boolean; comparison: PlatformRow[] },
      ({ date?: string } & AnalyticsQueryScope) | void
    >({
      query: (args) => ({
        url: '/analytics/platform-comparison',
        params: args?.date ? { date: args.date } : undefined,
      }),
      providesTags: [{ type: 'Order', id: 'ANALYTICS' }],
    }),
    getSalesTrend: builder.query<
      { success: boolean; trend: SalesTrendRow[] },
      ({ startDate?: string; endDate?: string } & AnalyticsQueryScope) | void
    >({
      query: (args) => ({
        url: '/analytics/sales-trend',
        params: { startDate: args?.startDate, endDate: args?.endDate },
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
