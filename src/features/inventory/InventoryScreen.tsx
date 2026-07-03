import React, { useState, useEffect, useCallback, useMemo, useRef, useLayoutEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
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
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useIsFocused } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { useThemeColors } from '../../hooks/useThemeColors';
import { IngredientData } from './inventoryApi';
import InventoryListItem from './components/InventoryListItem';
import InventoryGridRow from './components/InventoryGridRow';
import InventoryToolbar from './components/InventoryToolbar';
import InventorySortMenu from './components/InventorySortMenu';
import InventoryListStates from './components/InventoryListStates';
import FolderGrid from './components/FolderGrid';
import AddIngredientModal from './components/AddIngredientModal';
import AdjustStockModal from './components/AdjustStockModal';
import ConfirmModal from '../../components/ConfirmModal';
import ScreenContainer from '../../components/ScreenContainer';
import {
  SCROLL_LIST_PROPS,
  SCROLL_GAP_TOUCH,
  LIST_VIRTUALIZATION_PROPS,
  GRID_VIRTUALIZATION_PROPS,
} from '../../components/scrollUtils';
import { ListLoadMoreFooter } from '../../components/AsyncStateViews';
import { useGridSelection, GridSelectionState } from './hooks/useGridSelection';
import { useDebouncedStockAdjust } from './hooks/useDebouncedStockAdjust';
import { useInventoryPreferences } from './hooks/useInventoryPreferences';
import { useInventoryList, GridRowData } from './hooks/useInventoryList';
import { useInventoryDeleteActions } from './hooks/useInventoryDeleteActions';
import { useInventoryHeader } from './hooks/useInventoryHeader';
import FloatingActionButton from '../../components/FloatingActionButton';
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
  const { isDark, primary, muted } = useThemeColors();
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

  const { prefsLoaded, layout, grouped, sortBy, stockLevelSort, handleLayoutChange, handleGroupedChange, handleSortChange } =
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
    onLowStockPress,
  });

  const handleRefresh = useCallback(() => {
    if (grouped) return;
    if (layout === 'grid') {
      gridRef.current?.scrollToOffset({ offset: 0, animated: false });
    } else {
      listRef.current?.scrollToOffset({ offset: 0, animated: false });
    }
    refreshList(grid.clearSelection);
  }, [grouped, layout, refreshList, grid.clearSelection]);

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

  // Record offset only when scrolling settles (drag/momentum end) instead of every
  // frame — keeps the scroll thread free so it stays responsive. Used for tab-switch restore.
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
      <View style={{ paddingHorizontal: horizontalPadding, flexGrow: 1 }}>
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
      </View>
    ),
    [
      horizontalPadding,
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

  // Horizontal inset lives on the rows (below), so the scroll surface itself spans edge to edge.
  const sharedContentContainerStyle = useMemo((): ViewStyle => ({
    width: '100%',
    flexGrow: 1,
    paddingTop: 8,
    paddingBottom: insets.bottom + 120,
    ...SCROLL_GAP_TOUCH,
  }), [insets.bottom]);

  const renderListItem: ListRenderItem<IngredientData> = useCallback(
    ({ item }) => (
      <InventoryListItem
        ingredient={item}
        horizontalPadding={horizontalPadding}
        isUpdating={readIsSyncing(item._id)}
        onEditById={openEditById}
        onAdjustById={openAdjustById}
        onDeleteById={deleteById}
        onStepAdjust={handleStepAdjust}
      />
    ),
    [horizontalPadding, readIsSyncing, openEditById, openAdjustById, deleteById, handleStepAdjust]
  );

  const renderGridRow: ListRenderItem<GridRowData> = useCallback(
    ({ item: row }) => (
      <InventoryGridRow
        row={row}
        cardWidth={cardWidth}
        horizontalPadding={horizontalPadding}
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
      horizontalPadding,
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

  const listExtraData = pendingVersion;
  const gridExtraData = useMemo(
    () => `${grid.selectionTick}-${pendingVersion}`,
    [grid.selectionTick, pendingVersion]
  );

  /**
   * Virtualize the list: keep only a small window of rows mounted so scrolling stays
   * smooth even with remote images. Fixed row heights + getItemLayout prevent blank
   * cells, and the tab freezes/unmounts offscreen so idle tabs cost nothing.
   */
  const inventoryListProps = useMemo(
    () => ({ ...SCROLL_LIST_PROPS, ...LIST_VIRTUALIZATION_PROPS }),
    []
  );

  const gridPerfProps = useMemo(
    () => ({ ...SCROLL_LIST_PROPS, ...GRID_VIRTUALIZATION_PROPS }),
    []
  );

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

      {prefsLoaded ? (
        <View style={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 4 }}>
          <View className="flex-row bg-card dark:bg-card-dark border border-border dark:border-border-dark rounded-2xl p-1">
            <TouchableOpacity
              onPress={() => handleGroupedChange(false)}
              activeOpacity={0.8}
              className={`flex-1 flex-row items-center justify-center py-2 rounded-xl ${!grouped ? 'bg-primary/15' : ''}`}
              style={{ gap: 6 }}
            >
              <Ionicons name="cube-outline" size={16} color={!grouped ? primary : muted} />
              <Text className={`text-xs font-bold ${!grouped ? 'text-primary' : 'text-muted dark:text-muted-dark'}`}>
                Ingredients
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleGroupedChange(true)}
              activeOpacity={0.8}
              className={`flex-1 flex-row items-center justify-center py-2 rounded-xl ${grouped ? 'bg-primary/15' : ''}`}
              style={{ gap: 6 }}
            >
              <Ionicons name="folder-outline" size={16} color={grouped ? primary : muted} />
              <Text className={`text-xs font-bold ${grouped ? 'text-primary' : 'text-muted dark:text-muted-dark'}`}>
                Folders
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : null}

      {!grouped ? (
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
      ) : null}

      {!grouped ? (
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
      ) : null}

      {isFocused ? (
        grouped ? (
          <FolderGrid navigation={navigation} layout={layout} />
        ) : layout === 'grid' ? (
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
              onScrollEndDrag={handleGridScroll}
              onMomentumScrollEnd={handleGridScroll}
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
              onScrollEndDrag={handleListScroll}
              onMomentumScrollEnd={handleListScroll}
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

      {!grouped && !gridSelection.active ? (
        <FloatingActionButton onPress={onAddPress} icon="add" />
      ) : null}

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
