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
import FolderDetailScreen from '../features/inventory/FolderDetailScreen';
import PlatesScreen from '../features/plates/PlatesScreen';
import AddPlateScreen from '../features/plates/components/AddPlateScreen';
import UdhaarScreen from '../features/udhaar/UdhaarScreen';
import AddUdhaarScreen from '../features/udhaar/components/AddUdhaarScreen';
import ProfileScreen from '../features/profile/ProfileScreen';
import CustomAppHeader from './CustomAppHeader';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { OwnerRootStackParamList } from './ownerNavigation.types';

const OwnerStack = createNativeStackNavigator<OwnerRootStackParamList>();
const Tab = createBottomTabNavigator();

export function OwnerTabNavigator() {
  const insets = useSafeAreaInsets();
  const tabBarHeight = 64 + insets.bottom;

  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: true,
        header: (props) => <CustomAppHeader {...props} />,
        animation: 'fade',
        sceneStyle: { flex: 1, backgroundColor: 'transparent' },
        tabBarStyle: {
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: tabBarHeight,
          backgroundColor: 'transparent',
          borderTopWidth: 0,
          elevation: 0,
        },
      }}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Inventory" component={InventoryScreen} />
      <Tab.Screen name="Recipes" component={RecipeBuilderScreen} />
      <Tab.Screen name="Plates" component={PlatesScreen} />
      <Tab.Screen name="Udhaar" component={UdhaarScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

export default function OwnerWorkspaceNavigator() {
  const isDark = useAppSelector(selectIsDark);

  return (
    <View style={{ flex: 1, backgroundColor: isDark ? '#09090A' : '#FFFFFF' }}>
      <BlobBackground />
      <View style={{ flex: 1, zIndex: 1, backgroundColor: 'transparent' }}>
        <OwnerStack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
          <OwnerStack.Screen name="MainTabs" component={OwnerTabNavigator} />
          <OwnerStack.Screen name="AddRecipe" component={AddRecipeScreen} />
          <OwnerStack.Screen name="FolderDetail" component={FolderDetailScreen} />
          <OwnerStack.Screen name="AddPlate" component={AddPlateScreen} />
          <OwnerStack.Screen name="AddUdhaar" component={AddUdhaarScreen} />
        </OwnerStack.Navigator>
      </View>
    </View>
  );
}
