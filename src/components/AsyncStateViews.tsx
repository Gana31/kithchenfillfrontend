import React, { ReactNode } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '../hooks/useThemeColors';
import Card from './Card';

interface LoadingViewProps {
  message?: string;
  compact?: boolean;
}

export function LoadingView({ message = 'Loading...', compact = false }: LoadingViewProps) {
  const { primary } = useThemeColors();

  return (
    <View className={compact ? 'py-12 items-center' : 'py-24 justify-center items-center'}>
      <ActivityIndicator size="large" color={primary} />
      <Text className="text-xs text-muted dark:text-muted-dark mt-3 font-semibold tracking-normal">
        {message}
      </Text>
    </View>
  );
}

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
  retryLabel?: string;
}

export function ErrorState({
  message = 'Something went wrong',
  onRetry,
  retryLabel = 'Retry',
}: ErrorStateProps) {
  const { primary, muted } = useThemeColors();

  return (
    <View className="py-20 justify-center items-center">
      <Ionicons name="cloud-offline-outline" size={32} color={muted} />
      <Text className="text-red-500 text-xs font-bold mb-4 mt-3 text-center px-6">{message}</Text>
      {onRetry ? (
        <TouchableOpacity onPress={onRetry} className="px-4 py-2 rounded-xl bg-card border border-border">
          <Text className="text-primary text-xs font-semibold uppercase">{retryLabel}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

interface EmptyStateCardProps {
  icon?: keyof typeof Ionicons.glyphMap;
  title?: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyStateCard({
  icon,
  title,
  message,
  actionLabel,
  onAction,
}: EmptyStateCardProps) {
  const { muted, primary } = useThemeColors();

  return (
    <Card className="p-8 items-center justify-center">
      {icon ? <Ionicons name={icon} size={36} color={muted} /> : null}
      {title ? (
        <Text className="text-base font-semibold text-text dark:text-text-dark mt-3">{title}</Text>
      ) : null}
      <Text
        className={`text-muted dark:text-muted-dark text-xs font-bold text-center ${title ? 'mt-1' : ''}`}
      >
        {message}
      </Text>
      {actionLabel && onAction ? (
        <TouchableOpacity
          onPress={onAction}
          className="mt-4 px-4 py-2 rounded-xl bg-primary/15 border border-primary"
        >
          <Text className="text-sm font-semibold text-primary">{actionLabel}</Text>
        </TouchableOpacity>
      ) : null}
    </Card>
  );
}

interface ListLoadMoreFooterProps {
  visible: boolean;
}

export function ListLoadMoreFooter({ visible }: ListLoadMoreFooterProps) {
  const { primary } = useThemeColors();
  if (!visible) return null;

  return (
    <View className="py-6 items-center">
      <ActivityIndicator size="small" color={primary} />
    </View>
  );
}

interface AsyncContentProps {
  isLoading: boolean;
  error: unknown;
  isEmpty: boolean;
  loadingMessage?: string;
  errorMessage?: string;
  emptyMessage: string;
  emptyTitle?: string;
  emptyIcon?: keyof typeof Ionicons.glyphMap;
  emptyActionLabel?: string;
  onEmptyAction?: () => void;
  onRetry?: () => void;
  children: ReactNode;
}

export function AsyncContent({
  isLoading,
  error,
  isEmpty,
  loadingMessage,
  errorMessage,
  emptyMessage,
  emptyTitle,
  emptyIcon,
  emptyActionLabel,
  onEmptyAction,
  onRetry,
  children,
}: AsyncContentProps) {
  if (isLoading) return <LoadingView message={loadingMessage} />;
  if (error) return <ErrorState message={errorMessage} onRetry={onRetry} />;
  if (isEmpty) {
    return (
      <EmptyStateCard
        icon={emptyIcon}
        title={emptyTitle}
        message={emptyMessage}
        actionLabel={emptyActionLabel}
        onAction={onEmptyAction}
      />
    );
  }
  return <>{children}</>;
}
