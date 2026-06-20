import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  BackHandler,
  RefreshControl,
  useWindowDimensions,
  ListRenderItem,
  ViewStyle,
  CellRendererProps,
} from 'react-native';
import { FlatList } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import Card from '../../components/Card';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '../../hooks/useThemeColors';
import {
  useGetIngredientsQuery,
  useUpdateIngredientMutation,
  useDeleteIngredientMutation,
  IngredientData,
  INGREDIENTS_PAGE_SIZE,
} from './inventoryApi';
import IngredientCard from './components/IngredientCard';
import IngredientGridCard from './components/IngredientGridCard';
import { GridSelectionState } from './components/InventoryGridView';
import {
  InventoryLayout,
  SortOption,
  loadInventoryPreferences,
  saveInventoryPreferences,
  SORT_OPTIONS,
  getGridCardWidth,
  getGridCardHeight,
  GRID_COLUMNS,
  GRID_GAP,
  GRID_HORIZONTAL_PADDING,
} from './inventoryUtils';
import { useGridSelection } from './useGridSelection';
import AddIngredientModal from './components/AddIngredientModal';
import AdjustStockModal from './components/AdjustStockModal';
import { useAppDispatch } from '../../store/store';
import { showToast } from '../../store/toastSlice';
import ConfirmModal from '../../components/ConfirmModal';
import ScreenContainer from '../../components/ScreenContainer';

const SEARCH_DEBOUNCE_MS = 300;

interface GridRowData {
  id: string;
  items: IngredientData[];
}

