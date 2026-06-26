import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import Card from '../../components/Card';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useAppDispatch } from '../../store/store';
import { showToast } from '../../store/toastSlice';
import ScreenContainer from '../../components/ScreenContainer';
import { useCreateManualOrderMutation } from './ordersApi';
import { useGetDailySummaryQuery } from '../dashboard/analyticsApi';
import { useGetCounterMenuQuery, CounterMenuItem } from '../recipes/recipesApi';
import { formatDateKey, formatInr } from '../dashboard/dashboardUtils';

function menuIcon(item: CounterMenuItem): string {
  const label = `${item.recipeName} ${item.name}`.toLowerCase();
  if (label.includes('biryani')) return '🍛';
  if (label.includes('momo')) return '🥟';
  if (label.includes('butter') || label.includes('chicken')) return '🍗';
  if (label.includes('paneer')) return '🧀';
  if (label.includes('rice')) return '🍚';
  return item.costingMode === 'piece' ? '🥟' : '🍛';
}

export default function CounterScreen({ navigation }: any) {
  const dispatch = useAppDispatch();
  const { primary, muted, isDark } = useThemeColors();
  const today = formatDateKey(new Date());
  const { data: summaryData, refetch: refetchSummary } = useGetDailySummaryQuery(today);
  const { data: menuData, isLoading: menuLoading, isFetching, refetch: refetchMenu } = useGetCounterMenuQuery();
  const [createManualOrder, { isLoading: saving }] = useCreateManualOrderMutation();

  const summary = summaryData?.summary;
  const todaysTotal = summary?.grossRevenue ?? 0;
  const menuItems = menuData?.items ?? [];

  const refetchAll = () => {
    refetchSummary();
    refetchMenu();
  };

  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          onPress={refetchAll}
          activeOpacity={0.7}
          className="w-10 h-10 rounded-xl bg-card dark:bg-card-dark border border-border dark:border-border-dark justify-center items-center mr-6 shadow-sm"
        >
          <Ionicons name="refresh-outline" size={18} color={primary} />
        </TouchableOpacity>
      ),
    });
  }, [navigation, primary]);

  const handleLogSale = async (item: CounterMenuItem) => {
    try {
      await createManualOrder({
        items: [
          {
            recipeId: item.recipeId,
            portionId: item.portionId,
            quantity: 1,
          },
        ],
        commissionCut: 0,
      }).unwrap();

      dispatch(
        showToast({
          title: 'Plate logged',
          message: `1× ${item.name} · profit ${formatInr(item.profitPerUnit)}`,
          type: 'success',
        })
      );
    } catch (err: any) {
      dispatch(
        showToast({
          title: 'Log failed',
          message: err?.data?.error || 'Could not save sale.',
          type: 'error',
        })
      );
    }
  };

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <ScreenContainer
        scrollable
        contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 16 }}
        scrollProps={{
          refreshControl: (
            <RefreshControl refreshing={isFetching && !menuLoading} onRefresh={refetchAll} tintColor={primary} />
          ),
        }}
      >
        <Card className="mb-6 p-5">
          <Text className="text-xs text-muted dark:text-muted-dark font-bold uppercase tracking-wider">
            Today&apos;s counter sales
          </Text>
          <Text className="text-3xl font-black text-text dark:text-text-dark mt-1">{formatInr(todaysTotal)}</Text>
          <View className="mt-3 pt-3 border-t border-border/20 dark:border-border-dark/20 flex-row justify-between">
            <Text className="text-xs text-muted dark:text-muted-dark">Making cost</Text>
            <Text className="text-xs font-bold text-red-500">{formatInr(summary?.makingCost ?? 0)}</Text>
          </View>
          <View className="mt-1 flex-row justify-between">
            <Text className="text-xs text-muted dark:text-muted-dark">Net profit</Text>
            <Text className="text-xs font-bold text-emerald-500">{formatInr(summary?.netProfit ?? 0)}</Text>
          </View>
        </Card>

        <Text className="text-lg font-black text-text dark:text-text-dark mb-4">Quick counter plates</Text>

        {menuLoading ? (
          <View className="py-12 items-center">
            <ActivityIndicator size="large" color={primary} />
            <Text className="text-sm text-muted dark:text-muted-dark mt-3">Loading menu from recipes…</Text>
          </View>
        ) : menuItems.length === 0 ? (
          <Card className="p-6 items-center mb-8">
            <Ionicons name="restaurant-outline" size={36} color={muted} />
            <Text className="text-base font-black text-text dark:text-text-dark mt-3">No plates on menu</Text>
            <Text className="text-xs text-muted dark:text-muted-dark text-center mt-1 leading-relaxed">
              Add recipes in the Recipes tab first. Each portion will appear here with live costs from inventory.
            </Text>
          </Card>
        ) : (
          <View className="flex-row flex-wrap justify-between mb-8" style={{ gap: 16 }}>
            {menuItems.map((item) => (
              <TouchableOpacity
                key={item.itemId}
                onPress={() => handleLogSale(item)}
                disabled={saving}
                activeOpacity={0.8}
                style={{ width: '47%' }}
              >
                <Card className="p-4 items-center border border-border/40 dark:border-border-dark/40">
                  {saving ? (
                    <ActivityIndicator size="small" color={primary} style={{ marginBottom: 8 }} />
                  ) : (
                    <Text className="text-3xl mb-2">{menuIcon(item)}</Text>
                  )}
                  <Text className="text-[10px] text-muted dark:text-muted-dark font-bold uppercase">
                    {item.recipeName}
                  </Text>
                  <Text className="text-xs font-black text-text dark:text-text-dark text-center leading-tight min-h-[32px] mt-1">
                    {item.name}
                  </Text>
                  <Text className="text-[10px] text-muted dark:text-muted-dark mt-0.5">{item.portionLabel}</Text>
                  <Text className="text-sm font-extrabold text-primary mt-2">{formatInr(item.price)}</Text>
                  <Text className="text-[9px] text-muted dark:text-muted-dark mt-1">
                    cost {formatInr(item.makingCost)}
                  </Text>
                </Card>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScreenContainer>
    </>
  );
}
