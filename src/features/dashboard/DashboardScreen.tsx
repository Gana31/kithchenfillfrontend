import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Card from '../../components/Card';
import PageScrollView from '../../components/PageScrollView';
import SpacedStack from '../../components/SpacedStack';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useAppSelector } from '../../store/store';
import { selectActiveTenantId } from '../auth/authSlice';
import {
  useGetDailySummaryQuery,
  useGetTopPlatesQuery,
  useGetPlatformComparisonQuery,
  useGetSalesTrendQuery,
} from './analyticsApi';
import { useGetUdhaarsQuery } from '../udhaar/udhaarApi';
import DateSelector from './components/DateSelector';
import KpiGrid from './components/KpiGrid';
import SalesTrendChart from './components/SalesTrendChart';
import PlatformChart from './components/PlatformChart';
import TopPlatesList from './components/TopPlatesList';
import { formatDateKey, formatInr, trendEndDateFromSelected, trendStartDateFromSelected } from './dashboardUtils';

export default function DashboardScreen() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { primary, isDark, background } = useThemeColors();
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
  const { data: udhaarRes } = useGetUdhaarsQuery(undefined, queryOpts);

  const summary = summaryData?.summary;

  const totalUnpaidDues = useMemo(() => {
    if (!udhaarRes?.udhaars) return 0;
    return udhaarRes.udhaars
      .filter((u) => u.status === 'unpaid')
      .reduce((sum, u) => sum + u.amount, 0);
  }, [udhaarRes]);

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <View style={{ flex: 1, backgroundColor: 'transparent' }}>
        <PageScrollView
          transparent
          contentContainerStyle={{
            paddingHorizontal: 24,
            paddingTop: 16,
            paddingBottom: insets.bottom + 110,
          }}
        >
          <SpacedStack gap={16}>
            <DateSelector selectedDate={selectedDate} onChange={setSelectedDate} />

            <View>
              <Text className="text-lg font-semibold text-text dark:text-text-dark mb-4">
                Kitchen pulse
              </Text>
              <KpiGrid summary={summary} isLoading={summaryLoading} />
            </View>

            <SalesTrendChart trend={trendData?.trend ?? []} />
            <PlatformChart comparison={platformData?.comparison ?? []} />
            <TopPlatesList plates={topPlatesData?.topPlates ?? []} />

            <Card className="p-5 items-center">
              <Text className="text-3xl mb-2">💸</Text>
              <Text className="text-sm font-semibold text-text dark:text-text-dark text-center">
                Manage Udhaar (Credits)
              </Text>
              <Text className="text-xs text-muted dark:text-muted-dark text-center mt-1 mb-3 leading-relaxed px-4">
                Track dues and payments from customers who eat today and pay later. Maintain their logs easily.
              </Text>

              {totalUnpaidDues > 0 ? (
                <View className="px-3 py-1.5 bg-red-500/10 border border-red-500/20 rounded-xl mb-4">
                  <Text className="text-xs font-bold text-red-600 dark:text-red-400">
                    Total Unpaid: {formatInr(totalUnpaidDues)}
                  </Text>
                </View>
              ) : (
                <View className="px-3 py-1.5 bg-green-500/10 border border-green-500/20 rounded-xl mb-4">
                  <Text className="text-xs font-bold text-green-600 dark:text-green-400">
                    All Cleared! 🎉
                  </Text>
                </View>
              )}

              <TouchableOpacity
                onPress={() => navigation.navigate('Udhaar')}
                className="w-full py-3 rounded-2xl bg-primary items-center"
              >
                <Text className="text-sm font-semibold text-white">Open Udhaar Logs</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => refetch()} className="mt-3">
                <Text className="text-[10px] font-semibold text-primary uppercase">Refresh data</Text>
              </TouchableOpacity>
            </Card>

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
          </SpacedStack>
        </PageScrollView>

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
