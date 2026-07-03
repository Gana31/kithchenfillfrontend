import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Input from '../../../components/Input';
import Button from '../../../components/Button';
import { useThemeColors } from '../../../hooks/useThemeColors';
import { useAppDispatch } from '../../../store/store';
import { showToast } from '../../../store/toastSlice';
import {
  FolderData,
  useCreateFolderMutation,
  useUpdateFolderMutation,
  useDeleteFolderMutation,
} from '../foldersApi';
import FolderIcon from './FolderIcon';

export const FOLDER_COLORS = [
  '#FF6B00',
  '#EF4444',
  '#10B981',
  '#3B82F6',
  '#A855F7',
  '#EAB308',
  '#EC4899',
  '#14B8A6',
  '#6366F1',
  '#F97316',
];

interface FolderFormModalProps {
  visible: boolean;
  onClose: () => void;
  folder?: FolderData | null;
  /** Called after a successful create — lets callers auto-select the new folder. */
  onCreated?: (folder: FolderData) => void;
}

export default function FolderFormModal({ visible, onClose, folder, onCreated }: FolderFormModalProps) {
  const { muted, danger, text } = useThemeColors();
  const dispatch = useAppDispatch();
  const [createFolder, { isLoading: isCreating }] = useCreateFolderMutation();
  const [updateFolder, { isLoading: isUpdating }] = useUpdateFolderMutation();
  const [deleteFolder, { isLoading: isDeleting }] = useDeleteFolderMutation();

  const [name, setName] = useState('');
  const [color, setColor] = useState(FOLDER_COLORS[0]);
  const [formError, setFormError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);

  const isEdit = Boolean(folder);

  useEffect(() => {
    if (folder) {
      setName(folder.name);
      setColor(folder.color || FOLDER_COLORS[0]);
    } else {
      setName('');
      setColor(FOLDER_COLORS[0]);
    }
    setFormError('');
    setConfirmDelete(false);
  }, [folder, visible]);

  const handleSave = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setFormError('Folder name is required.');
      return;
    }
    setFormError('');
    try {
      if (folder) {
        await updateFolder({ id: folder._id, body: { name: trimmed, color } }).unwrap();
        dispatch(showToast({ title: 'Saved', message: 'Folder updated.', type: 'success' }));
      } else {
        const result = await createFolder({ name: trimmed, color }).unwrap();
        dispatch(showToast({ title: 'Created', message: 'Folder created.', type: 'success' }));
        onCreated?.(result.folder);
      }
      onClose();
    } catch (err: any) {
      setFormError(err?.data?.error || 'Failed to save folder.');
    }
  };

  const handleDelete = async () => {
    if (!folder) return;
    try {
      await deleteFolder(folder._id).unwrap();
      dispatch(
        showToast({
          title: 'Deleted',
          message: 'Folder deleted. Its ingredients are now ungrouped.',
          type: 'success',
        })
      );
      onClose();
    } catch (err: any) {
      setFormError(err?.data?.error || 'Failed to delete folder.');
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View className="flex-1 bg-black/60 justify-end">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="w-full">
          <View className="bg-card dark:bg-card-dark rounded-t-[32px] border-t border-border dark:border-border-dark px-6 pt-6 pb-10 shadow-2xl">
            <View className="w-12 h-1.5 bg-border dark:bg-border-dark rounded-full mx-auto mb-6" />

            <View className="flex-row justify-between items-center mb-6">
              <Text className="text-xl font-semibold text-text dark:text-text-dark">
                {isEdit ? 'Edit Folder' : 'New Folder'}
              </Text>
              <TouchableOpacity
                onPress={onClose}
                className="w-8 h-8 rounded-full bg-border/20 items-center justify-center"
              >
                <Ionicons name="close" size={20} color={muted} />
              </TouchableOpacity>
            </View>

            {formError ? (
              <View className="mb-4 bg-red-500/10 border border-red-500/20 p-3 rounded-xl">
                <Text className="text-red-500 text-xs font-bold text-center">{formError}</Text>
              </View>
            ) : null}

            {/* Folder preview (icon tinted with chosen color) */}
            <View className="items-center mb-5">
              <FolderIcon color={color} size={64} />
            </View>

            <Input
              label="Folder Name"
              placeholder="e.g. Bar Stock, Dry Store"
              value={name}
              onChangeText={setName}
            />

            <Text className="text-xs font-semibold text-text dark:text-text-dark mb-2 tracking-normal">Color</Text>
            <View className="flex-row flex-wrap mb-6" style={{ gap: 10 }}>
              {FOLDER_COLORS.map((c) => (
                <TouchableOpacity
                  key={c}
                  onPress={() => setColor(c)}
                  activeOpacity={0.8}
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 18,
                    backgroundColor: c,
                    borderWidth: color === c ? 3 : 0,
                    borderColor: text,
                  }}
                />
              ))}
            </View>

            <Button
              label={isEdit ? 'Save Changes' : 'Create Folder'}
              onPress={handleSave}
              loading={isCreating || isUpdating}
              className="shadow-lg shadow-primary/20"
            />

            {isEdit ? (
              confirmDelete ? (
                <View className="flex-row mt-3" style={{ gap: 8 }}>
                  <TouchableOpacity
                    onPress={() => setConfirmDelete(false)}
                    activeOpacity={0.7}
                    className="flex-1 py-3 rounded-xl border border-border dark:border-border-dark items-center"
                  >
                    <Text className="text-xs font-bold text-muted dark:text-muted-dark">Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleDelete}
                    disabled={isDeleting}
                    activeOpacity={0.7}
                    className="flex-1 py-3 rounded-xl bg-red-500/10 border border-red-500/30 items-center"
                  >
                    <Text className="text-xs font-bold text-red-500">
                      {isDeleting ? 'Deleting...' : 'Confirm Delete'}
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  onPress={() => setConfirmDelete(true)}
                  activeOpacity={0.7}
                  className="mt-3 py-3 rounded-xl items-center flex-row justify-center"
                  style={{ gap: 6 }}
                >
                  <Ionicons name="trash-outline" size={15} color={danger} />
                  <Text className="text-xs font-bold text-red-500">Delete Folder</Text>
                </TouchableOpacity>
              )
            ) : null}

            {isEdit ? (
              <Text className="text-[10px] text-muted dark:text-muted-dark text-center mt-3 leading-relaxed">
                Deleting a folder keeps its ingredients — they simply move to Ungrouped.
              </Text>
            ) : null}
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}
