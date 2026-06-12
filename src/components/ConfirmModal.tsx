import React from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Card from './Card';
import { useThemeColors } from '../hooks/useThemeColors';

interface ConfirmModalProps {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDestructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({
  visible,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  isDestructive = false,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  const { primary, danger, muted } = useThemeColors();

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onCancel}
    >
      <View style={styles.backdrop} className="flex-1 bg-black/60 justify-center items-center px-6">
        <Card className="items-center w-full max-w-[340px] p-6 rounded-[32px] border border-border dark:border-border-dark shadow-2xl">
          {/* Status Icon */}
          <View 
            className={`w-14 h-14 rounded-full justify-center items-center mb-4 ${
              isDestructive ? 'bg-red-500/10' : 'bg-primary/10'
            }`}
          >
            <Ionicons 
              name={isDestructive ? 'alert-circle-outline' : 'information-circle-outline'} 
              size={32} 
              color={isDestructive ? danger : primary} 
            />
          </View>

          {/* Title & Message */}
          <Text className="text-lg font-black text-text dark:text-text-dark text-center mb-2">
            {title}
          </Text>
          <Text className="text-xs text-muted dark:text-muted-dark text-center leading-relaxed mb-6 px-2">
            {message}
          </Text>

          {/* Actions Row */}
          <View className="flex-row w-full" style={{ gap: 12 }}>
            <TouchableOpacity
              onPress={onCancel}
              activeOpacity={0.7}
              className="flex-1 h-12 border border-border dark:border-border-dark rounded-xl items-center justify-center bg-card dark:bg-card-dark active:bg-border/10"
            >
              <Text className="text-xs font-black text-muted dark:text-muted-dark uppercase tracking-wider">
                {cancelLabel}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={onConfirm}
              activeOpacity={0.8}
              className={`flex-1 h-12 rounded-xl items-center justify-center shadow-lg active:opacity-90 ${
                isDestructive ? 'bg-red-500' : 'bg-primary'
              }`}
            >
              <Text className="text-xs font-black text-white uppercase tracking-wider">
                {confirmLabel}
              </Text>
            </TouchableOpacity>
          </View>
        </Card>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    // Ensuring touch events outside doesn't close immediately if not intended
  },
});
