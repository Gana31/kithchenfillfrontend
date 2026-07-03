import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, Modal, TouchableOpacity, FlatList, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import SearchBar from '../../../components/SearchBar';
import Button from '../../../components/Button';
import { useThemeColors } from '../../../hooks/useThemeColors';
import { useAppDispatch } from '../../../store/store';
import { showToast } from '../../../store/toastSlice';
import { useGetIngredientsQuery, useBulkSetFolderMutation, IngredientData } from '../inventoryApi';
import { formatStock } from '../inventoryUtils';

interface IngredientMultiSelectModalProps {
  visible: boolean;
  onClose: () => void;
  targetFolderId: string;
  targetFolderName?: string;
}

/** Pick multiple existing ingredients (currently outside this folder) and add them into it. */
export default function IngredientMultiSelectModal({
  visible,
  onClose,
  targetFolderId,
  targetFolderName,
}: IngredientMultiSelectModalProps) {
  const { primary, muted } = useThemeColors();
  const dispatch = useAppDispatch();
  const [bulkSetFolder, { isLoading: isSaving }] = useBulkSetFolderMutation();

  const { data, isLoading } = useGetIngredientsQuery(
    { page: 1, limit: 500, search: '', sortBy: 'name-asc', stockFilter: 'all' },
    { skip: !visible }
  );

  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (visible) {
      setSearch('');
      setSelected(new Set());
    }
  }, [visible]);

  // Candidates = ingredients not already in this folder.
  const candidates = useMemo(() => {
    const all = data?.ingredients ?? [];
    const notInFolder = all.filter((ing) => (ing.folderId ?? null) !== targetFolderId);
    if (!search.trim()) return notInFolder;
    const q = search.trim().toLowerCase();
    return notInFolder.filter((ing) => ing.name.toLowerCase().includes(q));
  }, [data, search, targetFolderId]);

  const allSelected = candidates.length > 0 && candidates.every((c) => selected.has(c._id));

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    setSelected((prev) => {
      if (candidates.every((c) => prev.has(c._id))) {
        const next = new Set(prev);
        candidates.forEach((c) => next.delete(c._id));
        return next;
      }
      const next = new Set(prev);
      candidates.forEach((c) => next.add(c._id));
      return next;
    });
  };

  const handleConfirm = async () => {
    const ids = Array.from(selected);
    if (ids.length === 0) {
      onClose();
      return;
    }
    try {
      await bulkSetFolder({ ids, folderId: targetFolderId }).unwrap();
      dispatch(
        showToast({
          title: 'Added',
          message: `${ids.length} ${ids.length === 1 ? 'ingredient' : 'ingredients'} added to ${targetFolderName ?? 'folder'}.`,
          type: 'success',
        })
      );
      onClose();
    } catch (err: any) {
      dispatch(showToast({ title: 'Error', message: err?.data?.error || 'Failed to add ingredients.', type: 'error' }));
    }
  };

  const renderItem = ({ item }: { item: IngredientData }) => {
    const isChecked = selected.has(item._id);
    return (
      <TouchableOpacity
        onPress={() => toggle(item._id)}
        activeOpacity={0.7}
        className="flex-row items-center py-2.5 px-1"
      >
        <Ionicons
          name={isChecked ? 'checkbox' : 'square-outline'}
          size={22}
          color={isChecked ? primary : muted}
          style={{ marginRight: 12 }}
        />
        {item.image ? (
          <Image source={{ uri: item.image }} style={{ width: 38, height: 38, borderRadius: 10 }} />
        ) : (
          <View
            className="items-center justify-center bg-border/20"
            style={{ width: 38, height: 38, borderRadius: 10 }}
          >
            <Ionicons name="cube-outline" size={18} color={muted} />
          </View>
        )}
        <View className="flex-1 ml-3">
          <Text className="text-sm font-semibold text-text dark:text-text-dark" numberOfLines={1}>
            {item.name}
          </Text>
          <Text className="text-[11px] font-semibold text-muted dark:text-muted-dark mt-0.5">
            {formatStock(item.currentStock, item.unitRelation.baseUnit)}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const selectedCount = selected.size;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View className="flex-1 bg-black/60 justify-end">
        <View className="bg-card dark:bg-card-dark rounded-t-[32px] border-t border-border dark:border-border-dark px-6 pt-6 pb-8 shadow-2xl" style={{ maxHeight: '85%' }}>
          <View className="w-12 h-1.5 bg-border dark:bg-border-dark rounded-full mx-auto mb-5" />

          <View className="flex-row justify-between items-center mb-3">
            <Text className="text-xl font-semibold text-text dark:text-text-dark">Add Existing</Text>
            <TouchableOpacity
              onPress={onClose}
              className="w-8 h-8 rounded-full bg-border/20 items-center justify-center"
            >
              <Ionicons name="close" size={20} color={muted} />
            </TouchableOpacity>
          </View>

          <SearchBar
            placeholder="Search ingredients..."
            value={search}
            onChangeText={setSearch}
          />

          <View className="flex-row justify-between items-center mb-1 mt-1">
            <TouchableOpacity onPress={toggleSelectAll} activeOpacity={0.7} className="flex-row items-center" style={{ gap: 6 }}>
              <Ionicons name={allSelected ? 'checkbox' : 'square-outline'} size={18} color={allSelected ? primary : muted} />
              <Text className="text-xs font-bold text-primary">{allSelected ? 'Unselect all' : 'Select all'}</Text>
            </TouchableOpacity>
            <Text className="text-[11px] font-semibold text-muted dark:text-muted-dark">
              {selectedCount} selected
            </Text>
          </View>

          <FlatList
            data={candidates}
            keyExtractor={(item) => item._id}
            renderItem={renderItem}
            style={{ maxHeight: 360 }}
            keyboardShouldPersistTaps="handled"
            ListEmptyComponent={
              <Text className="text-xs font-semibold text-muted dark:text-muted-dark text-center py-8">
                {isLoading ? 'Loading...' : 'No ingredients available to add.'}
              </Text>
            }
          />

          <Button
            label={selectedCount > 0 ? `Add ${selectedCount} to folder` : 'Add to folder'}
            onPress={handleConfirm}
            loading={isSaving}
            className={`mt-4 ${selectedCount === 0 ? 'opacity-50' : ''}`}
          />
        </View>
      </View>
    </Modal>
  );
}
