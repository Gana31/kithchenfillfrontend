import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  View,
  BackHandler,
  useWindowDimensions,
  ListRenderItem,
  ViewStyle,
  CellRendererProps,
} from 'react-native';
import { FlatList } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useThemeColors } from '../../hooks/useThemeColors';
import { IngredientData } from './inventoryApi';
import IngredientCard from './components/IngredientCard';
import IngredientGridCard from './components/IngredientGridCard';
import InventoryToolbar from './components/InventoryToolbar';
import InventorySortMenu from './components/InventorySortMenu';
import InventoryListStates from './components/InventoryListStates';
import AddIngredientModal from './components/AddIngredientModal';
import AdjustStockModal from './components/AdjustStockModal';
import ConfirmModal from '../../components/ConfirmModal';
import ScreenContainer from '../../components/ScreenContainer';
import { ListLoadMoreFooter } from '../../components/AsyncStateViews';
import { useGridSelection, GridSelectionState } from './hooks/useGridSelection';
import { useDebouncedStockAdjust } from './hooks/useDebouncedStockAdjust';
import { useInventoryPreferences } from './hooks/useInventoryPreferences';
import { useInventoryList, GridRowData } from './hooks/useInventoryList';
import { useInventoryDeleteActions } from './hooks/useInventoryDeleteActions';
import { useInventoryHeader } from './hooks/useInventoryHeader';
import {
  SortOption,
  getGridCardWidth,
  getGridCardHeight,
  GRID_COLUMNS,
  GRID_GAP,
  GRID_HORIZONTAL_PADDING,
} from './inventoryUtils';

