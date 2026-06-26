import { useEffect } from 'react';
import { Platform } from 'react-native';
import * as NavigationBar from 'expo-navigation-bar';

/** Theme the Android system nav bar (back / home / recent) only. */
export function useSystemChrome(isDark: boolean) {
  useEffect(() => {
    if (Platform.OS !== 'android') return;

    void NavigationBar.setButtonStyleAsync(isDark ? 'light' : 'dark');
    NavigationBar.setStyle(isDark ? 'dark' : 'light');
  }, [isDark]);
}
