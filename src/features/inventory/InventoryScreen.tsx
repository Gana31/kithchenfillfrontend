import React, { useState, useEffect, useCallback, useMemo, useRef, useLayoutEffect } from 'react';
import {
  View,
  BackHandler,
  useWindowDimensions,
  ListRenderItem,
  ViewStyle,
  CellRendererProps,
  FlatList,
  ActivityIndicator,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useIsFocused } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { useThemeColors } from '../../hooks/useThemeColors';
import { IngredientData, INGREDIENTS_PAGE_SIZE } from './inventoryApi';
import InventoryListItem from './components/InventoryListItem';
import InventoryGridRow from './components/InventoryGridRow';
import InventoryToolbar from './components/InventoryToolbar';
import InventorySortMenu from './components/InventorySortMenu';
import InventoryListStates from './components/InventoryListStates';
import AddIngredientModal from './components/AddIngredientModal';
import AdjustStockModal from './components/AdjustStockModal';
import ConfirmModal from '../../components/ConfirmModal';
import ScreenContainer from '../../components/ScreenContainer';
import { SCROLL_LIST_PROPS } from '../../components/scrollUtils';
import { ListLoadMoreFooter } from '../../components/AsyncStateViews';
import { useGridSelection, GridSelectionState } from './hooks/useGridSelection';
import { useDebouncedStockAdjust } from './hooks/useDebouncedStockAdjust';
import { useInventoryPreferences } from './hooks/useInventoryPreferences';
import { useInventoryList, GridRowData } from './hooks/useInventoryList';
import { useInventoryDeleteActions } from './hooks/useInventoryDeleteActions';
import { useInventoryHeader } from './hooks/useInventoryHeader';
import {
  SortOption,
  StockLevelFilter,
  getGridCardWidth,
  getGridCardHeight,
  GRID_GAP,
  GRID_HORIZONTAL_PADDING,
  getListItemLayout,
} from './inventoryUtils';