export default function InventoryScreen({ navigation }: any) {
  const dispatch = useAppDispatch();
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const { primary, danger, muted, isDark, text } = useThemeColors();
  const cardWidth = getGridCardWidth(screenWidth);

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingIngredient, setEditingIngredient] = useState<IngredientData | null>(null);
  const [isAdjustModalVisible, setIsAdjustModalVisible] = useState(false);
  const [adjustingIngredient, setAdjustingIngredient] = useState<IngredientData | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [prefsLoaded, setPrefsLoaded] = useState(false);
  const [layout, setLayout] = useState<InventoryLayout>('list');
  const [sortBy, setSortBy] = useState<SortOption>('name-asc');
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [ingredientToDelete, setIngredientToDelete] = useState<IngredientData | null>(null);
  const [bulkDeleteItems, setBulkDeleteItems] = useState<IngredientData[]>([]);
  const [selectionClearToken, setSelectionClearToken] = useState(0);
  const [gridSelection, setGridSelection] = useState<GridSelectionState>({
    active: false,
    count: 0,
    total: 0,
    allSelected: false,
  });
  const [page, setPage] = useState(1);
  const [isManualRefreshing, setIsManualRefreshing] = useState(false);
  const refreshInFlight = useRef(false);
  const suppressLoadMoreUntilRef = useRef(0);
  const canLoadMoreRef = useRef(false);
  const pendingRefreshPageResetRef = useRef(false);
  const loadMoreDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleGridSelectionChange = useCallback((state: GridSelectionState) => {
    setGridSelection(state);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery.trim()), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    setPage(1);
    canLoadMoreRef.current = false;
  }, [debouncedSearch, sortBy]);

  useEffect(() => {
    loadInventoryPreferences().then((prefs) => {
      if (prefs) {
        setLayout(prefs.layout);
        setSortBy(prefs.sortBy);
      }
      setPrefsLoaded(true);
    });
  }, []);

  const handleLayoutChange = (newLayout: InventoryLayout) => {
    if (newLayout === layout) return;
    suppressLoadMoreUntilRef.current = Date.now() + 600;
    canLoadMoreRef.current = false;
    setLayout(newLayout);
    if (newLayout !== 'grid' && gridSelection.active) {
      setSelectionClearToken((t) => t + 1);
    }
    saveInventoryPreferences({ layout: newLayout, sortBy });
  };

  const handleSortChange = (newSort: SortOption) => {
    setSortBy(newSort);
    setShowSortMenu(false);
    saveInventoryPreferences({ layout, sortBy: newSort });
  };

  const { data, isLoading, isFetching, error, refetch } = useGetIngredientsQuery({
    page,
    limit: INGREDIENTS_PAGE_SIZE,
    search: debouncedSearch,
    sortBy,
  });

  const ingredients = data?.ingredients ?? [];
  const hasMore = data?.pagination?.hasMore ?? false;
  const lowStockCount = data?.lowStockCount ?? 0;
  const totalCount = data?.pagination?.total ?? ingredients.length;

  const gridRows = useMemo((): GridRowData[] => {
    const rows: GridRowData[] = [];
    for (let i = 0; i < ingredients.length; i += GRID_COLUMNS) {
      const slice = ingredients.slice(i, i + GRID_COLUMNS);
      rows.push({
        id: slice.map((item) => item._id).join('|'),
        items: slice,
      });
    }
    return rows;
  }, [ingredients]);

  const handleBulkDeleteRequest = useCallback((items: IngredientData[]) => {
    setBulkDeleteItems(items);
  }, []);

  const grid = useGridSelection({
    items: ingredients,
    onBulkDelete: handleBulkDeleteRequest,
    onSelectionChange: handleGridSelectionChange,
    selectionClearToken,
  });

  const gridCardHeight = useMemo(
    () => getGridCardHeight(cardWidth, grid.selectionMode),
    [cardWidth, grid.selectionMode]
  );

  const handleRefresh = useCallback(async () => {
    if (refreshInFlight.current) return;
    refreshInFlight.current = true;
    setIsManualRefreshing(true);
    canLoadMoreRef.current = false;
    grid.clearSelection();
    try {
      if (page !== 1) {
        pendingRefreshPageResetRef.current = true;
        setPage(1);
      } else {
        await refetch();
        refreshInFlight.current = false;
        setIsManualRefreshing(false);
      }
    } catch {
      refreshInFlight.current = false;
      setIsManualRefreshing(false);
    }
  }, [page, refetch, grid.clearSelection]);

  useEffect(() => {
    if (!pendingRefreshPageResetRef.current) return;
    if (page !== 1 || isFetching) return;

    pendingRefreshPageResetRef.current = false;
    refreshInFlight.current = false;
    setIsManualRefreshing(false);
  }, [page, isFetching]);

  useEffect(() => {
    const unsubscribe = (navigation as { addListener: (event: string, cb: () => void) => () => void }).addListener(
      'inventoryTabRepress',
      () => {
        handleRefresh();
      }
    );
    return unsubscribe;
  }, [navigation, handleRefresh]);

  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (gridSelection.active) {
        grid.clearSelection();
        return true;
      }
      return false;
    });
    return () => backHandler.remove();
  }, [gridSelection.active, grid.clearSelection]);

  const [updateIngredient] = useUpdateIngredientMutation();
  const [deleteIngredient] = useDeleteIngredientMutation();

  const handleStepAdjust = useCallback(async (ingredient: IngredientData, type: 'add' | 'deduct', baseAdjustment: number) => {
    setUpdatingId(ingredient._id);
    const ratio = ingredient.unitRelation.conversionRatio;
    let newBaseQuantity = ingredient.currentStock;

    if (type === 'add') {
      newBaseQuantity += baseAdjustment;
    } else {
      newBaseQuantity = Math.max(0, newBaseQuantity - baseAdjustment);
    }

    try {
      await updateIngredient({
        id: ingredient._id,
        body: {
          name: ingredient.name,
          minThreshold: ingredient.minThreshold,
          purchaseUnit: ingredient.unitRelation.purchaseUnit,
          baseUnit: ingredient.unitRelation.baseUnit,
          conversionRatio: ratio,
          currentStock: newBaseQuantity,
          image: ingredient.image || undefined,
        },
      }).unwrap();
      setPage(1);
    } catch (err: any) {
      dispatch(
        showToast({
          title: 'Adjustment Failed',
          message: err.data?.error || 'Failed to update stock.',
          type: 'error',
        })
      );
    } finally {
      setUpdatingId(null);
    }
  }, [dispatch, updateIngredient]);

  const loadMore = useCallback(() => {
    if (!canLoadMoreRef.current) return;
    if (Date.now() < suppressLoadMoreUntilRef.current) return;
    if (isFetching || isManualRefreshing || !hasMore) return;

    if (loadMoreDebounceRef.current) {
      clearTimeout(loadMoreDebounceRef.current);
    }

    loadMoreDebounceRef.current = setTimeout(() => {
      loadMoreDebounceRef.current = null;
      setPage((current) => current + 1);
    }, 250);
  }, [isFetching, isManualRefreshing, hasMore]);

  useEffect(() => {
    return () => {
      if (loadMoreDebounceRef.current) {
        clearTimeout(loadMoreDebounceRef.current);
      }
    };
  }, []);

  const enableLoadMore = useCallback(() => {
    canLoadMoreRef.current = true;
  }, []);

  const executeBulkDelete = async () => {
    if (bulkDeleteItems.length === 0) return;
    const targets = bulkDeleteItems;
    setBulkDeleteItems([]);

    try {
      setUpdatingId('bulk');
      const results = await Promise.allSettled(
        targets.map((item) => deleteIngredient(item._id).unwrap())
      );
      const successCount = results.filter((r) => r.status === 'fulfilled').length;
      const failCount = targets.length - successCount;

      if (successCount > 0) {
        setPage(1);
        dispatch(
          showToast({
            title: 'Deleted',
            message: `${successCount} ingredient${successCount === 1 ? '' : 's'} removed.`,
            type: 'success',
          })
        );
      }
      if (failCount > 0) {
        dispatch(
          showToast({
            title: 'Partial Delete',
            message: `${failCount} item${failCount === 1 ? '' : 's'} could not be deleted.`,
            type: 'error',
          })
        );
      }
      setSelectionClearToken((t) => t + 1);
    } catch (err: any) {
      dispatch(
        showToast({
          title: 'Delete Failed',
          message: err.data?.error || 'Failed to delete ingredients.',
          type: 'error',
        })
      );
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDeleteIngredient = (ingredient: IngredientData) => {
    setIngredientToDelete(ingredient);
  };

  const executeDeleteIngredient = async () => {
    if (!ingredientToDelete) return;
    const target = ingredientToDelete;
    setIngredientToDelete(null);

    try {
      setUpdatingId(target._id);
      await deleteIngredient(target._id).unwrap();
      setPage(1);
      dispatch(
        showToast({
          title: 'Success',
          message: `Ingredient "${target.name}" successfully deleted.`,
          type: 'success',
        })
      );
    } catch (err: any) {
      dispatch(
        showToast({
          title: 'Delete Failed',
          message: err.data?.error || 'Failed to delete ingredient.',
          type: 'error',
        })
      );
    } finally {
      setUpdatingId(null);
    }
  };

  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <View className="flex-row items-center mr-6" style={{ gap: 8 }}>
          {prefsLoaded ? (
            <View className="flex-row bg-card dark:bg-card-dark border border-border dark:border-border-dark rounded-xl p-0.5">
              <TouchableOpacity
                onPress={() => handleLayoutChange('list')}
                activeOpacity={0.7}
                className={`w-9 h-9 rounded-lg justify-center items-center ${layout === 'list' ? 'bg-primary/15' : ''}`}
              >
                <Ionicons name="list-outline" size={18} color={layout === 'list' ? primary : muted} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleLayoutChange('grid')}
                activeOpacity={0.7}
                className={`w-9 h-9 rounded-lg justify-center items-center ${layout === 'grid' ? 'bg-primary/15' : ''}`}
              >
                <Ionicons name="grid-outline" size={18} color={layout === 'grid' ? primary : muted} />
              </TouchableOpacity>
            </View>
          ) : null}
          <TouchableOpacity
            onPress={() => {
              setEditingIngredient(null);
              setIsModalVisible(true);
            }}
            activeOpacity={0.7}
            className="w-10 h-10 rounded-xl bg-card dark:bg-card-dark border border-border dark:border-border-dark justify-center items-center shadow-sm"
          >
            <Ionicons name="add" size={22} color={primary} />
          </TouchableOpacity>
        </View>
      ),
    });
  }, [navigation, primary, muted, layout, prefsLoaded]);

  const activeSortLabel = SORT_OPTIONS.find((option) => option.value === sortBy)?.label ?? 'Sort';
  const isScreenReady = prefsLoaded;
  const hasLoadedInventory = data !== undefined;
  const isInitialInventoryLoading = !hasLoadedInventory && (isLoading || isFetching);
  const showFullScreenLoader = !isScreenReady || isManualRefreshing || isInitialInventoryLoading;
  const isLoadingMore = isFetching && page > 1 && !isManualRefreshing;
  const horizontalPadding = layout === 'grid' ? GRID_HORIZONTAL_PADDING : 24;

  const openEdit = useCallback((item: IngredientData) => {
    setEditingIngredient(item);
    setIsModalVisible(true);
  }, []);

  const openAdjust = useCallback((item: IngredientData) => {
    setAdjustingIngredient(item);
    setIsAdjustModalVisible(true);
  }, []);

  const renderListItem: ListRenderItem<IngredientData> = useCallback(
    ({ item }) => (
      <IngredientCard
        ingredient={item}
        isUpdating={updatingId === item._id}
        onEdit={() => openEdit(item)}
        onAdjust={() => openAdjust(item)}
        onStepAdjust={(type, baseAmount) => handleStepAdjust(item, type, baseAmount)}
        onDelete={() => handleDeleteIngredient(item)}
      />
    ),
    [updatingId, openEdit, openAdjust]
  );

  const renderGridRow: ListRenderItem<GridRowData> = useCallback(
    ({ item: row }) => {
      const emptySlots = GRID_COLUMNS - row.items.length;
      const spacerWidth =
        emptySlots > 0 ? emptySlots * cardWidth + (emptySlots - 1) * GRID_GAP : 0;

      return (
        <View
          style={{
            width: '100%',
            minHeight: gridCardHeight,
            marginBottom: GRID_GAP,
          }}
          collapsable={false}
        >
          <View
            style={{
              flexDirection: 'row',
              gap: GRID_GAP,
              width: '100%',
              minHeight: gridCardHeight,
            }}
            collapsable={false}
          >
            {row.items.map((item) => (
              <IngredientGridCard
                key={item._id}
                ingredient={item}
                cardWidth={cardWidth}
                isUpdating={updatingId === item._id}
                selectionMode={grid.selectionMode}
                isSelected={grid.selectedIds.has(item._id)}
                onEdit={openEdit}
                onLongPress={grid.enterSelectionWith}
                onToggleSelect={grid.toggleSelect}
                onStepAdjust={handleStepAdjust}
              />
            ))}
            {spacerWidth > 0 ? (
              <View
                style={{ width: spacerWidth, minHeight: gridCardHeight }}
                collapsable={false}
              />
            ) : null}
          </View>
        </View>
      );
    },
    [
      cardWidth,
      gridCardHeight,
      grid.selectionMode,
      grid.selectedIds,
      updatingId,
      openEdit,
      grid.enterSelectionWith,
      grid.toggleSelect,
      handleStepAdjust,
    ]
  );

  const renderFullWidthCell = useCallback(
    ({ children, style, ...props }: CellRendererProps<GridRowData>) => (
      <View {...props} style={[style, { width: '100%' }]} collapsable={false}>
        {children}
      </View>
    ),
    []
  );

  const listHeader = useMemo(() => {
    if (showFullScreenLoader) return null;

    return (
      <View style={{ width: '100%' }} collapsable={false}>
        {lowStockCount > 0 ? (
          <Card className="mb-6 bg-red-500/10 border-red-500/20">
            <View className="flex-row items-center space-x-3">
              <View className="p-2 rounded-xl bg-red-500/20">
                <Ionicons name="warning" size={20} color={danger} />
              </View>
              <View className="flex-1 ml-3">
                <Text className="text-sm font-black text-text dark:text-text-dark">
                  {lowStockCount} {lowStockCount === 1 ? 'Item' : 'Items'} Below Threshold!
                </Text>
                <Text className="text-xs text-muted dark:text-muted-dark mt-0.5 leading-relaxed">
                  Some ingredients are running critically low. Reorder soon to maintain seamless kitchen operations.
                </Text>
              </View>
            </View>
          </Card>
        ) : null}

        <View className="mb-4 flex-row items-center bg-card dark:bg-card-dark border border-border dark:border-border-dark rounded-2xl px-4 py-3 shadow-sm">
          <Ionicons name="search-outline" size={18} color={muted} style={{ marginRight: 8 }} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search ingredients..."
            placeholderTextColor={muted}
            style={{
              flex: 1,
              fontSize: 14,
              fontWeight: '600',
              color: text,
              paddingVertical: 0,
            }}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')} activeOpacity={0.7}>
              <Ionicons name="close-circle" size={18} color={muted} />
            </TouchableOpacity>
          ) : null}
        </View>

        <View className="mb-6">
          <TouchableOpacity
            onPress={() => setShowSortMenu((prev) => !prev)}
            activeOpacity={0.7}
            className="flex-row items-center justify-between bg-card dark:bg-card-dark border border-border dark:border-border-dark rounded-2xl px-3 py-2.5 shadow-sm"
          >
            <View className="flex-row items-center">
              <Ionicons name="funnel-outline" size={14} color={primary} />
              <Text className="text-[10px] font-black uppercase text-text dark:text-text-dark ml-2">
                {activeSortLabel}
              </Text>
            </View>
            <Ionicons name={showSortMenu ? 'chevron-up' : 'chevron-down'} size={14} color={muted} />
          </TouchableOpacity>

          {showSortMenu ? (
            <View
              className="bg-card dark:bg-card-dark border border-border dark:border-border-dark rounded-2xl p-2 shadow-sm mt-2"
              style={{ gap: 4 }}
            >
              {SORT_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  onPress={() => handleSortChange(option.value)}
                  activeOpacity={0.7}
                  className={`flex-row items-center px-3 py-2.5 rounded-xl ${sortBy === option.value ? 'bg-primary/10' : ''}`}
                >
                  <Ionicons
                    name={option.icon as keyof typeof Ionicons.glyphMap}
                    size={14}
                    color={sortBy === option.value ? primary : muted}
                  />
                  <Text
                    className={`text-xs font-bold ml-2 ${sortBy === option.value ? 'text-primary' : 'text-text dark:text-text-dark'}`}
                  >
                    {option.label}
                  </Text>
                  {sortBy === option.value ? (
                    <Ionicons name="checkmark" size={14} color={primary} style={{ marginLeft: 'auto' }} />
                  ) : null}
                </TouchableOpacity>
              ))}
            </View>
          ) : null}
        </View>

        {gridSelection.active && layout === 'grid' ? (
          <View className="mb-4 bg-card dark:bg-card-dark border border-primary/30 rounded-2xl px-3 py-2.5 shadow-sm">
            <View className="flex-row items-center justify-between">
              <TouchableOpacity
                onPress={() => grid.clearSelection()}
                activeOpacity={0.7}
                className="flex-row items-center px-2 py-1.5 rounded-lg bg-border/20"
              >
                <Ionicons name="close" size={16} color={muted} />
                <Text className="text-xs font-bold text-muted dark:text-muted-dark ml-1">Cancel</Text>
              </TouchableOpacity>

              <Text className="text-xs font-black text-text dark:text-text-dark">
                {gridSelection.count} of {gridSelection.total} selected
              </Text>

              <View className="flex-row items-center" style={{ gap: 6 }}>
                <TouchableOpacity
                  onPress={() => gridSelection.allSelected ? grid.clearSelection() : grid.selectAll()}
                  activeOpacity={0.7}
                  className="px-3 h-9 rounded-xl bg-primary/10 border border-primary/20 items-center justify-center"
                >
                  <Text className="text-[10px] font-black text-primary">
                    {gridSelection.allSelected ? 'Unselect All' : 'Select All'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => grid.deleteSelected()}
                  disabled={gridSelection.count === 0}
                  activeOpacity={0.7}
                  className={`w-9 h-9 rounded-xl items-center justify-center ${
                    gridSelection.count > 0 ? 'bg-red-500/15 border border-red-500/30' : 'bg-border/20'
                  }`}
                >
                  <Ionicons name="trash-outline" size={18} color={gridSelection.count > 0 ? danger : muted} />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ) : null}
      </View>
    );
  }, [
    showFullScreenLoader,
    lowStockCount,
    danger,
    muted,
    searchQuery,
    text,
    activeSortLabel,
    showSortMenu,
    sortBy,
    primary,
    gridSelection,
    layout,
    grid,
  ]);

  const listEmpty = useMemo(() => {
    if (showFullScreenLoader) {
      return (
        <View className="py-24 justify-center items-center">
          <ActivityIndicator size="large" color={primary} />
          <Text className="text-xs text-muted dark:text-muted-dark mt-3 font-semibold uppercase tracking-widest">
            {isManualRefreshing ? 'Refreshing...' : 'Loading inventory...'}
          </Text>
        </View>
      );
    }

    if (error) {
      return (
        <View className="py-20 justify-center items-center">
          <Text className="text-red-500 text-xs font-bold mb-4">Error fetching inventory</Text>
          <TouchableOpacity onPress={handleRefresh} className="px-4 py-2 rounded-xl bg-card border border-border">
            <Text className="text-primary text-xs font-black uppercase">Retry</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (hasLoadedInventory && totalCount === 0 && !debouncedSearch) {
      return (
        <Card className="p-8 items-center justify-center">
          <Text className="text-muted dark:text-muted-dark text-xs font-bold text-center">
            No ingredients in stock. Tap the '+' button in the top right to register your first ingredient.
          </Text>
        </Card>
      );
    }

    if (hasLoadedInventory && ingredients.length === 0) {
      return (
        <Card className="p-8 items-center justify-center">
          <Text className="text-muted dark:text-muted-dark text-xs font-bold text-center">
            No ingredients match "{searchQuery}"
          </Text>
        </Card>
      );
    }

    return null;
  }, [showFullScreenLoader, isManualRefreshing, primary, error, handleRefresh, hasLoadedInventory, totalCount, ingredients.length, debouncedSearch, searchQuery]);

  const listFooter = useMemo(() => {
    if (!isLoadingMore) return null;
    return (
      <View className="py-6 items-center">
        <ActivityIndicator size="small" color={primary} />
      </View>
    );
  }, [isLoadingMore, primary]);

  const sharedContentContainerStyle = useMemo((): ViewStyle => ({
    width: '100%',
    paddingHorizontal: horizontalPadding,
    paddingTop: 16,
    paddingBottom: insets.bottom + 120,
  }), [horizontalPadding, insets.bottom]);

  const sharedRefreshControl = useMemo(() => (
    <RefreshControl
      refreshing={isManualRefreshing}
      onRefresh={handleRefresh}
      tintColor={primary}
      colors={[primary]}
      progressBackgroundColor={isDark ? '#161618' : '#FFFFFF'}
    />
  ), [isManualRefreshing, handleRefresh, primary, isDark]);

  return (
    <ScreenContainer>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      {layout === 'grid' ? (
        <View style={{ flex: 1, width: '100%' }} collapsable={false}>
        <FlatList
          key="inventory-grid"
          style={{ flex: 1, width: '100%' }}
          data={showFullScreenLoader ? [] : gridRows}
          extraData={grid.selectionTick}
          keyExtractor={(item) => item.id}
          renderItem={renderGridRow}
          CellRendererComponent={renderFullWidthCell}
          ListHeaderComponent={listHeader}
          ListEmptyComponent={listEmpty}
          ListFooterComponent={listFooter}
          contentContainerStyle={sharedContentContainerStyle}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          nestedScrollEnabled
          scrollEventThrottle={16}
          onScrollBeginDrag={enableLoadMore}
          onMomentumScrollBegin={enableLoadMore}
          onEndReached={loadMore}
          onEndReachedThreshold={0.2}
          removeClippedSubviews={false}
          maxToRenderPerBatch={6}
          updateCellsBatchingPeriod={50}
          windowSize={9}
          initialNumToRender={6}
          refreshControl={sharedRefreshControl}
        />
        </View>
      ) : (
        <FlatList
          key="inventory-list"
          style={{ flex: 1, width: '100%' }}
          data={showFullScreenLoader ? [] : ingredients}
          keyExtractor={(item) => item._id}
          renderItem={renderListItem}
          ListHeaderComponent={listHeader}
          ListEmptyComponent={listEmpty}
          ListFooterComponent={listFooter}
          contentContainerStyle={sharedContentContainerStyle}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          nestedScrollEnabled
          scrollEventThrottle={16}
          onScrollBeginDrag={enableLoadMore}
          onMomentumScrollBegin={enableLoadMore}
          onEndReached={loadMore}
          onEndReachedThreshold={0.2}
          removeClippedSubviews={false}
          maxToRenderPerBatch={8}
          updateCellsBatchingPeriod={50}
          windowSize={9}
          initialNumToRender={8}
          ItemSeparatorComponent={() => <View style={{ height: 16 }} />}
          refreshControl={sharedRefreshControl}
        />
      )}

      <AddIngredientModal
        visible={isModalVisible}
        onClose={() => {
          setIsModalVisible(false);
          setEditingIngredient(null);
        }}
        ingredient={editingIngredient}
      />

      <AdjustStockModal
        visible={isAdjustModalVisible}
        onClose={() => {
          setIsAdjustModalVisible(false);
          setAdjustingIngredient(null);
        }}
        ingredient={adjustingIngredient}
      />

      <ConfirmModal
        visible={ingredientToDelete !== null}
        title="Delete Ingredient"
        message={`Are you sure you want to delete "${ingredientToDelete?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        isDestructive={true}
        onConfirm={executeDeleteIngredient}
        onCancel={() => setIngredientToDelete(null)}
      />

      <ConfirmModal
        visible={bulkDeleteItems.length > 0}
        title="Delete Selected Items"
        message={`Are you sure you want to delete ${bulkDeleteItems.length} item${bulkDeleteItems.length === 1 ? '' : 's'}? If you tap Yes, they will be deleted. If you tap Cancel, nothing will be deleted.`}
        confirmLabel="Yes, Delete"
        cancelLabel="Cancel"
        isDestructive={true}
        onConfirm={executeBulkDelete}
        onCancel={() => setBulkDeleteItems([])}
      />
    </ScreenContainer>
  );
}
