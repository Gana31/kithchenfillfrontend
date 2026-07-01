import React from 'react';
import { LoadingView, ErrorState, EmptyStateCard } from '../../../components/AsyncStateViews';
import { StockLevelFilter } from '../inventoryUtils';

const STOCK_FILTER_EMPTY_MESSAGE: Record<Exclude<StockLevelFilter, 'all'>, string> = {
  low: 'No low stock ingredients in this list.',
  average: 'No average stock ingredients in this list.',
  high: 'No high stock ingredients in this list.',
};

const FILTER_LOADING_MESSAGE: Record<StockLevelFilter, string> = {
  all: 'Loading ingredients...',
  low: 'Loading low stock items...',
  average: 'Loading average stock items...',
  high: 'Loading high stock items...',
};

interface InventoryListStatesProps {
  isInitialLoading: boolean;
  isQueryReloading: boolean;
  error: unknown;
  onRetry: () => void;
  hasLoadedInventory: boolean;
  totalCount: number;
  debouncedSearch: string;
  searchQuery: string;
  stockFilter: StockLevelFilter;
  displayCount: number;
  isFetching: boolean;
}

export default function InventoryListStates({
  isInitialLoading,
  isQueryReloading,
  error,
  onRetry,
  hasLoadedInventory,
  totalCount,
  debouncedSearch,
  searchQuery,
  stockFilter,
  displayCount,
  isFetching,
}: InventoryListStatesProps) {
  if (isInitialLoading) {
    return <LoadingView message="Loading inventory..." />;
  }

  if (isQueryReloading) {
    return <LoadingView message={FILTER_LOADING_MESSAGE[stockFilter]} />;
  }

  if (error) {
    return <ErrorState message="Error fetching inventory" onRetry={onRetry} />;
  }

  if (hasLoadedInventory && totalCount === 0 && !debouncedSearch && !isFetching) {
    return (
      <EmptyStateCard message="No ingredients in stock. Tap the '+' button in the top right to register your first ingredient." />
    );
  }

  if (hasLoadedInventory && displayCount === 0 && !isFetching) {
    return (
      <EmptyStateCard
        message={
          debouncedSearch
            ? `No ingredients match "${searchQuery}"`
            : stockFilter !== 'all'
              ? STOCK_FILTER_EMPTY_MESSAGE[stockFilter]
              : 'No ingredients found for this sort.'
        }
      />
    );
  }

  return null;
}
