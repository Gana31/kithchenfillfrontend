import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useDebouncedValue } from '../../../hooks/useDebouncedValue';
import {
  useGetIngredientsQuery,
  IngredientData,
  INGREDIENTS_PAGE_SIZE,
  STOCK_SORT_FETCH_LIMIT,
} from '../inventoryApi';
import {
  SortOption,
  GRID_COLUMNS,
  sortIngredientsByStockLevel,
} from '../inventoryUtils';
import { applyPendingStock } from './applyPendingStock';

const SEARCH_DEBOUNCE_MS = 300;
const REFRESH_COOLDOWN_MS = 700;

export interface GridRowData {
  id: string;
  items: IngredientData[];
}

interface UseInventoryListOptions {
  prefsLoaded: boolean;
  sortBy: SortOption;
  stockLevelSort: boolean;
  getPendingDelta: (id: string) => number;
  pendingVersion: number;
}

export function useInventoryList({
  prefsLoaded,
  sortBy,
  stockLevelSort,
  getPendingDelta,
  pendingVersion,
}: UseInventoryListOptions) {
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebouncedValue(searchQuery.trim(), SEARCH_DEBOUNCE_MS);
  const [page, setPage] = useState(1);
  const [isManualRefreshing, setIsManualRefreshing] = useState(false);

  const refreshInFlight = useRef(false);
  const suppressLoadMoreUntilRef = useRef(0);
  const canLoadMoreRef = useRef(false);
  const pageRef = useRef(1);
  const loadMoreDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const frozenOrderRef = useRef<string[]>([]);

  pageRef.current = page;

  useEffect(() => {
    setPage(1);
    canLoadMoreRef.current = false;
    frozenOrderRef.current = [];
  }, [debouncedSearch, sortBy]);

  const queryLimit = stockLevelSort ? STOCK_SORT_FETCH_LIMIT : INGREDIENTS_PAGE_SIZE;
  const queryPage = stockLevelSort ? 1 : page;

  const { data, isLoading, isFetching, error, refetch } = useGetIngredientsQuery(
    {
      page: queryPage,
      limit: queryLimit,
      search: debouncedSearch,
      sortBy,
    },
    { skip: !prefsLoaded }
  );

  const ingredients = data?.ingredients ?? [];
  const hasMore = data?.pagination?.hasMore ?? false;
  const lowStockCount = data?.lowStockCount ?? 0;
  const totalCount = data?.pagination?.total ?? ingredients.length;

  const displayIngredients = useMemo(() => {
    const serverOrdered = stockLevelSort
      ? sortIngredientsByStockLevel(ingredients, sortBy === 'stock-desc' ? 'desc' : 'asc')
      : ingredients;

    const hasPending = ingredients.some((item) => getPendingDelta(item._id) !== 0);

    if (!hasPending) {
      frozenOrderRef.current = serverOrdered.map((item) => item._id);
    }

    const orderIds =
      frozenOrderRef.current.length > 0
        ? frozenOrderRef.current
        : serverOrdered.map((item) => item._id);

    const byId = new Map(serverOrdered.map((item) => [item._id, item]));
    const seen = new Set<string>();

    const resolvedIds = [
      ...orderIds.filter((id) => {
        if (!byId.has(id)) return false;
        seen.add(id);
        return true;
      }),
      ...serverOrdered.map((item) => item._id).filter((id) => !seen.has(id)),
    ];

    return resolvedIds.map((id) => {
      const item = byId.get(id)!;
      return applyPendingStock(item, getPendingDelta(id));
    });
  }, [ingredients, sortBy, stockLevelSort, pendingVersion, getPendingDelta]);

  const listSortKey = useMemo(
    () =>
      `${sortBy}|${displayIngredients.length}|${displayIngredients[0]?._id ?? ''}|${displayIngredients[displayIngredients.length - 1]?._id ?? ''}`,
    [displayIngredients, sortBy]
  );

  const gridRows = useMemo((): GridRowData[] => {
    const rows: GridRowData[] = [];
    for (let i = 0; i < displayIngredients.length; i += GRID_COLUMNS) {
      const slice = displayIngredients.slice(i, i + GRID_COLUMNS);
      rows.push({
        id: slice.map((item) => item._id).join('|'),
        items: slice,
      });
    }
    return rows;
  }, [displayIngredients]);

  const finishRefresh = useCallback(() => {
    refreshInFlight.current = false;
    setIsManualRefreshing(false);
  }, []);

  const handleRefresh = useCallback(
    async (clearSelection?: () => void) => {
      if (refreshInFlight.current) return;
      refreshInFlight.current = true;
      setIsManualRefreshing(true);
      canLoadMoreRef.current = false;
      suppressLoadMoreUntilRef.current = Date.now() + REFRESH_COOLDOWN_MS;
      clearSelection?.();
      frozenOrderRef.current = [];

      try {
        if (pageRef.current !== 1) {
          setPage(1);
        }
        await refetch();
      } catch {
        // RTK surfaces query errors via `error`
      } finally {
        finishRefresh();
      }
    },
    [refetch, finishRefresh]
  );

  const loadMore = useCallback(() => {
    if (stockLevelSort) return;
    if (refreshInFlight.current) return;
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
  }, [stockLevelSort, isFetching, isManualRefreshing, hasMore]);

  useEffect(() => {
    if (stockLevelSort) return;
    if (!prefsLoaded || !hasMore || isFetching || isManualRefreshing) return;
    if (Date.now() < suppressLoadMoreUntilRef.current) return;

    canLoadMoreRef.current = true;
    const timer = setTimeout(() => {
      setPage((current) => current + 1);
    }, 150);

    return () => clearTimeout(timer);
  }, [prefsLoaded, stockLevelSort, hasMore, isFetching, isManualRefreshing, page, ingredients.length]);

  useEffect(() => {
    return () => {
      if (loadMoreDebounceRef.current) {
        clearTimeout(loadMoreDebounceRef.current);
      }
    };
  }, []);

  const enableLoadMore = useCallback(() => {
    if (isManualRefreshing || refreshInFlight.current) return;
    canLoadMoreRef.current = true;
  }, [isManualRefreshing]);

  const suppressLoadMore = useCallback(() => {
    suppressLoadMoreUntilRef.current = Date.now() + 600;
    canLoadMoreRef.current = false;
  }, []);

  const resetPage = useCallback(() => setPage(1), []);

  const hasLoadedInventory = data !== undefined;
  const isInitialInventoryLoading =
    !prefsLoaded || (!hasLoadedInventory && (isLoading || isFetching));
  const isLoadingMore =
    !stockLevelSort &&
    !refreshInFlight.current &&
    !isManualRefreshing &&
    isFetching &&
    page > 1;

  return {
    searchQuery,
    setSearchQuery,
    debouncedSearch,
    page,
    resetPage,
    ingredients,
    displayIngredients,
    gridRows,
    listSortKey,
    lowStockCount,
    totalCount,
    hasMore,
    error,
    isFetching,
    hasLoadedInventory,
    isInitialInventoryLoading,
    isLoadingMore,
    isManualRefreshing,
    handleRefresh,
    loadMore,
    enableLoadMore,
    suppressLoadMore,
  };
}
