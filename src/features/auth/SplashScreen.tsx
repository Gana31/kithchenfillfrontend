import React, { useEffect } from 'react';
import { View, Image, ActivityIndicator, Text } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { COLORS } from '../../config/constants';
import { useAppSelector } from '../../store/store';
import { selectIsDark } from '../../store/themeSlice';

type RootStackParamList = {
  Splash: undefined;
  Onboarding: undefined;
  Login: undefined;
};

export default function SplashScreen({ navigation }: { navigation?: any }) {
  const isDark = useAppSelector(selectIsDark);

  useEffect(() => {
    if (!navigation) return;

    // Navigate to Onboarding screen after 2.5 seconds, resetting stack history
    const timer = setTimeout(() => {
      navigation.reset({
        index: 0,
        routes: [{ name: 'Onboarding' }],
      });
    }, 2500);

    return () => clearTimeout(timer);
  }, [navigation]);

  return (
    <View className="flex-1 bg-background dark:bg-background-dark items-center justify-center px-6">
      <StatusBar style={isDark ? 'light' : 'dark'} />
      
      {/* App Logo Container */}
      <View className="items-center justify-center mb-8">
        <Image
          source={require('../../../assets/logo.png')}
          className="w-48 h-48 rounded-3xl"
          resizeMode="contain"
        />
        <Text className="text-4xl font-black text-text dark:text-text-dark mt-6 tracking-tighter">
          Kitchen<Text className="text-primary">Fill</Text>
          <Text className="text-primary text-5xl">.</Text>
        </Text>
        <Text className="text-xs text-muted dark:text-muted-dark mt-2 tracking-widest uppercase font-bold">
          Smart Cloud Kitchen Inventory
        </Text>
      </View>

      {/* Loading Indicator */}
      <View className="absolute bottom-16 items-center">
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text className="text-muted dark:text-muted-dark text-xs mt-3 font-semibold tracking-widest uppercase">
          Initializing Workspace
        </Text>
      </View>
    </View>
  );
}
