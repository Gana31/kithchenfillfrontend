import React from 'react';
import { View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAppSelector } from '../store/store';
import { selectIsDark } from '../store/themeSlice';
import CustomTabBar from '../components/CustomTabBar';
import BlobBackground from '../components/BlobBackground';
import DashboardScreen from '../features/dashboard/DashboardScreen';
import InventoryScreen from '../features/inventory/InventoryScreen';
import RecipeBuilderScreen from '../features/recipes/RecipeBuilderScreen';
import AddRecipeScreen from '../features/recipes/components/AddRecipeScreen';
import CounterScreen from '../features/sales/CounterScreen';
import ProfileScreen from '../features/profile/ProfileScreen';
import CustomAppHeader from './CustomAppHeader';
import { OwnerRootStackParamList } from './ownerNavigation.types';

const OwnerStack = createNativeStackNavigator<OwnerRootStackParamList>();
const Tab = createBottomTabNavigator();

export function OwnerTabNavigator() {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: true,
        header: (props) => <CustomAppHeader {...props} />,
        animation: 'shift',
        sceneStyle: { flex: 1, backgroundColor: 'transparent' },
      }}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Inventory" component={InventoryScreen} />
      <Tab.Screen name="Recipes" component={RecipeBuilderScreen} />
      <Tab.Screen name="Counter" component={CounterScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

export default function OwnerWorkspaceNavigator() {
  const isDark = useAppSelector(selectIsDark);

  return (
    <View style={{ flex: 1, backgroundColor: isDark ? '#09090A' : '#FFFFFF' }}>
      <BlobBackground />
      <View style={{ flex: 1, zIndex: 1, elevation: 1 }}>
        <OwnerStack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
          <OwnerStack.Screen name="MainTabs" component={OwnerTabNavigator} />
          <OwnerStack.Screen name="AddRecipe" component={AddRecipeScreen} />
        </OwnerStack.Navigator>
      </View>
    </View>
  );
}
