import React, { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useNavigation } from '@react-navigation/native';
import Card from '../../components/Card';
import ScreenContainer from '../../components/ScreenContainer';
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
import DateSelector from './components/DateSelector';
import KpiGrid from './components/KpiGrid';
import SalesTrendChart from './components/SalesTrendChart';
import PlatformChart from './components/PlatformChart';
import TopPlatesList from './components/TopPlatesList';
import { formatDateKey, formatInr, trendEndDateFromSelected, trendStartDateFromSelected } from './dashboardUtils';

export default function DashboardScreen() {
  const navigation = useNavigation<any>();
  const { primary, isDark } = useThemeColors();
  const tenantKey = useAppSelector(selectActiveTenantId);
  const [selectedDate, setSelectedDate] = useState(formatDateKey(new Date()));

  const trendRange = useMemo(
    () => ({
      startDate: trendStartDateFromSelected(selectedDate, 6),
      endDate: trendEndDateFromSelected(selectedDate),
      tenantKey,
    }),
    [selectedDate, tenantKey]
  );

  const queryOpts = { skip: !tenantKey };

  const { data: summaryData, isLoading: summaryLoading, isFetching, refetch } =
    useGetDailySummaryQuery({ date: selectedDate, tenantKey }, queryOpts);
  const { data: topPlatesData } = useGetTopPlatesQuery(
    { date: selectedDate, limit: 5, tenantKey },
    queryOpts
  );
  const { data: platformData } = useGetPlatformComparisonQuery(
    { date: selectedDate, tenantKey },
    queryOpts
  );
  const { data: trendData } = useGetSalesTrendQuery(trendRange, queryOpts);

  const summary = summaryData?.summary;

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <ScreenContainer scrollable contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 16 }}>
        <SpacedStack gap={16}>
          <DateSelector selectedDate={selectedDate} onChange={setSelectedDate} />

          {isFetching ? (
            <View className="flex-row items-center" style={{ gap: 8 }}>
              <ActivityIndicator size="small" color={primary} />
              <Text className="text-[10px] font-bold text-muted dark:text-muted-dark tracking-normal">
                Updating dashboard...
              </Text>
            </View>
          ) : null}

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
      </ScreenContainer>
    </>
  );
}
