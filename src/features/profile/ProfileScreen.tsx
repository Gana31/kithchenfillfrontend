import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useAppDispatch, useAppSelector } from '../../store/store';
import { logoutUser, selectCurrentUser } from '../auth/authSlice';
import { showToast } from '../../store/toastSlice';
import { changeTheme, selectThemePreference, ThemePreference } from '../../store/themeSlice';
import Card from '../../components/Card';
import Button from '../../components/Button';
import Input from '../../components/Input';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '../../hooks/useThemeColors';
import ConfirmModal from '../../components/ConfirmModal';
import { SectionHeading } from '../../components/SpacedStack';
import { SCROLL_LIST_PROPS, SCROLL_GAP_TOUCH } from '../../components/scrollUtils';
import * as Updates from 'expo-updates';
import { checkForOtaUpdate, downloadAndApplyOtaUpdate } from '../../utils/otaUpdates';
import ChangePasswordCard from './ChangePasswordCard';

export default function ProfileScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectCurrentUser);
  const themePreference = useAppSelector(selectThemePreference);
  const { primary, danger, muted, isDark } = useThemeColors();
  const [isLogoutModalVisible, setIsLogoutModalVisible] = useState(false);

  // OTA Updates State
  const [checking, setChecking] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [updateStatus, setUpdateStatus] = useState(Updates.isEnabled ? 'Idle' : 'Disabled');
  const [isUpdateAvailable, setIsUpdateAvailable] = useState(false);

  const currentUpdateId = Updates.updateId || null;
  const currentChannel = Updates.channel || 'development';

  const channelLabel =
    currentChannel === 'production'
      ? 'Live'
      : currentChannel === 'preview'
        ? 'Test (preview)'
        : currentChannel === 'development'
          ? 'Development'
          : currentChannel;

  const channelHint =
    currentChannel === 'preview'
      ? 'Test APK — run: eas update --branch preview'
      : currentChannel === 'production'
        ? 'Live APK — run: eas update --branch production (not preview).'
        : currentChannel === 'development'
          ? 'Dev client — OTA updates are usually disabled.'
          : null;

  const handleCheckForUpdates = async () => {
    if (!Updates.isEnabled) {
      dispatch(
        showToast({
          title: 'Not Supported',
          message: 'OTA Updates are disabled in development mode or Expo Go.',
          type: 'info',
        })
      );
      return;
    }

    if (isUpdateAvailable) {
      setUpdating(true);
      setUpdateStatus('Downloading...');
      const result = await downloadAndApplyOtaUpdate();
      if (result.status === 'downloaded') {
        return;
      }
      setUpdating(false);
      if (result.status === 'already_latest') {
        setIsUpdateAvailable(false);
        setUpdateStatus('Up to Date');
        dispatch(
          showToast({
            title: 'Already Up to Date',
            message: 'No new update to install.',
            type: 'info',
          })
        );
        return;
      }
      setUpdateStatus('Error');
      dispatch(
        showToast({
          title: 'Update Failed',
          message: result.status === 'error' ? result.message : 'Could not apply update.',
          type: 'error',
        })
      );
      return;
    }

    setChecking(true);
    setUpdateStatus('Checking...');
    try {
      const result = await checkForOtaUpdate();
      if (result.status === 'available') {
        setIsUpdateAvailable(true);
        setUpdateStatus('Available');
        dispatch(
          showToast({
            title: 'Update Available',
            message: 'Tap the button again to download and install.',
            type: 'success',
          })
        );
      } else if (result.status === 'up_to_date') {
        setIsUpdateAvailable(false);
        setUpdateStatus('Up to Date');
        dispatch(
          showToast({
            title: 'Up to Date',
            message: 'You are running the latest version.',
            type: 'success',
          })
        );
      } else if (result.status === 'disabled') {
        setUpdateStatus('Disabled');
        dispatch(
          showToast({
            title: 'Not Supported',
            message: 'OTA Updates are disabled in this build.',
            type: 'info',
          })
        );
      } else {
        setUpdateStatus('Error');
        dispatch(
          showToast({
            title: 'Check Failed',
            message: result.message,
            type: 'error',
          })
        );
      }
    } finally {
      setChecking(false);
    }
  };

  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          onPress={handleLogout}
          activeOpacity={0.7}
          className="px-3.5 py-2 rounded-xl bg-red-500/10 border border-red-500/20 flex-row items-center mr-6 shadow-sm"
        >
          <Ionicons name="log-out-outline" size={16} color={danger} style={{ marginRight: 6 }} />
          <Text className="text-xs font-semibold text-red-500 tracking-normal">
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

  const activeTheme: 'light' | 'dark' =
    themePreference === 'system' ? (isDark ? 'dark' : 'light') : themePreference;

  const handleThemeChange = (theme: 'light' | 'dark') => {
    if (theme === activeTheme && themePreference !== 'system') return;
    dispatch(changeTheme(theme));
  };

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

  const sections: { key: string; content: React.ReactNode }[] = [
    {
      key: 'profile',
      content: (
        <Card className="items-center py-6">
          <View className="w-20 h-20 rounded-full bg-primary/10 border border-primary/20 items-center justify-center mb-3">
            <Ionicons name="person" size={40} color={primary} />
          </View>
          <Text className="text-lg font-semibold text-text dark:text-text-dark">
            {user?.name || 'User Name'}
          </Text>
          <Text className="text-xs text-muted dark:text-muted-dark font-medium mt-0.5">
            {user?.email || 'user@example.com'}
          </Text>
          <View className="px-3 py-1 rounded-full bg-primary/15 border border-primary/25 mt-3">
            <Text className="text-[10px] font-semibold uppercase text-primary tracking-wider">
              {user?.role || 'User'}
            </Text>
          </View>
        </Card>
      ),
    },
    {
      key: 'account',
      content: (
        <View>
        <SectionHeading title="Account Settings" />

        <Card className="p-5">
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
        </View>
      ),
    },
    {
      key: 'security',
      content: (
        <View>
        <SectionHeading title="Security" />

        <ChangePasswordCard
          email={user?.email || email}
          onSuccess={(message) => {
            dispatch(
              showToast({
                title: 'Password updated',
                message: `${message} Please sign in again.`,
                type: 'success',
              })
            );
            setTimeout(() => dispatch(logoutUser()), 1500);
          }}
          onError={(message) =>
            dispatch(showToast({ title: 'Password', message, type: 'error' }))
          }
        />
        </View>
      ),
    },
    {
      key: 'appearance',
      content: (
        <View>
        <SectionHeading title="Appearance" />

        <Card className="p-5">
          <Text className="text-xs text-muted dark:text-muted-dark font-bold tracking-normal mb-3">
            Theme
          </Text>
          <View className="flex-row bg-border/10 dark:bg-border-dark/10 border border-border dark:border-border-dark rounded-2xl p-1">
            {(['light', 'dark'] as const).map((theme) => {
              const selected = activeTheme === theme;
              return (
                <TouchableOpacity
                  key={theme}
                  onPress={() => handleThemeChange(theme)}
                  activeOpacity={0.8}
                  className={`flex-1 flex-row items-center justify-center py-3 rounded-xl ${
                    selected ? 'bg-primary/15 border border-primary/25' : ''
                  }`}
                >
                  <Ionicons
                    name={theme === 'dark' ? 'moon-outline' : 'sunny-outline'}
                    size={16}
                    color={selected ? primary : muted}
                    style={{ marginRight: 6 }}
                  />
                  <Text
                    className={`text-xs font-semibold tracking-normal ${
                      selected ? 'text-primary' : 'text-muted dark:text-muted-dark'
                    }`}
                  >
                    {theme}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <Text className="text-[10px] text-muted dark:text-muted-dark mt-3 leading-relaxed">
            Your theme choice is saved on this device and stays selected when you reopen the app.
          </Text>
        </Card>
        </View>
      ),
    },
    {
      key: 'update',
      content: (
        <View>
        <SectionHeading title="App Update" />
        <Card className="p-5">
          <View className="flex-row justify-between items-center mb-4">
            <View className="flex-1 mr-4">
              <Text className="text-xs text-muted dark:text-muted-dark font-bold tracking-normal">
                Current Version / Channel
              </Text>
              <Text className="text-sm font-semibold text-text dark:text-text-dark mt-1">
                1.0.0 · {channelLabel}
              </Text>
              {channelHint ? (
                <Text className="text-[10px] text-muted dark:text-muted-dark mt-1 leading-relaxed">
                  {channelHint}
                </Text>
              ) : null}
              {currentUpdateId ? (
                <Text className="text-[10px] text-muted dark:text-muted-dark mt-0.5">
                  ID: {currentUpdateId}
                </Text>
              ) : null}
            </View>
            <View className={`px-2.5 py-1 rounded-full ${
              updateStatus === 'Available' ? 'bg-primary/10 border border-primary/25' :
              updateStatus === 'Up to Date' ? 'bg-emerald-500/10 border border-emerald-500/25' :
              'bg-border/20 border border-border dark:border-border-dark'
            }`}>
              <Text className={`text-[10px] font-semibold tracking-normal ${
                updateStatus === 'Available' ? 'text-primary' :
                updateStatus === 'Up to Date' ? 'text-emerald-500' :
                'text-muted dark:text-muted-dark'
              }`}>
                {updateStatus}
              </Text>
            </View>
          </View>

          {isUpdateAvailable && (
            <View className="mb-4 bg-primary/10 border border-primary/20 p-3 rounded-xl">
              <Text className="text-primary text-xs font-bold text-center">
                A new update is available! Tap the button below to download and install.
              </Text>
            </View>
          )}

          <Button
            label={
              checking
                ? 'Checking...'
                : updating
                  ? 'Installing...'
                  : isUpdateAvailable
                    ? 'Download & Install Update'
                    : 'Check for Updates'
            }
            onPress={handleCheckForUpdates}
            loading={checking || updating}
            variant={isUpdateAvailable ? "primary" : "secondary"}
          />
        </Card>
        </View>
      ),
    },
    {
      key: 'session',
      content: (
        <View>
        <SectionHeading title="Session" />

        <Card className="p-5 border-red-500/10 bg-red-500/5 dark:bg-red-500/5">
          <Text className="text-xs text-red-500 dark:text-red-400 font-bold tracking-normal mb-2">
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
              <Text className="text-sm font-semibold text-white tracking-normal">
                Log Out
              </Text>
            </View>
          </TouchableOpacity>
        </Card>
        </View>
      ),
    },
  ];

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <View style={{ flex: 1, backgroundColor: 'transparent' }}>
        <ScrollView
          style={[{ flex: 1 }, SCROLL_GAP_TOUCH]}
          contentContainerStyle={[
            { paddingHorizontal: 24, paddingTop: 16, paddingBottom: insets.bottom + 110 },
            SCROLL_GAP_TOUCH,
          ]}
          {...SCROLL_LIST_PROPS}
        >
          {sections.map((section) => (
            <View key={section.key} style={{ marginBottom: 16 }}>
              {section.content}
            </View>
          ))}
        </ScrollView>
      </View>

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
    </>
  );
}
