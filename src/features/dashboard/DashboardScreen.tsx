import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useAppDispatch, useAppSelector } from '../../store/store';
import { logoutUser, selectCurrentUser } from '../auth/authSlice';
import { selectIsDark } from '../../store/themeSlice';
import Card from '../../components/Card';
import Button from '../../components/Button';
import ScreenContainer from '../../components/ScreenContainer';

export default function DashboardScreen() {
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectCurrentUser);
  const isDark = useAppSelector(selectIsDark);

  const handleLogout = () => {
    dispatch(logoutUser());
  };

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <ScreenContainer scrollable contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 16 }}>
        {/* Aggregators Status Bar */}
        <Card className="mb-6">
          <Text className="text-xs font-black text-text dark:text-text-dark uppercase tracking-widest mb-4">
            Aggregator Channels
          </Text>
          <View className="flex-row justify-between items-center">
            {/* Zomato */}
            <View className="flex-row items-center space-x-2">
              <View className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <Text className="text-sm font-bold text-text dark:text-text-dark">Zomato</Text>
            </View>
            {/* Swiggy */}
            <View className="flex-row items-center space-x-2">
              <View className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <Text className="text-sm font-bold text-text dark:text-text-dark">Swiggy</Text>
            </View>
            {/* Magicpin */}
            <View className="flex-row items-center space-x-2">
              <View className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <Text className="text-sm font-bold text-text dark:text-text-dark">Magicpin</Text>
            </View>
          </View>
        </Card>

        {/* Overview Metrics Title */}
        <Text className="text-lg font-black text-text dark:text-text-dark mb-4">
          Today's Kitchen Pulse
        </Text>

        {/* Sales Card */}
        <Card className="mb-4">
          <Text className="text-xs text-muted dark:text-muted-dark font-bold uppercase tracking-wider">
            Gross Sales (Discounted)
          </Text>
          <Text className="text-3xl font-black text-text dark:text-text-dark mt-1">
            ₹24,500.00
          </Text>
          <View className="flex-row justify-between items-center mt-3 pt-3 border-t border-border/30 dark:border-border-dark/30">
            <Text className="text-xs text-muted dark:text-muted-dark font-medium">Platform Payouts (Est.)</Text>
            <Text className="text-xs font-bold text-emerald-500">₹19,600.00</Text>
          </View>
        </Card>

        {/* FIFO & Margin Double Grid */}
        <View className="flex-row space-x-4 mb-6">
          {/* FIFO Stock batches */}
          <View className="flex-1">
            <Card className="p-4">
              <Text className="text-xs text-muted dark:text-muted-dark font-bold uppercase tracking-wider">
                FIFO Lots
              </Text>
              <Text className="text-xl font-black text-text dark:text-text-dark mt-1">
                12 Active
              </Text>
              <Text className="text-xs text-primary font-bold mt-1">
                Oldest batch priority
              </Text>
            </Card>
          </View>

          {/* Margins */}
          <View className="flex-1">
            <Card className="p-4">
              <Text className="text-xs text-muted dark:text-muted-dark font-bold uppercase tracking-wider">
                GP Margin
              </Text>
              <Text className="text-xl font-black text-emerald-500 mt-1">
                68.5%
              </Text>
              <Text className="text-xs text-muted dark:text-muted-dark font-medium mt-1">
                Optimized COGS
              </Text>
            </Card>
          </View>
        </View>

        {/* Quick Log Action Section */}
        <Card className="p-5 items-center">
          <Text className="text-3xl mb-2">🍽️</Text>
          <Text className="text-sm font-black text-text dark:text-text-dark text-center">
            Log Sales Instantly
          </Text>
          <Text className="text-xs text-muted dark:text-muted-dark text-center mt-1 mb-4 leading-relaxed px-4">
            Logging a recipe plate automatically deducts individual ingredients from your active FIFO lots.
          </Text>
          <Button 
            label="Open Quick Log Panel" 
            onPress={() => console.log('Open quick log')}
            className="w-full"
          />
        </Card>
      </ScreenContainer>
    </>
  );
}
