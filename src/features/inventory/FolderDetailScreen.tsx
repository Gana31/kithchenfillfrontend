import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  RefreshControl,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeColors } from '../../hooks/useThemeColors';
import { EmptyStateCard, LoadingView, ErrorState } from '../../components/AsyncStateViews';
import { SCROLL_LIST_PROPS } from '../../components/scrollUtils';
import { useAppDispatch } from '../../store/store';
import { showToast } from '../../store/toastSlice';
import {
  useGetIngredientsQuery,
  useBulkSetFolderMutation,
  IngredientData,
} from './inventoryApi';
import { InventoryLayout, formatStock } from './inventoryUtils';
import AddIngredientModal from './components/AddIngredientModal';
import FolderIcon from './components/FolderIcon';
import FolderChooserModal from './components/FolderChooserModal';
import IngredientMultiSelectModal from './components/IngredientMultiSelectModal';
import FloatingActionButton from '../../components/FloatingActionButton';

interface FolderDetailScreenProps {
  navigation: any;
  route: {
    params: {
      folderId: string;
      folderName?: string;
      folderColor?: string;
    };
  };
}

const HPAD = 16;
const GAP = 10;
const COLUMNS = 3;

export default function FolderDetailScreen({ navigation, route }: FolderDetailScreenProps) {
  const { folderId, folderName = 'Folder', folderColor } = route.params;
  const { primary, muted, text, isDark, background } = useThemeColors();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const dispatch = useAppDispatch();
  const accent = folderColor || primary;
  const isUngrouped = folderId === 'ungrouped';

  const [addVisible, setAddVisible] = useState(false);
  const [editing, setEditing] = useState<IngredientData | null>(null);
  const [layout, setLayout] = useState<InventoryLayout>('list');
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [addExistingVisible, setAddExistingVisible] = useState(false);
  const [chooserVisible, setChooserVisible] = useState(false);
  const isGrid = layout === 'grid';

  const [bulkSetFolder, { isLoading: isMoving }] = useBulkSetFolderMutation();

  const { data, isLoading, isFetching, error, refetch } = useGetIngredientsQuery({
    page: 1,
    limit: 200,
    search: '',
    sortBy: 'name-asc',
    stockFilter: 'all',
    folder: folderId,
  });

  const ingredients = useMemo(() => data?.ingredients ?? [], [data]);
  const cardWidth = (width - HPAD * 2 - GAP * (COLUMNS - 1)) / COLUMNS;

  // If the folder becomes empty, leave select mode.
  useEffect(() => {
    if (ingredients.length === 0 && selectMode) {
      setSelectMode(false);
      setSelected(new Set());
    }
  }, [ingredients.length, selectMode]);

  const openAdd = useCallback(() => {
    setEditing(null);
    setAddVisible(true);
  }, []);

  const openEdit = useCallback((ingredient: IngredientData) => {
    setEditing(ingredient);
    setAddVisible(true);
  }, []);

  const toggleSelect = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const exitSelectMode = useCallback(() => {
    setSelectMode(false);
    setSelected(new Set());
  }, []);

  const allSelected = ingredients.length > 0 && ingredients.every((i) => selected.has(i._id));
  const toggleSelectAll = useCallback(() => {
    setSelected((prev) => {
      if (ingredients.every((i) => prev.has(i._id))) return new Set();
      return new Set(ingredients.map((i) => i._id));
    });
  }, [ingredients]);

  const handleMoveTo = useCallback(
    async (destFolderId: string | null) => {
      const ids = Array.from(selected);
      setChooserVisible(false);
      if (ids.length === 0) return;
      try {
        await bulkSetFolder({ ids, folderId: destFolderId }).unwrap();
        dispatch(
          showToast({
            title: 'Moved',
            message: `${ids.length} ${ids.length === 1 ? 'ingredient' : 'ingredients'} moved.`,
            type: 'success',
          })
        );
        exitSelectMode();
      } catch (err: any) {
        dispatch(showToast({ title: 'Error', message: err?.data?.error || 'Failed to move ingredients.', type: 'error' }));
      }
    },
    [selected, bulkSetFolder, dispatch, exitSelectMode]
  );

  const onItemPress = useCallback(
    (item: IngredientData) => {
      if (selectMode) toggleSelect(item._id);
      else openEdit(item);
    },
    [selectMode, toggleSelect, openEdit]
  );

  const onItemLongPress = useCallback(
    (item: IngredientData) => {
      if (!selectMode) {
        setSelectMode(true);
        setSelected(new Set([item._id]));
      }
    },
    [selectMode]
  );

  const renderItem = useCallback(
    ({ item }: { item: IngredientData }) => {
      const isChecked = selected.has(item._id);

      if (isGrid) {
        return (
          <TouchableOpacity
            onPress={() => onItemPress(item)}
            onLongPress={() => onItemLongPress(item)}
            activeOpacity={0.85}
            style={{ width: cardWidth }}
            className={`rounded-2xl border bg-card dark:bg-card-dark p-2.5 ${
              isChecked ? 'border-primary' : 'border-border/40 dark:border-border-dark/40'
            }`}
          >
            <View>
              {item.image ? (
                <Image source={{ uri: item.image }} style={{ width: '100%', height: cardWidth - 20, borderRadius: 10 }} />
              ) : (
                <View
                  className="items-center justify-center"
                  style={{ width: '100%', height: cardWidth - 20, borderRadius: 10, backgroundColor: `${accent}1A` }}
                >
                  <Ionicons name="cube-outline" size={22} color={accent} />
                </View>
              )}
              {selectMode ? (
                <View className="absolute top-1 right-1">
                  <Ionicons name={isChecked ? 'checkbox' : 'square-outline'} size={20} color={isChecked ? primary : '#FFFFFF'} />
                </View>
              ) : null}
            </View>
            <Text className="text-[12px] font-semibold text-text dark:text-text-dark mt-2" numberOfLines={1}>
              {item.name}
            </Text>
            <Text className="text-[10px] font-semibold text-muted dark:text-muted-dark mt-0.5" numberOfLines={1}>
              {formatStock(item.currentStock, item.unitRelation.baseUnit)}
            </Text>
          </TouchableOpacity>
        );
      }

      return (
        <TouchableOpacity
          onPress={() => onItemPress(item)}
          onLongPress={() => onItemLongPress(item)}
          activeOpacity={0.8}
          className={`flex-row items-center bg-card dark:bg-card-dark rounded-2xl border p-3 mb-3 ${
            isChecked ? 'border-primary' : 'border-border/40 dark:border-border-dark/40'
          }`}
        >
          {selectMode ? (
            <Ionicons
              name={isChecked ? 'checkbox' : 'square-outline'}
              size={22}
              color={isChecked ? primary : muted}
              style={{ marginRight: 10 }}
            />
          ) : null}
          {item.image ? (
            <Image source={{ uri: item.image }} style={{ width: 48, height: 48, borderRadius: 12 }} />
          ) : (
            <View
              className="items-center justify-center"
              style={{ width: 48, height: 48, borderRadius: 12, backgroundColor: `${accent}1A` }}
            >
              <Ionicons name="cube-outline" size={22} color={accent} />
            </View>
          )}
          <View className="flex-1 ml-3">
            <Text className="text-sm font-semibold text-text dark:text-text-dark" numberOfLines={1}>
              {item.name}
            </Text>
            <Text className="text-[11px] font-semibold text-muted dark:text-muted-dark mt-0.5">
              {formatStock(item.currentStock, item.unitRelation.baseUnit)}
              {item.category ? ` · ${item.category}` : ''}
            </Text>
          </View>
          {!selectMode ? (
            <View className="flex-row items-center" style={{ gap: 4 }}>
              <Text className="text-[11px] font-bold text-primary">Move / Edit</Text>
              <Ionicons name="chevron-forward" size={16} color={muted} />
            </View>
          ) : null}
        </TouchableOpacity>
      );
    },
    [isGrid, cardWidth, accent, muted, primary, selected, selectMode, onItemPress, onItemLongPress]
  );

  const selectedCount = selected.size;

  return (
    <View style={{ flex: 1, paddingTop: insets.top, backgroundColor: 'transparent' }}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      {/* Header */}
      <View className="flex-row items-center px-4 py-3" style={{ gap: 12 }}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          hitSlop={10}
          className="w-9 h-9 rounded-full bg-border/20 items-center justify-center"
        >
          <Ionicons name="chevron-back" size={20} color={text} />
        </TouchableOpacity>

        <FolderIcon color={accent} size={26} />

        <View className="flex-1">
          <Text className="text-lg font-semibold text-text dark:text-text-dark" numberOfLines={1}>
            {folderName}
          </Text>
          <Text className="text-[11px] font-semibold text-muted dark:text-muted-dark">
            {ingredients.length} {ingredients.length === 1 ? 'item' : 'items'}
          </Text>
        </View>

        {/* list / grid toggle */}
        <View className="flex-row bg-card dark:bg-card-dark border border-border dark:border-border-dark rounded-xl p-0.5">
          <TouchableOpacity
            onPress={() => setLayout('list')}
            activeOpacity={0.7}
            className={`w-8 h-8 rounded-lg justify-center items-center ${!isGrid ? 'bg-primary/15' : ''}`}
          >
            <Ionicons name="list-outline" size={16} color={!isGrid ? primary : muted} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setLayout('grid')}
            activeOpacity={0.7}
            className={`w-8 h-8 rounded-lg justify-center items-center ${isGrid ? 'bg-primary/15' : ''}`}
          >
            <Ionicons name="grid-outline" size={16} color={isGrid ? primary : muted} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Action bar */}
      {ingredients.length > 0 ? (
        <View className="flex-row items-center justify-between px-4 pb-2" style={{ gap: 8 }}>
          {selectMode ? (
            <>
              <TouchableOpacity onPress={toggleSelectAll} activeOpacity={0.7} className="flex-row items-center" style={{ gap: 6 }}>
                <Ionicons name={allSelected ? 'checkbox' : 'square-outline'} size={18} color={allSelected ? primary : muted} />
                <Text className="text-xs font-bold text-primary">{allSelected ? 'Unselect all' : 'Select all'}</Text>
              </TouchableOpacity>
              <View className="flex-row items-center" style={{ gap: 10 }}>
                <Text className="text-[11px] font-semibold text-muted dark:text-muted-dark">{selectedCount} selected</Text>
                <TouchableOpacity onPress={exitSelectMode} activeOpacity={0.7}>
                  <Text className="text-xs font-bold text-muted dark:text-muted-dark">Cancel</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <>
              <TouchableOpacity
                onPress={() => {
                  setSelectMode(true);
                  setSelected(new Set());
                }}
                activeOpacity={0.7}
                className="flex-row items-center px-3 py-1.5 rounded-full border border-border dark:border-border-dark"
                style={{ gap: 6 }}
              >
                <Ionicons name="checkmark-done-outline" size={15} color={muted} />
                <Text className="text-xs font-bold text-muted dark:text-muted-dark">Select</Text>
              </TouchableOpacity>

              {!isUngrouped ? (
                <TouchableOpacity
                  onPress={() => setAddExistingVisible(true)}
                  activeOpacity={0.7}
                  className="flex-row items-center px-3 py-1.5 rounded-full bg-primary/10 border border-primary/30"
                  style={{ gap: 6 }}
                >
                  <Ionicons name="albums-outline" size={15} color={primary} />
                  <Text className="text-xs font-bold text-primary">Add existing</Text>
                </TouchableOpacity>
              ) : null}
            </>
          )}
        </View>
      ) : null}

      {isLoading ? (
        <LoadingView message="Loading ingredients..." />
      ) : error ? (
        <ErrorState message="Could not load ingredients." onRetry={refetch} />
      ) : (
        <FlatList
          key={layout}
          style={{ flex: 1, backgroundColor: background }}
          data={ingredients}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          numColumns={isGrid ? COLUMNS : 1}
          columnWrapperStyle={isGrid ? { gap: GAP, paddingHorizontal: HPAD } : undefined}
          contentContainerStyle={{
            gap: isGrid ? GAP : 0,
            paddingHorizontal: isGrid ? 0 : HPAD,
            paddingTop: 8,
            paddingBottom: insets.bottom + (selectMode ? 96 : !isUngrouped ? 96 : 40),
            flexGrow: 1,
            backgroundColor: background,
          }}
          {...SCROLL_LIST_PROPS}
          refreshControl={
            <RefreshControl refreshing={isFetching && !isLoading} onRefresh={refetch} tintColor={primary} />
          }
          ListEmptyComponent={
            <View style={{ paddingHorizontal: HPAD }}>
              <EmptyStateCard
                icon="cube-outline"
                title="No ingredients here"
                message={
                  isUngrouped
                    ? 'Every ingredient is assigned to a folder.'
                    : 'Add an ingredient to this folder to get started.'
                }
                actionLabel={isUngrouped ? undefined : 'Add Ingredient'}
                onAction={isUngrouped ? undefined : openAdd}
              />
            </View>
          }
        />
      )}

      {/* Floating move bar in select mode */}
      {selectMode ? (
        <View
          className="absolute left-0 right-0 px-4"
          style={{ bottom: insets.bottom + 16 }}
        >
          <TouchableOpacity
            onPress={() => selectedCount > 0 && setChooserVisible(true)}
            activeOpacity={0.9}
            className={`flex-row items-center justify-center h-12 rounded-2xl bg-primary shadow-lg ${
              selectedCount === 0 ? 'opacity-50' : ''
            }`}
            style={{ gap: 8 }}
          >
            <Ionicons name="folder-open-outline" size={18} color="#FFFFFF" />
            <Text className="text-sm font-bold text-white">
              {isMoving ? 'Moving...' : `Move ${selectedCount > 0 ? selectedCount : ''} to folder`.trim()}
            </Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {!isUngrouped && !selectMode ? (
        <FloatingActionButton onPress={openAdd} icon="add" aboveTabBar={false} />
      ) : null}

      <AddIngredientModal
        visible={addVisible}
        onClose={() => setAddVisible(false)}
        ingredient={editing}
        initialFolderId={isUngrouped ? null : folderId}
      />

      <IngredientMultiSelectModal
        visible={addExistingVisible}
        onClose={() => setAddExistingVisible(false)}
        targetFolderId={folderId}
        targetFolderName={folderName}
      />

      <FolderChooserModal
        visible={chooserVisible}
        onClose={() => setChooserVisible(false)}
        onSelect={handleMoveTo}
        excludeFolderId={folderId}
        title={`Move ${selectedCount} to…`}
      />
    </View>
  );
}
