import React, { useState } from 'react';
import { 
  View, 
  Text, 
  Modal, 
  TouchableOpacity, 
  ScrollView, 
  KeyboardAvoidingView, 
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Input from '../../../components/Input';
import Button from '../../../components/Button';
import { useCreateTenantMutation } from '../superadminApi';
import { useThemeColors } from '../../../hooks/useThemeColors';
import { useAppDispatch } from '../../../store/store';
import { showToast } from '../../../store/toastSlice';

interface AddOwnerModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function AddOwnerModal({ visible, onClose }: AddOwnerModalProps) {
  const dispatch = useAppDispatch();
  const { muted } = useThemeColors();
  const [createTenant, { isLoading: isCreating }] = useCreateTenantMutation();

  // Form State
  const [kitchenName, setKitchenName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState('');

  const handleCreateOwner = async () => {
    if (!kitchenName || !ownerName || !email || !password) {
      setFormError('All fields are required.');
      return;
    }
    
    setFormError('');
    try {
      const result = await createTenant({
        businessName: kitchenName,
        name: ownerName,
        email,
        password
      }).unwrap();

      if (result.success) {
        setKitchenName('');
        setOwnerName('');
        setEmail('');
        setPassword('');
        onClose();
        dispatch(
          showToast({
            title: 'Success',
            message: 'Kitchen owner account successfully created!',
            type: 'success',
          })
        );
      }
    } catch (err: any) {
      setFormError(err.data?.error || 'Failed to create owner. Make sure email is unique.');
    }
  };

  const handleClose = () => {
    setFormError('');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <View className="flex-1 bg-black/60 justify-end">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          className="w-full"
        >
          <View className="bg-card dark:bg-card-dark rounded-t-[32px] border-t border-border dark:border-border-dark px-6 pt-6 pb-10 shadow-2xl">
            {/* Modal Drag Handle */}
            <View className="w-12 h-1.5 bg-border dark:bg-border-dark rounded-full mx-auto mb-6" />

            {/* Modal Header */}
            <View className="flex-row justify-between items-center mb-6">
              <Text className="text-xl font-semibold text-text dark:text-text-dark">
                Create Owner Workspace
              </Text>
              <TouchableOpacity 
                onPress={handleClose}
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

            {/* Form Input Fields */}
            <ScrollView 
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 16 }}
              style={{ maxHeight: 400 }}
              keyboardShouldPersistTaps="handled"
              scrollEventThrottle={16}
            >
              <Input
                label="Kitchen / Restaurant Name"
                placeholder="e.g. Chai Garam, Central Kitchen"
                value={kitchenName}
                onChangeText={setKitchenName}
              />

              <Input
                label="Owner Full Name"
                placeholder="e.g. Rahul Sharma"
                value={ownerName}
                onChangeText={setOwnerName}
              />

              <Input
                label="Owner Email Address"
                placeholder="e.g. owner@kitchen.com"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
              />

              <Input
                label="Temporary Password"
                placeholder="Create password for owner"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </ScrollView>

            {/* Submit Button */}
            <Button
              label="Provision Workspace"
              onPress={handleCreateOwner}
              loading={isCreating}
              className="mt-4 shadow-lg shadow-primary/20"
            />
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}