export default function InventoryScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const { isDark } = useThemeColors();
  const cardWidth = getGridCardWidth(screenWidth);

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingIngredient, setEditingIngredient] = useState<IngredientData | null>(null);
  const [isAdjustModalVisible, setIsAdjustModalVisible] = useState(false);
  const [adjustingIngredient, setAdjustingIngredient] = useState<IngredientData | null>(null);
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [selectionClearToken, setSelectionClearToken] = useState(0);
  const [gridSelection, setGridSelection] = useState<GridSelectionState>({
    active: false,
    count: 0,
    total: 0,
    allSelected: false,
  });

  const listRef = useRef<FlatList<IngredientData>>(null);
  const gridRef = useRef<FlatList<GridRowData>>(null);

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
    getPendingDelta,
    pendingVersion,
  });

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

  const onAddPress = useCallback(() => {
    setEditingIngredient(null);
    setIsModalVisible(true);
  }, []);

  useInventoryHeader({
    navigation,
    prefsLoaded,
    layout,
    lowStockCount,
    onLayoutChange,
    onAddPress,
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

  const openEdit = useCallback((item: IngredientData) => {
    setEditingIngredient(item);
    setIsModalVisible(true);
  }, []);

  const openAdjust = useCallback((item: IngredientData) => {
    setAdjustingIngredient(item);
    setIsAdjustModalVisible(true);
  }, []);

  const handleScrollBegin = useCallback(() => {
    enableLoadMore();
    setShowSortMenu(false);
  }, [enableLoadMore]);

  const horizontalPadding = layout === 'grid' ? GRID_HORIZONTAL_PADDING : 24;

  const listEmpty = useMemo(
    () => (
      <InventoryListStates
        isInitialLoading={isInitialInventoryLoading}
        error={error}
        onRetry={handleRefresh}
        hasLoadedInventory={hasLoadedInventory}
        totalCount={totalCount}
        debouncedSearch={debouncedSearch}
        searchQuery={searchQuery}
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
      displayIngredients.length,
      isFetching,
    ]
  );

  const sharedContentContainerStyle = useMemo((): ViewStyle => ({
    width: '100%',
    paddingHorizontal: horizontalPadding,
    paddingTop: 8,
    paddingBottom: insets.bottom + 120,
  }), [horizontalPadding, insets.bottom]);

  const renderListItem: ListRenderItem<IngredientData> = useCallback(
    ({ item }) => (
      <IngredientCard
        ingredient={item}
        isUpdating={isSyncing(item._id)}
        onEdit={() => openEdit(item)}
        onAdjust={() => openAdjust(item)}
        onStepAdjust={(type, baseAmount) => handleStepAdjust(item._id, type, baseAmount)}
        onDelete={() => deleteActions.requestDelete(item)}
      />
    ),
    [isSyncing, handleStepAdjust, openEdit, openAdjust, deleteActions.requestDelete, pendingVersion]
  );

  const renderGridRow: ListRenderItem<GridRowData> = useCallback(
    ({ item: row }) => {
      const emptySlots = GRID_COLUMNS - row.items.length;
      const spacerWidth = emptySlots > 0 ? emptySlots * cardWidth + (emptySlots - 1) * GRID_GAP : 0;

      return (
        <View style={{ width: '100%', height: gridCardHeight, marginBottom: GRID_GAP }} collapsable={false}>
          <View
            style={{ flexDirection: 'row', gap: GRID_GAP, width: '100%', height: gridCardHeight, alignItems: 'stretch' }}
            collapsable={false}
          >
            {row.items.map((item) => (
              <IngredientGridCard
                key={item._id}
                ingredient={item}
                cardWidth={cardWidth}
                cardHeight={gridCardHeight}
                isUpdating={isSyncing(item._id)}
                selectionMode={grid.selectionMode}
                isSelected={grid.selectedIds.has(item._id)}
                onEdit={openEdit}
                onLongPress={grid.enterSelectionWith}
                onToggleSelect={grid.toggleSelect}
                onStepAdjust={handleStepAdjust}
              />
            ))}
            {spacerWidth > 0 ? (
              <View style={{ width: spacerWidth, height: gridCardHeight }} collapsable={false} />
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
      isSyncing,
      openEdit,
      grid.enterSelectionWith,
      grid.toggleSelect,
      handleStepAdjust,
      pendingVersion,
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

  const listData = isInitialInventoryLoading ? [] : displayIngredients;
  const gridData = isInitialInventoryLoading ? [] : gridRows;

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
        horizontalPadding={horizontalPadding}
        topInset={insets.top}
        onClose={() => setShowSortMenu(false)}
        onSortChange={onSortChange}
      />

      {layout === 'grid' ? (
        <View style={{ flex: 1, width: '100%' }} collapsable={false}>
          <FlatList
            ref={gridRef}
            style={{ flex: 1, width: '100%' }}
            data={gridData}
            extraData={{ selectionTick: grid.selectionTick, pendingVersion, sortBy, listSortKey }}
            keyExtractor={(item) => item.id}
            renderItem={renderGridRow}
            CellRendererComponent={renderFullWidthCell}
            ListEmptyComponent={listEmpty}
            ListFooterComponent={<ListLoadMoreFooter visible={isLoadingMore} />}
            contentContainerStyle={sharedContentContainerStyle}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            nestedScrollEnabled
            scrollEventThrottle={16}
            onScrollBeginDrag={handleScrollBegin}
            onMomentumScrollBegin={handleScrollBegin}
            onEndReached={isManualRefreshing ? undefined : loadMore}
            onEndReachedThreshold={0.2}
            removeClippedSubviews={false}
            maxToRenderPerBatch={6}
            updateCellsBatchingPeriod={1}
            windowSize={9}
            initialNumToRender={6}
          />
        </View>
      ) : (
        <FlatList
          ref={listRef}
          key="inventory-list"
          style={{ flex: 1, width: '100%' }}
          data={listData}
          extraData={{ pendingVersion, sortBy, listSortKey }}
          keyExtractor={(item) => item._id}
          renderItem={renderListItem}
          ListEmptyComponent={listEmpty}
          ListFooterComponent={<ListLoadMoreFooter visible={isLoadingMore} />}
          contentContainerStyle={sharedContentContainerStyle}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          nestedScrollEnabled
          scrollEventThrottle={16}
          onScrollBeginDrag={handleScrollBegin}
          onMomentumScrollBegin={handleScrollBegin}
          onEndReached={isManualRefreshing ? undefined : loadMore}
          onEndReachedThreshold={0.2}
          removeClippedSubviews={false}
          maxToRenderPerBatch={10}
          updateCellsBatchingPeriod={1}
          windowSize={11}
          initialNumToRender={10}
          ItemSeparatorComponent={() => <View style={{ height: 16 }} />}
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
