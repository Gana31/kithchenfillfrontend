import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Card from '../../components/Card';
import { SCROLL_LIST_PROPS, SCROLL_GAP_TOUCH } from '../../components/scrollUtils';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useAppSelector } from '../../store/store';
import { selectActiveTenantId } from '../auth/authSlice';
import {
  useGetDailySummaryQuery,
  useGetTopPlatesQuery,
  useGetPlatformComparisonQuery,
  useGetSalesTrendQuery,
} from './analyticsApi';
import DateSelector from './components/DateSelector';
import KpiGrid from './components/KpiGrid';
import SalesTrendChart from './components/SalesTrendChart';
import PlatformChart from './components/PlatformChart';
import TopPlatesList from './components/TopPlatesList';
import { formatDateKey, formatInr, trendEndDateFromSelected, trendStartDateFromSelected } from './dashboardUtils';

export default function DashboardScreen() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { primary, isDark } = useThemeColors();
  const tenantKey = useAppSelector(selectActiveTenantId);
  const [selectedDate, setSelectedDate] = useState(formatDateKey(new Date()));
  // Debounced date drives the API calls, so rapidly tapping through dates only
  // fetches once the user settles on a date (~1s), not for every day tapped.
  const [queryDate, setQueryDate] = useState(selectedDate);

  useEffect(() => {
    const timer = setTimeout(() => setQueryDate(selectedDate), 1000);
    return () => clearTimeout(timer);
  }, [selectedDate]);

  const trendRange = useMemo(
    () => ({
      startDate: trendStartDateFromSelected(queryDate, 6),
      endDate: trendEndDateFromSelected(queryDate),
      tenantKey,
    }),
    [queryDate, tenantKey]
  );

  const queryOpts = { skip: !tenantKey };

  const { data: summaryData, isLoading: summaryLoading, isFetching, refetch } =
    useGetDailySummaryQuery({ date: queryDate, tenantKey }, queryOpts);
  const { data: topPlatesData } = useGetTopPlatesQuery(
    { date: queryDate, limit: 5, tenantKey },
    queryOpts
  );
  const { data: platformData } = useGetPlatformComparisonQuery(
    { date: queryDate, tenantKey },
    queryOpts
  );
  const { data: trendData } = useGetSalesTrendQuery(trendRange, queryOpts);

  const summary = summaryData?.summary;

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <View style={{ flex: 1, backgroundColor: 'transparent' }}>
        <ScrollView
          style={[{ flex: 1 }, SCROLL_GAP_TOUCH]}
          contentContainerStyle={[
            { paddingHorizontal: 24, paddingTop: 16, paddingBottom: insets.bottom + 110 },
            SCROLL_GAP_TOUCH,
          ]}
          {...SCROLL_LIST_PROPS}
        >
          <View style={{ marginBottom: 16 }}>
            <DateSelector selectedDate={selectedDate} onChange={setSelectedDate} />
          </View>

          <View style={{ marginBottom: 16 }}>
            <Text className="text-lg font-semibold text-text dark:text-text-dark mb-4">
              Kitchen pulse
            </Text>
            <KpiGrid summary={summary} isLoading={summaryLoading} />
          </View>

          <View style={{ marginBottom: 16 }}>
            <SalesTrendChart trend={trendData?.trend ?? []} />
          </View>

          <View style={{ marginBottom: 16 }}>
            <PlatformChart comparison={platformData?.comparison ?? []} />
          </View>

          <View style={{ marginBottom: 16 }}>
            <TopPlatesList plates={topPlatesData?.topPlates ?? []} />
          </View>

          <View style={{ marginBottom: 16 }}>
            <Card className="p-5 items-center">
              <Text className="text-3xl mb-2">🍽️</Text>
              <Text className="text-sm font-semibold text-text dark:text-text-dark text-center">
                Log a sale from Counter
              </Text>
              <Text className="text-xs text-muted dark:text-muted-dark text-center mt-1 mb-4 leading-relaxed px-4">
                Each sale updates making cost, profit, and these charts for{' '}
                {selectedDate === formatDateKey(new Date()) ? 'today' : 'the selected day'}.
              </Text>
              <TouchableOpacity
                onPress={() => navigation.navigate('Counter')}
                className="w-full py-3 rounded-2xl bg-primary items-center"
              >
                <Text className="text-sm font-semibold text-white">Open Counter</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => refetch()} className="mt-3">
                <Text className="text-[10px] font-semibold text-primary uppercase">Refresh data</Text>
              </TouchableOpacity>
            </Card>
          </View>

          {summary ? (
            <Card className="p-4 bg-primary/5 border-primary/20">
              <Text className="text-[10px] font-semibold text-primary tracking-normal mb-1">
                Day snapshot
              </Text>
              <Text className="text-xs text-text dark:text-text-dark leading-relaxed">
                Revenue {formatInr(summary.grossRevenue)} · Cost {formatInr(summary.makingCost)} · Profit{' '}
                {formatInr(summary.netProfit)} · {summary.orderCount} orders logged.
              </Text>
            </Card>
          ) : null}
        </ScrollView>

        {isFetching || selectedDate !== queryDate ? (
          <View
            pointerEvents="none"
            style={{ position: 'absolute', top: 8, alignSelf: 'center' }}
            className="flex-row items-center bg-card dark:bg-card-dark border border-border dark:border-border-dark rounded-full px-3 py-1.5"
          >
            <ActivityIndicator size="small" color={primary} />
            <Text className="text-[10px] font-bold text-muted dark:text-muted-dark tracking-normal ml-2">
              Updating…
            </Text>
          </View>
        ) : null}
      </View>
    </>
  );
}
