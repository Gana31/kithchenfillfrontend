import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import SearchBar from '../../components/SearchBar';
import { useThemeColors } from '../../hooks/useThemeColors';
import ScreenContainer from '../../components/ScreenContainer';
import FloatingActionButton from '../../components/FloatingActionButton';
import { LoadingView, ErrorState, EmptyStateCard } from '../../components/AsyncStateViews';
import { ScrollGap } from '../../components/SpacedStack';
import { useGetPlatesQuery, useDeletePlateMutation, PlateData } from './platesApi';
import { useAppDispatch } from '../../store/store';
import { showToast } from '../../store/toastSlice';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { formatInr } from '../dashboard/dashboardUtils';
import { SCROLL_LIST_PROPS, LIST_VIRTUALIZATION_PROPS } from '../../components/scrollUtils';

export default function PlatesScreen() {
  const navigation = useNavigation<any>();
  const dispatch = useAppDispatch();
  const { primary, muted, text, card, border, background, isDark } = useThemeColors();
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState('');

  const { data, isLoading, error, refetch, isFetching } = useGetPlatesQuery(undefined, {
    refetchOnMountOrArgChange: true,
  });
  const [deletePlate] = useDeletePlateMutation();

  const plates = data?.plates ?? [];

  const filteredPlates = useMemo(() => {
    if (!searchQuery.trim()) return plates;
    const q = searchQuery.toLowerCase().trim();
    return plates.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.recipeName && p.recipeName.toLowerCase().includes(q))
    );
  }, [plates, searchQuery]);

  const handleCreateRecipeFromPlate = (plate: PlateData) => {
    navigation.navigate('AddRecipe', {
      prefillName: plate.name,
      prefillYieldAmount: plate.size,
      prefillYieldUnit: plate.unit,
      prefillPlateId: plate._id,
    });
  };

  const confirmDelete = (plate: PlateData) => {
    Alert.alert('Delete plate?', `Remove portion/plate "${plate.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deletePlate(plate._id).unwrap();
            dispatch(showToast({ title: 'Plate deleted', message: plate.name, type: 'success' }));
          } catch (err: any) {
            dispatch(
              showToast({
                title: 'Delete failed',
                message: err?.data?.error || 'Could not delete plate.',
                type: 'error',
              })
            );
          }
        },
      },
    ]);
  };

  const renderItem = ({ item }: { item: PlateData }) => {
    return (
      <View
        style={{
          backgroundColor: card,
          borderColor: border,
          borderWidth: 1,
          borderRadius: 16,
          padding: 16,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.05,
          shadowRadius: 8,
          elevation: 2,
        }}
      >
        <View className="flex-row justify-between items-start mb-2">
          <View className="flex-1 mr-2">
            <Text className="text-base font-bold text-text dark:text-text-dark">
              {item.name}
            </Text>
            <View className="flex-row items-center mt-1 flex-wrap" style={{ gap: 6 }}>
              <View className="px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20">
                <Text className="text-[10px] font-bold text-primary">
                  {item.size} {item.unit}
                </Text>
              </View>
              {item.recipeId ? (
                <View className="px-2 py-0.5 rounded-full bg-green-500/10 border border-green-500/20 flex-row items-center">
                  <Ionicons name="restaurant-outline" size={10} color="#22c55e" style={{ marginRight: 3 }} />
                  <Text className="text-[10px] font-semibold text-green-600 dark:text-green-400">
                    {item.recipeName || 'Recipe linked'}
                  </Text>
                </View>
              ) : (
                <View className="px-2 py-0.5 rounded-full bg-yellow-500/10 border border-yellow-500/20 flex-row items-center">
                  <Ionicons name="alert-circle-outline" size={10} color="#eab308" style={{ marginRight: 3 }} />
                  <Text className="text-[10px] font-semibold text-yellow-600 dark:text-yellow-400">
                    No recipe (Custom food cost)
                  </Text>
                </View>
              )}
            </View>
          </View>

          <View className="flex-row items-center" style={{ gap: 8 }}>
            {!item.recipeId && (
              <TouchableOpacity
                onPress={() => handleCreateRecipeFromPlate(item)}
                className="w-8 h-8 rounded-xl bg-primary/10 border border-primary/20 items-center justify-center"
                activeOpacity={0.7}
              >
                <Ionicons name="book-outline" size={15} color={primary} />
              </TouchableOpacity>
            )}
            <TouchableOpacity
              onPress={() => navigation.navigate('AddPlate', { plateId: item._id })}
              className="w-8 h-8 rounded-xl bg-primary/10 border border-primary/20 items-center justify-center"
              activeOpacity={0.7}
            >
              <Ionicons name="create-outline" size={15} color={primary} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => confirmDelete(item)}
              className="w-8 h-8 rounded-xl bg-red-500/10 border border-red-500/20 items-center justify-center"
              activeOpacity={0.7}
            >
              <Ionicons name="trash-outline" size={15} color="#ef4444" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Cost Breakdown */}
        <View className="border-t border-border dark:border-border-dark mt-3 pt-3 flex-row justify-between flex-wrap" style={{ gap: 12 }}>
          <View>
            <Text className="text-[9px] font-bold text-muted dark:text-muted-dark uppercase tracking-wider">Food Cost</Text>
            <Text className="text-sm font-semibold text-text dark:text-text-dark mt-0.5">
              {formatInr(item.computedPortionCost ?? 0)}
            </Text>
          </View>

          <View>
            <Text className="text-[9px] font-bold text-muted dark:text-muted-dark uppercase tracking-wider">Packaging/Extra</Text>
            <Text className="text-sm font-semibold text-text dark:text-text-dark mt-0.5">
              {formatInr(item.computedPackagingCost ?? 0)}
            </Text>
          </View>

          <View>
            <Text className="text-[9px] font-bold text-muted dark:text-muted-dark uppercase tracking-wider">Making Cost</Text>
            <Text className="text-sm font-semibold text-text dark:text-text-dark mt-0.5">
              {formatInr(item.computedTotalCost ?? 0)}
            </Text>
          </View>

          <View>
            <Text className="text-[9px] font-bold text-muted dark:text-muted-dark uppercase tracking-wider">Sell Price</Text>
            <Text className="text-sm font-bold text-primary mt-0.5">
              {formatInr(item.sellPrice)}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  const renderEmpty = () => {
    if (isLoading) {
      return <LoadingView message="Loading portions & plates…" />;
    }
    if (error) {
      return <ErrorState message="Could not load plates. Tap to retry." onRetry={refetch} />;
    }
    if (searchQuery.trim().length > 0) {
      return (
        <View className="items-center py-10">
          <Ionicons name="search-outline" size={32} color={muted} />
          <Text className="text-sm font-bold text-muted dark:text-muted-dark mt-3">
            No plates match "{searchQuery}"
          </Text>
        </View>
      );
    }
    return (
      <EmptyStateCard
        icon="fast-food-outline"
        title="No plates yet"
        message="Create plates to size down recipes (e.g. 100g portion of 1kg recipe) and calculate packaging costs."
        actionLabel="Create Plate"
        onAction={() => navigation.navigate('AddPlate')}
      />
    );
  };

  return (
    <ScreenContainer>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <View className="flex-1">
        {/* Header toolbar */}
        {plates.length > 0 && (
          <View className="px-6 pt-3 flex-row items-center justify-between" style={{ gap: 8 }}>
            <View className="flex-1">
              <SearchBar
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search plates..."
              />
            </View>
            <TouchableOpacity
              onPress={refetch}
              disabled={isFetching}
              activeOpacity={0.7}
              className="w-10 h-10 rounded-xl border border-border dark:border-border-dark bg-card dark:bg-card-dark justify-center items-center"
            >
              {isFetching ? (
                <ActivityIndicator size="small" color={primary} />
              ) : (
                <Ionicons name="refresh-outline" size={18} color={muted} />
              )}
            </TouchableOpacity>
          </View>
        )}

        <FlatList
          data={filteredPlates}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          ListEmptyComponent={renderEmpty()}
          contentContainerStyle={{
            gap: 16,
            paddingHorizontal: 24,
            paddingTop: 16,
            paddingBottom: insets.bottom + 120,
            flexGrow: 1,
          }}
          {...SCROLL_LIST_PROPS}
          {...LIST_VIRTUALIZATION_PROPS}
        />

        <FloatingActionButton onPress={() => navigation.navigate('AddPlate')} icon="add" />
      </View>
    </ScreenContainer>
  );
}