export default function InventoryScreen({ navigation }: any) {
  const isFocused = useIsFocused();
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const { isDark, primary } = useThemeColors();
  const cardWidth = getGridCardWidth(screenWidth);

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingIngredient, setEditingIngredient] = useState<IngredientData | null>(null);
  const [isAdjustModalVisible, setIsAdjustModalVisible] = useState(false);
  const [adjustingIngredient, setAdjustingIngredient] = useState<IngredientData | null>(null);
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [stockFilter, setStockFilter] = useState<StockLevelFilter>('all');
  const [filterTransitionPending, setFilterTransitionPending] = useState(false);
  const [selectionClearToken, setSelectionClearToken] = useState(0);
  const [gridSelection, setGridSelection] = useState<GridSelectionState>({
    active: false,
    count: 0,
    total: 0,
    allSelected: false,
  });

  const listRef = useRef<FlatList<IngredientData>>(null);
  const gridRef = useRef<FlatList<GridRowData>>(null);
  const listScrollOffsetRef = useRef(0);
  const gridScrollOffsetRef = useRef(0);

  const { prefsLoaded, layout, sortBy, stockLevelSort, handleLayoutChange, handleSortChange } =
    useInventoryPreferences();

  const { queueAdjust, getPendingDelta, isSyncing, pendingVersion } = useDebouncedStockAdjust();

  const {
    searchQuery,
    setSearchQuery,
    debouncedSearch,
    displayIngredients,
    gridRows,
    listSortKey,
    lowStockCount,
    totalCount,
    error,
    isFetching,
    hasLoadedInventory,
    isInitialInventoryLoading,
    isLoadingMore,
    isManualRefreshing,
    handleRefresh: refreshList,
    loadMore,
    enableLoadMore,
    suppressLoadMore,
    resetPage,
  } = useInventoryList({
    prefsLoaded,
    sortBy,
    stockLevelSort,
    stockFilter,
    filterTransitionPending,
    isScreenFocused: isFocused,
    getPendingDelta,
    pendingVersion,
  });

  const displayIngredientsRef = useRef(displayIngredients);
  displayIngredientsRef.current = displayIngredients;
  const isSyncingRef = useRef(isSyncing);
  isSyncingRef.current = isSyncing;

  const bumpSelectionClear = useCallback(() => setSelectionClearToken((t) => t + 1), []);

  const deleteActions = useInventoryDeleteActions({
    onDeleteSuccess: resetPage,
    onBulkDeleteSuccess: () => {
      resetPage();
      bumpSelectionClear();
    },
  });

  const handleGridSelectionChange = useCallback((state: GridSelectionState) => {
    setGridSelection(state);
  }, []);

  const grid = useGridSelection({
    items: displayIngredients,
    onBulkDelete: deleteActions.requestBulkDelete,
    onSelectionChange: handleGridSelectionChange,
    selectionClearToken,
  });

  const gridCardHeight = useMemo(
    () => getGridCardHeight(cardWidth, grid.selectionMode),
    [cardWidth, grid.selectionMode]
  );

  const gridItemStride = gridCardHeight + GRID_GAP;

  const onLayoutChange = useCallback(
    (newLayout: typeof layout) => {
      suppressLoadMore();
      if (newLayout !== 'grid' && gridSelection.active) {
        bumpSelectionClear();
      }
      handleLayoutChange(newLayout);
    },
    [suppressLoadMore, gridSelection.active, bumpSelectionClear, handleLayoutChange]
  );

  const scrollInventoryToTop = useCallback(() => {
    if (layout === 'grid') {
      gridRef.current?.scrollToOffset({ offset: 0, animated: false });
    } else {
      listRef.current?.scrollToOffset({ offset: 0, animated: false });
    }
  }, [layout]);

  const onAddPress = useCallback(() => {
    setEditingIngredient(null);
    setIsModalVisible(true);
  }, []);

  const applyStockFilter = useCallback(
    (filter: StockLevelFilter) => {
      setFilterTransitionPending(true);
      setStockFilter(filter);
      setShowSortMenu(false);
      scrollInventoryToTop();
    },
    [scrollInventoryToTop]
  );

  const onLowStockPress = useCallback(() => {
    applyStockFilter(stockFilter === 'low' ? 'all' : 'low');
  }, [applyStockFilter, stockFilter]);

  useInventoryHeader({
    navigation,
    prefsLoaded,
    layout,
    lowStockCount,
    lowFilterActive: stockFilter === 'low',
    onLayoutChange,
    onAddPress,
    onLowStockPress,
  });

  const handleRefresh = useCallback(() => {
    if (layout === 'grid') {
      gridRef.current?.scrollToOffset({ offset: 0, animated: false });
    } else {
      listRef.current?.scrollToOffset({ offset: 0, animated: false });
    }
    refreshList(grid.clearSelection);
  }, [layout, refreshList, grid.clearSelection]);

  useEffect(() => {
    const unsubscribe = (navigation as { addListener: (event: string, cb: () => void) => () => void }).addListener(
      'inventoryTabRepress',
      handleRefresh
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

  const handleStepAdjust = useCallback(
    (ingredientId: string, type: 'add' | 'deduct', baseAdjustment: number) => {
      if (baseAdjustment <= 0) return;
      const delta = type === 'add' ? baseAdjustment : -baseAdjustment;
      queueAdjust(ingredientId, delta);
    },
    [queueAdjust]
  );

  const onSortChange = useCallback(
    (newSort: SortOption) => {
      handleSortChange(newSort);
      setShowSortMenu(false);
    },
    [handleSortChange]
  );

  const onStockFilterChange = useCallback(
    (filter: StockLevelFilter) => {
      applyStockFilter(filter);
    },
    [applyStockFilter]
  );

  useLayoutEffect(() => {
    if (filterTransitionPending && hasLoadedInventory && !isFetching) {
      setFilterTransitionPending(false);
    }
  }, [filterTransitionPending, hasLoadedInventory, isFetching]);

  const openEdit = useCallback((item: IngredientData) => {
    setEditingIngredient(item);
    setIsModalVisible(true);
  }, []);

  const openAdjust = useCallback((item: IngredientData) => {
    setAdjustingIngredient(item);
    setIsAdjustModalVisible(true);
  }, []);

  const openEditById = useCallback((id: string) => {
    const item = displayIngredientsRef.current.find((entry) => entry._id === id);
    if (item) openEdit(item);
  }, [openEdit]);

  const openAdjustById = useCallback((id: string) => {
    const item = displayIngredientsRef.current.find((entry) => entry._id === id);
    if (item) openAdjust(item);
  }, [openAdjust]);

  const deleteById = useCallback(
    (id: string) => {
      const item = displayIngredientsRef.current.find((entry) => entry._id === id);
      if (item) deleteActions.requestDelete(item);
    },
    [deleteActions.requestDelete]
  );

  const readIsSyncing = useCallback((id: string) => isSyncingRef.current(id), []);

  useEffect(() => {
    if (isFocused) {
      enableLoadMore();
    }
  }, [isFocused, enableLoadMore]);

  const handleListScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    listScrollOffsetRef.current = event.nativeEvent.contentOffset.y;
  }, []);

  const handleGridScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    gridScrollOffsetRef.current = event.nativeEvent.contentOffset.y;
  }, []);

  useLayoutEffect(() => {
    if (!isFocused) return;

    const frame = requestAnimationFrame(() => {
      if (layout === 'grid') {
        gridRef.current?.scrollToOffset({
          offset: gridScrollOffsetRef.current,
          animated: false,
        });
      } else {
        listRef.current?.scrollToOffset({
          offset: listScrollOffsetRef.current,
          animated: false,
        });
      }
    });

    return () => cancelAnimationFrame(frame);
  }, [isFocused, layout]);

  const handleScrollBegin = useCallback(() => {
    if (!isFocused) return;
    enableLoadMore();
    setShowSortMenu(false);
  }, [isFocused, enableLoadMore]);

  const horizontalPadding = layout === 'grid' ? GRID_HORIZONTAL_PADDING : 24;

  const isListLoading = isInitialInventoryLoading;
  const showFilterOverlay =
    filterTransitionPending && !isManualRefreshing && (isFetching || !hasLoadedInventory);

  const listEmpty = useMemo(
    () => (
      <InventoryListStates
        isInitialLoading={isInitialInventoryLoading}
        isQueryReloading={false}
        error={error}
        onRetry={handleRefresh}
        hasLoadedInventory={hasLoadedInventory}
        totalCount={totalCount}
        debouncedSearch={debouncedSearch}
        searchQuery={searchQuery}
        stockFilter={stockFilter}
        displayCount={displayIngredients.length}
        isFetching={isFetching}
      />
    ),
    [
      isInitialInventoryLoading,
      error,
      handleRefresh,
      hasLoadedInventory,
      totalCount,
      debouncedSearch,
      searchQuery,
      stockFilter,
      displayIngredients.length,
      isFetching,
    ]
  );

  const sharedContentContainerStyle = useMemo((): ViewStyle => ({
    width: '100%',
    flexGrow: 1,
    paddingHorizontal: horizontalPadding,
    paddingTop: 8,
    paddingBottom: insets.bottom + 120,
  }), [horizontalPadding, insets.bottom]);

  const renderListItem: ListRenderItem<IngredientData> = useCallback(
    ({ item }) => (
      <InventoryListItem
        ingredient={item}
        isUpdating={readIsSyncing(item._id)}
        onEditById={openEditById}
        onAdjustById={openAdjustById}
        onDeleteById={deleteById}
        onStepAdjust={handleStepAdjust}
      />
    ),
    [readIsSyncing, openEditById, openAdjustById, deleteById, handleStepAdjust]
  );

  const renderGridRow: ListRenderItem<GridRowData> = useCallback(
    ({ item: row }) => (
      <InventoryGridRow
        row={row}
        cardWidth={cardWidth}
        gridCardHeight={gridCardHeight}
        gridItemStride={gridItemStride}
        selectionMode={grid.selectionMode}
        selectedIds={grid.selectedIds}
        isSyncing={readIsSyncing}
        onEdit={openEdit}
        onLongPress={grid.enterSelectionWith}
        onToggleSelect={grid.toggleSelect}
        onStepAdjust={handleStepAdjust}
      />
    ),
    [
      cardWidth,
      gridCardHeight,
      gridItemStride,
      grid.selectionMode,
      grid.selectionTick,
      readIsSyncing,
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

  const listData = isListLoading ? [] : displayIngredients;
  const gridData = isListLoading ? [] : gridRows;
  const listItemCount = listData.length;
  const gridRowCount = gridData.length;

  const listExtraData = pendingVersion;
  const gridExtraData = useMemo(
    () => `${grid.selectionTick}-${pendingVersion}`,
    [grid.selectionTick, pendingVersion]
  );

  /** Up to 100 rows: mount all while tab is focused (no blank on fast scroll). Tab blur unmounts the list. */
  const inventoryListProps = useMemo(() => {
    const renderAllRows = listItemCount > 0 && listItemCount <= INGREDIENTS_PAGE_SIZE;

    if (renderAllRows) {
      return {
        ...SCROLL_LIST_PROPS,
        removeClippedSubviews: false,
        disableVirtualization: true,
        initialNumToRender: listItemCount,
        maxToRenderPerBatch: listItemCount,
        windowSize: 21,
        updateCellsBatchingPeriod: 16,
      };
    }

    return {
      ...SCROLL_LIST_PROPS,
      removeClippedSubviews: false,
      windowSize: 11,
      initialNumToRender: 14,
      maxToRenderPerBatch: 10,
      updateCellsBatchingPeriod: 16,
    };
  }, [listItemCount]);

  const gridPerfProps = useMemo(() => {
    const renderAllRows = gridRowCount > 0 && gridRowCount <= Math.ceil(INGREDIENTS_PAGE_SIZE / 3);

    if (renderAllRows) {
      return {
        ...SCROLL_LIST_PROPS,
        removeClippedSubviews: false,
        disableVirtualization: true,
        initialNumToRender: gridRowCount,
        maxToRenderPerBatch: gridRowCount,
        windowSize: 15,
        updateCellsBatchingPeriod: 16,
      };
    }

    return {
      ...SCROLL_LIST_PROPS,
      removeClippedSubviews: false,
      windowSize: 9,
      initialNumToRender: 10,
      maxToRenderPerBatch: 8,
      updateCellsBatchingPeriod: 16,
    };
  }, [gridRowCount]);

  const getGridItemLayout = useCallback(
    (_data: ArrayLike<GridRowData> | null | undefined, index: number) => ({
      length: gridItemStride,
      offset: gridItemStride * index,
      index,
    }),
    [gridItemStride]
  );

  const listEndReached = isFocused && !isManualRefreshing ? loadMore : undefined;

  const filterOverlay = showFilterOverlay ? (
    <View
      pointerEvents="none"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.18)',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <View className="bg-card dark:bg-card-dark rounded-2xl px-5 py-4 items-center border border-border dark:border-border-dark">
        <ActivityIndicator size="small" color={primary} />
      </View>
    </View>
  ) : null;

  return (
    <ScreenContainer>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      <InventoryToolbar
        horizontalPadding={horizontalPadding}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        isRefreshing={isManualRefreshing}
        onRefresh={handleRefresh}
        showSortMenu={showSortMenu}
        filterActive={stockFilter !== 'all'}
        onToggleSortMenu={() => setShowSortMenu((prev) => !prev)}
        showGridSelection={gridSelection.active && layout === 'grid'}
        gridSelection={gridSelection}
        onClearSelection={grid.clearSelection}
        onSelectAll={grid.selectAll}
        onDeleteSelected={grid.deleteSelected}
      />

      <InventorySortMenu
        visible={showSortMenu}
        sortBy={sortBy}
        stockFilter={stockFilter}
        horizontalPadding={horizontalPadding}
        topInset={insets.top}
        onClose={() => setShowSortMenu(false)}
        onSortChange={onSortChange}
        onStockFilterChange={onStockFilterChange}
      />

      {isFocused ? (
        layout === 'grid' ? (
          <View style={{ flex: 1, width: '100%' }} collapsable={false}>
            <FlatList
              ref={gridRef}
              key={`inventory-grid-${gridCardHeight}`}
              style={{ flex: 1, width: '100%', backgroundColor: 'transparent' }}
              data={gridData}
              extraData={gridExtraData}
              keyExtractor={(item) => item.id}
              renderItem={renderGridRow}
              CellRendererComponent={renderFullWidthCell}
              getItemLayout={getGridItemLayout}
              ListEmptyComponent={listEmpty}
              ListFooterComponent={<ListLoadMoreFooter visible={isLoadingMore} />}
              contentContainerStyle={sharedContentContainerStyle}
              onScroll={handleGridScroll}
              onScrollBeginDrag={handleScrollBegin}
              onMomentumScrollBegin={handleScrollBegin}
              onEndReached={listEndReached}
              onEndReachedThreshold={0.4}
              {...gridPerfProps}
            />
            {filterOverlay}
          </View>
        ) : (
          <View style={{ flex: 1, width: '100%' }} collapsable={false}>
            <FlatList
              ref={listRef}
              key="inventory-list"
              style={{ flex: 1, width: '100%', backgroundColor: 'transparent' }}
              data={listData}
              extraData={listExtraData}
              keyExtractor={(item) => item._id}
              renderItem={renderListItem}
              getItemLayout={getListItemLayout}
              ListEmptyComponent={listEmpty}
              ListFooterComponent={<ListLoadMoreFooter visible={isLoadingMore} />}
              contentContainerStyle={sharedContentContainerStyle}
              onScroll={handleListScroll}
              onScrollBeginDrag={handleScrollBegin}
              onMomentumScrollBegin={handleScrollBegin}
              onEndReached={listEndReached}
              onEndReachedThreshold={0.4}
              {...inventoryListProps}
            />
            {filterOverlay}
          </View>
        )
      ) : (
        <View style={{ flex: 1, width: '100%' }} collapsable={false} />
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
        visible={deleteActions.ingredientToDelete !== null}
        title="Delete Ingredient"
        message={`Are you sure you want to delete "${deleteActions.ingredientToDelete?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        isDestructive
        onConfirm={deleteActions.executeDeleteIngredient}
        onCancel={deleteActions.cancelDelete}
      />

      <ConfirmModal
        visible={deleteActions.bulkDeleteItems.length > 0}
        title="Delete Selected Items"
        message={`Are you sure you want to delete ${deleteActions.bulkDeleteItems.length} item${deleteActions.bulkDeleteItems.length === 1 ? '' : 's'}? If you tap Yes, they will be deleted. If you tap Cancel, nothing will be deleted.`}
        confirmLabel="Yes, Delete"
        cancelLabel="Cancel"
        isDestructive
        onConfirm={deleteActions.executeBulkDelete}
        onCancel={deleteActions.cancelBulkDelete}
      />
    </ScreenContainer>
  );
}
