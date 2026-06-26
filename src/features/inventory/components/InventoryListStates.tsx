import React from 'react';
import { LoadingView, ErrorState, EmptyStateCard } from '../../../components/AsyncStateViews';

interface InventoryListStatesProps {
  isInitialLoading: boolean;
  error: unknown;
  onRetry: () => void;
  hasLoadedInventory: boolean;
  totalCount: number;
  debouncedSearch: string;
  searchQuery: string;
  displayCount: number;
  isFetching: boolean;
}

export default function InventoryListStates({
  isInitialLoading,
  error,
  onRetry,
  hasLoadedInventory,
  totalCount,
  debouncedSearch,
  searchQuery,
  displayCount,
  isFetching,
}: InventoryListStatesProps) {
  if (isInitialLoading) {
    return <LoadingView message="Loading inventory..." />;
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
            : 'No ingredients found for this sort.'
        }
      />
    );
  }

  return null;
}
