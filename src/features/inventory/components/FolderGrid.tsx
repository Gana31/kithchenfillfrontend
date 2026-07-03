import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeColors } from '../../../hooks/useThemeColors';
import { EmptyStateCard, LoadingView, ErrorState } from '../../../components/AsyncStateViews';
import { SCROLL_LIST_PROPS } from '../../../components/scrollUtils';
import { InventoryLayout } from '../inventoryUtils';
import { useGetFoldersQuery, FolderData } from '../foldersApi';
import FolderFormModal from './FolderFormModal';
import FolderIcon from './FolderIcon';
import FloatingActionButton from '../../../components/FloatingActionButton';

interface FolderGridProps {
  navigation: any;
  layout: InventoryLayout;
}

const HPAD = 16;
const GAP = 10;
const COLUMNS = 3;
const UNGROUPED_ID = 'ungrouped';

type FolderTile =
  | { kind: 'ungrouped'; count: number }
  | { kind: 'folder'; folder: FolderData };

export default function FolderGrid({ navigation, layout }: FolderGridProps) {
  const { primary, muted } = useThemeColors();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { data, isLoading, error, refetch } = useGetFoldersQuery();

  const [formVisible, setFormVisible] = useState(false);
  const [editingFolder, setEditingFolder] = useState<FolderData | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const listRef = useRef<FlatList<FolderTile>>(null);
  const isRefreshingRef = useRef(false);

  const onRefresh = useCallback(async () => {
    if (isRefreshingRef.current) return;
    isRefreshingRef.current = true;
    setIsRefreshing(true);
    listRef.current?.scrollToOffset({ offset: 0, animated: false });
    try {
      await Promise.all([refetch(), new Promise((resolve) => setTimeout(resolve, 700))]);
    } finally {
      isRefreshingRef.current = false;
      setIsRefreshing(false);
    }
  }, [refetch]);

  useEffect(() => {
    const unsubscribe = (
      navigation as { addListener: (event: string, cb: () => void) => () => void }
    ).addListener('inventoryTabRepress', onRefresh);
    return unsubscribe;
  }, [navigation, onRefresh]);

  const isGrid = layout === 'grid';
  const cardWidth = (width - HPAD * 2 - GAP * (COLUMNS - 1)) / COLUMNS;

  const tiles = useMemo<FolderTile[]>(() => {
    const list: FolderTile[] = [{ kind: 'ungrouped', count: data?.ungroupedCount ?? 0 }];
    (data?.folders ?? []).forEach((folder) => list.push({ kind: 'folder', folder }));
    return list;
  }, [data]);

  const openCreate = useCallback(() => {
    setEditingFolder(null);
    setFormVisible(true);
  }, []);

  const openEdit = useCallback((folder: FolderData) => {
    setEditingFolder(folder);
    setFormVisible(true);
  }, []);

  const openFolder = useCallback(
    (tile: FolderTile) => {
      if (tile.kind === 'ungrouped') {
        navigation.navigate('FolderDetail', {
          folderId: UNGROUPED_ID,
          folderName: 'Ungrouped',
          folderColor: muted,
        });
      } else {
        navigation.navigate('FolderDetail', {
          folderId: tile.folder._id,
          folderName: tile.folder.name,
          folderColor: tile.folder.color,
        });
      }
    },
    [navigation, muted]
  );

  const renderTile = useCallback(
    ({ item }: { item: FolderTile }) => {
      const isUngrouped = item.kind === 'ungrouped';
      const color = isUngrouped ? muted : item.folder.color || primary;
      const name = isUngrouped ? 'Ungrouped' : item.folder.name;
      const count = isUngrouped ? item.count : item.folder.ingredientCount;
      const countLabel = `${count} ${count === 1 ? 'item' : 'items'}`;

      if (isGrid) {
        return (
          <TouchableOpacity
            onPress={() => openFolder(item)}
            activeOpacity={0.85}
            style={{ width: cardWidth }}
            className="rounded-2xl border border-border/40 dark:border-border-dark/40 bg-card dark:bg-card-dark p-3"
          >
            <View className="flex-row items-center justify-between mb-2">
              <FolderIcon color={color} size={30} />
              {!isUngrouped ? (
                <TouchableOpacity onPress={() => openEdit(item.folder)} hitSlop={8} activeOpacity={0.7}>
                  <Ionicons name="ellipsis-horizontal" size={15} color={muted} />
                </TouchableOpacity>
              ) : null}
            </View>
            <Text className="text-[13px] font-semibold text-text dark:text-text-dark" numberOfLines={1}>
              {name}
            </Text>
            <Text className="text-[10px] font-semibold text-muted dark:text-muted-dark mt-0.5">
              {countLabel}
            </Text>
          </TouchableOpacity>
        );
      }

      // List row
      return (
        <TouchableOpacity
          onPress={() => openFolder(item)}
          activeOpacity={0.85}
          className="flex-row items-center rounded-2xl border border-border/40 dark:border-border-dark/40 bg-card dark:bg-card-dark p-3 mb-2.5"
        >
          <View style={{ marginRight: 12 }}>
            <FolderIcon color={color} size={26} />
          </View>
          <View className="flex-1">
            <Text className="text-sm font-semibold text-text dark:text-text-dark" numberOfLines={1}>
              {name}
            </Text>
            <Text className="text-[11px] font-semibold text-muted dark:text-muted-dark mt-0.5">
              {countLabel}
            </Text>
          </View>
          {!isUngrouped ? (
            <TouchableOpacity
              onPress={() => openEdit(item.folder)}
              hitSlop={8}
              activeOpacity={0.7}
              className="w-8 h-8 rounded-full bg-border/20 items-center justify-center mr-1"
            >
              <Ionicons name="ellipsis-horizontal" size={16} color={muted} />
            </TouchableOpacity>
          ) : null}
          <Ionicons name="chevron-forward" size={16} color={muted} />
        </TouchableOpacity>
      );
    },
    [isGrid, cardWidth, muted, primary, openFolder, openEdit]
  );

  if (isLoading) {
    return <LoadingView message="Loading folders..." />;
  }

  if (error) {
    return <ErrorState message="Could not load folders." onRetry={refetch} />;
  }

  return (
    <View style={{ flex: 1, width: '100%' }}>
      <View
        style={{ paddingHorizontal: HPAD, paddingTop: 8, paddingBottom: 12 }}
        className="flex-row items-center justify-end"
      >
        <TouchableOpacity
          onPress={onRefresh}
          disabled={isRefreshing}
          activeOpacity={0.7}
          className="flex-row items-center h-9 px-3 rounded-xl border border-border dark:border-border-dark bg-card dark:bg-card-dark"
          style={{ gap: 6 }}
        >
          {isRefreshing ? (
            <ActivityIndicator size="small" color={primary} />
          ) : (
            <Ionicons name="refresh-outline" size={16} color={muted} />
          )}
          <Text className="text-xs font-bold text-muted dark:text-muted-dark">Refresh</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        ref={listRef}
        key={layout}
        data={tiles}
        keyExtractor={(item) => (item.kind === 'ungrouped' ? UNGROUPED_ID : item.folder._id)}
        renderItem={renderTile}
        numColumns={isGrid ? COLUMNS : 1}
        columnWrapperStyle={isGrid ? { gap: GAP, paddingHorizontal: HPAD } : undefined}
        contentContainerStyle={{
          gap: isGrid ? GAP : 0,
          paddingHorizontal: isGrid ? 0 : HPAD,
          paddingBottom: insets.bottom + 120,
          flexGrow: 1,
        }}
        {...SCROLL_LIST_PROPS}
        ListEmptyComponent={
          <EmptyStateCard
            icon="folder-open-outline"
            title="No folders yet"
            message="Create a folder to group your ingredients however you like."
            actionLabel="New Folder"
            onAction={openCreate}
          />
        }
      />

      <FloatingActionButton onPress={openCreate} icon="add" />

      <FolderFormModal
        visible={formVisible}
        onClose={() => setFormVisible(false)}
        folder={editingFolder}
      />
    </View>
  );
}
