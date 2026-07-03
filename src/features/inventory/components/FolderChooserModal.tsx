import React from 'react';
import { View, Text, Modal, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '../../../hooks/useThemeColors';
import { useGetFoldersQuery } from '../foldersApi';
import FolderIcon from './FolderIcon';

interface FolderChooserModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (folderId: string | null) => void;
  /** Folder to hide from the list (e.g. the current one you're moving from). */
  excludeFolderId?: string;
  title?: string;
}

export default function FolderChooserModal({
  visible,
  onClose,
  onSelect,
  excludeFolderId,
  title = 'Move to folder',
}: FolderChooserModalProps) {
  const { muted } = useThemeColors();
  const { data } = useGetFoldersQuery();
  const folders = (data?.folders ?? []).filter((f) => f._id !== excludeFolderId);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View className="flex-1 bg-black/60 justify-end">
        <View className="bg-card dark:bg-card-dark rounded-t-[32px] border-t border-border dark:border-border-dark px-6 pt-6 pb-10 shadow-2xl">
          <View className="w-12 h-1.5 bg-border dark:bg-border-dark rounded-full mx-auto mb-6" />

          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-xl font-semibold text-text dark:text-text-dark">{title}</Text>
            <TouchableOpacity
              onPress={onClose}
              className="w-8 h-8 rounded-full bg-border/20 items-center justify-center"
            >
              <Ionicons name="close" size={20} color={muted} />
            </TouchableOpacity>
          </View>

          <ScrollView style={{ maxHeight: 360 }} showsVerticalScrollIndicator={false}>
            {excludeFolderId !== 'ungrouped' ? (
              <TouchableOpacity
                onPress={() => onSelect(null)}
                activeOpacity={0.8}
                className="flex-row items-center py-3 px-2 rounded-xl mb-1"
              >
                <View className="w-9 h-9 rounded-xl bg-border/20 items-center justify-center mr-3">
                  <Ionicons name="remove-circle-outline" size={20} color={muted} />
                </View>
                <Text className="text-sm font-semibold text-text dark:text-text-dark">
                  Ungrouped (remove from folder)
                </Text>
              </TouchableOpacity>
            ) : null}

            {folders.map((folder) => (
              <TouchableOpacity
                key={folder._id}
                onPress={() => onSelect(folder._id)}
                activeOpacity={0.8}
                className="flex-row items-center py-3 px-2 rounded-xl mb-1"
              >
                <View className="w-9 h-9 items-center justify-center mr-3">
                  <FolderIcon color={folder.color} size={24} />
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-semibold text-text dark:text-text-dark" numberOfLines={1}>
                    {folder.name}
                  </Text>
                  <Text className="text-[11px] font-semibold text-muted dark:text-muted-dark">
                    {folder.ingredientCount} {folder.ingredientCount === 1 ? 'item' : 'items'}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={muted} />
              </TouchableOpacity>
            ))}

            {folders.length === 0 ? (
              <Text className="text-xs font-semibold text-muted dark:text-muted-dark text-center py-6">
                No other folders yet. Create one first.
              </Text>
            ) : null}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
