import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '../../../hooks/useThemeColors';
import { useGetFoldersQuery } from '../foldersApi';
import FolderFormModal from './FolderFormModal';
import FolderIcon from './FolderIcon';

interface FolderPickerProps {
  value: string | null;
  onChange: (folderId: string | null) => void;
}

/** Horizontal chip selector for assigning an ingredient to a folder (or none), with inline create. */
export default function FolderPicker({ value, onChange }: FolderPickerProps) {
  const { muted, primary } = useThemeColors();
  const { data } = useGetFoldersQuery();
  const folders = data?.folders ?? [];
  const [createVisible, setCreateVisible] = useState(false);

  const noneSelected = !value;

  return (
    <View>
      <Text className="text-xs font-semibold text-text dark:text-text-dark mb-2 tracking-normal">
        Folder
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="mb-5"
        contentContainerStyle={{ gap: 8, paddingVertical: 4 }}
      >
        <TouchableOpacity
          onPress={() => onChange(null)}
          activeOpacity={0.7}
          className={`flex-row py-2 px-3 rounded-full border items-center ${
            noneSelected ? 'bg-primary/10 border-primary' : 'bg-border/20 border-border dark:border-border-dark'
          }`}
        >
          <Ionicons
            name="remove-circle-outline"
            size={14}
            color={noneSelected ? primary : muted}
            style={{ marginRight: 6 }}
          />
          <Text className={`text-xs font-bold ${noneSelected ? 'text-primary' : 'text-muted dark:text-muted-dark'}`}>
            None
          </Text>
        </TouchableOpacity>

        {folders.map((folder) => {
          const isSelected = value === folder._id;
          return (
            <TouchableOpacity
              key={folder._id}
              onPress={() => onChange(folder._id)}
              activeOpacity={0.7}
              className="flex-row py-2 px-3 rounded-full border items-center"
              style={{
                backgroundColor: isSelected ? `${folder.color}1A` : undefined,
                borderColor: isSelected ? folder.color : undefined,
              }}
            >
              <View style={{ marginRight: 6 }}>
                <FolderIcon color={folder.color} size={15} />
              </View>
              <Text
                className="text-xs font-bold"
                style={{ color: isSelected ? folder.color : muted }}
              >
                {folder.name}
              </Text>
            </TouchableOpacity>
          );
        })}

        {/* Inline create shortcut */}
        <TouchableOpacity
          onPress={() => setCreateVisible(true)}
          activeOpacity={0.7}
          className="flex-row py-2 px-3 rounded-full border border-dashed border-primary/60 bg-primary/5 items-center"
        >
          <Ionicons name="add" size={14} color={primary} style={{ marginRight: 4 }} />
          <Text className="text-xs font-bold text-primary">New Folder</Text>
        </TouchableOpacity>
      </ScrollView>

      <FolderFormModal
        visible={createVisible}
        onClose={() => setCreateVisible(false)}
        onCreated={(folder) => onChange(folder._id)}
      />
    </View>
  );
}
