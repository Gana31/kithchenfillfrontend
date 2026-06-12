import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useAppDispatch, useAppSelector } from '../../store/store';
import { logoutUser, selectCurrentUser } from '../auth/authSlice';
import { showToast } from '../../store/toastSlice';
import Card from '../../components/Card';
import Button from '../../components/Button';
import Input from '../../components/Input';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '../../hooks/useThemeColors';
import ConfirmModal from '../../components/ConfirmModal';

export default function ProfileScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectCurrentUser);
  const { primary, danger, isDark } = useThemeColors();
  const [isLogoutModalVisible, setIsLogoutModalVisible] = useState(false);

  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          onPress={handleLogout}
          activeOpacity={0.7}
          className="px-3.5 py-2 rounded-xl bg-red-500/10 border border-red-500/20 flex-row items-center mr-6 shadow-sm"
        >
          <Ionicons name="log-out-outline" size={16} color={danger} style={{ marginRight: 6 }} />
          <Text className="text-xs font-black text-red-500 uppercase tracking-wider">
            Log Out
          </Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation]);

  // Profile fields state
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [isUpdating, setIsUpdating] = useState(false);

  const handleUpdateProfile = () => {
    if (!name || !email) {
      dispatch(
        showToast({
          title: 'Error',
          message: 'Name and Email are required.',
          type: 'error',
        })
      );
      return;
    }
    setIsUpdating(true);
    setTimeout(() => {
      setIsUpdating(false);
      dispatch(
        showToast({
          title: 'Success',
          message: 'Profile updated successfully (local simulation).',
          type: 'success',
        })
      );
    }, 1200);
  };

  const handleLogout = () => {
    setIsLogoutModalVisible(true);
  };

  return (
    <View className="flex-1 bg-transparent">
      <StatusBar style={isDark ? 'light' : 'dark'} />

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 16, paddingBottom: insets.bottom + 100 }}
        className="flex-1"
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        scrollEventThrottle={16}
      >
        {/* User Card with Avatar */}
        <Card className="mb-6 items-center py-6">
          <View className="w-20 h-20 rounded-full bg-primary/10 border border-primary/20 items-center justify-center mb-3">
            <Ionicons name="person" size={40} color={primary} />
          </View>
          <Text className="text-lg font-black text-text dark:text-text-dark">
            {user?.name || 'User Name'}
          </Text>
          <Text className="text-xs text-muted dark:text-muted-dark font-medium mt-0.5">
            {user?.email || 'user@example.com'}
          </Text>
          <View className="px-3 py-1 rounded-full bg-primary/15 border border-primary/25 mt-3">
            <Text className="text-[10px] font-black uppercase text-primary tracking-wider">
              {user?.role || 'User'}
            </Text>
          </View>
        </Card>

        {/* Update Details Section */}
        <Text className="text-lg font-black text-text dark:text-text-dark mb-4">
          Account Settings
        </Text>

        <Card className="mb-6 p-5">
          <Input
            label="Full Name"
            placeholder="Enter your name"
            value={name}
            onChangeText={setName}
          />
          <Input
            label="Email Address"
            placeholder="Enter your email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
          />
          <Button
            label="Update Settings"
            onPress={handleUpdateProfile}
            loading={isUpdating}
            className="mt-2"
          />
        </Card>

        {/* Danger Zone */}
        <Text className="text-lg font-black text-text dark:text-text-dark mb-4">
          Session
        </Text>

        <Card className="p-5 border-red-500/10 bg-red-500/5 dark:bg-red-500/5 mb-4">
          <Text className="text-xs text-red-500 dark:text-red-400 font-bold uppercase tracking-wider mb-2">
            Exit Account
          </Text>
          <Text className="text-xs text-muted dark:text-muted-dark leading-relaxed mb-4">
            Logging out will clear your local workspace session keys and return you to the login screen.
          </Text>
          <TouchableOpacity
            onPress={handleLogout}
            activeOpacity={0.8}
            className="w-full py-3.5 rounded-2xl bg-red-500 items-center justify-center border border-red-600/20"
          >
            <View className="flex-row items-center justify-center">
              <Ionicons name="log-out" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text className="text-sm font-black text-white uppercase tracking-wider">
                Log Out
              </Text>
            </View>
          </TouchableOpacity>
        </Card>
      </ScrollView>

      <ConfirmModal
        visible={isLogoutModalVisible}
        title="Log Out"
        message="Are you sure you want to log out?"
        confirmLabel="Log Out"
        isDestructive={true}
        onConfirm={() => {
          setIsLogoutModalVisible(false);
          dispatch(logoutUser());
        }}
        onCancel={() => setIsLogoutModalVisible(false)}
      />
    </View>
  );
}
