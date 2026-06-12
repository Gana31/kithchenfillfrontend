import React, { useEffect } from 'react';
import { useColorScheme, Appearance, View, Text, TouchableOpacity } from 'react-native';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Provider } from 'react-redux';
import { store, useAppDispatch, useAppSelector } from './src/store/store';
import SplashScreen from './src/features/auth/SplashScreen';
import OnboardingScreen from './src/features/auth/OnboardingScreen';
import LoginScreen from './src/features/auth/LoginScreen';
import RegisterScreen from './src/features/auth/RegisterScreen';
import DashboardScreen from './src/features/dashboard/DashboardScreen';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { loadTheme, setSystemIsDark, selectIsDark } from './src/store/themeSlice';
import { selectIsAuthenticated, loadStoredAuth, selectAuthLoading, selectCurrentUser, logoutUser } from './src/features/auth/authSlice';
import { DEV_THEME_OVERRIDE } from './src/config/constants';
import { createBottomTabNavigator, BottomTabHeaderProps } from '@react-navigation/bottom-tabs';
import { useNavigationState } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import CustomTabBar from './src/components/CustomTabBar';
import SuperadminDashboardScreen from './src/features/superadmin/SuperadminDashboardScreen';
import ManageOwnersScreen from './src/features/superadmin/ManageOwnersScreen';
import InventoryScreen from './src/features/inventory/InventoryScreen';
import RecipeBuilderScreen from './src/features/recipes/RecipeBuilderScreen';
import CounterScreen from './src/features/sales/CounterScreen';
import BlobBackground from './src/components/BlobBackground';
import ProfileScreen from './src/features/profile/ProfileScreen';
import './global.css'; // Import compiled TailwindCSS global styles

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function CustomHeader({ options, route, navigation }: BottomTabHeaderProps) {
  const insets = useSafeAreaInsets();
  const user = useAppSelector(selectCurrentUser);

  const getHeaderInfo = () => {
    switch (route.name) {
      case 'Dashboard':
        if (user?.role === 'Superadmin') {
          return {
            title: 'SaaS',
            titleHighlight: 'Admin',
            subtitle: 'Platform Overview',
          };
        } else {
          return {
            title: 'Kitchen',
            titleHighlight: 'Fill',
            subtitle: user?.email || 'owner@kitchen.fill',
          };
        }
      case 'Owners':
        return {
          title: 'Kitchen',
          titleHighlight: 'Owners',
          subtitle: 'Manage Tenants',
        };
      case 'Inventory':
        return {
          title: 'Raw',
          titleHighlight: 'Stock',
          subtitle: 'Live Stock Levels',
        };
      case 'Recipes':
        return {
          title: 'Dish',
          titleHighlight: 'Recipes',
          subtitle: 'Manage Batches',
        };
      case 'Counter':
        return {
          title: 'Order',
          titleHighlight: 'Counter',
          subtitle: 'Log Local Sales',
        };
      case 'Profile':
        return {
          title: 'User',
          titleHighlight: 'Profile',
          subtitle: 'User Settings',
        };
      default:
        return {
          title: 'Kitchen',
          titleHighlight: 'Fill',
          subtitle: 'Management',
        };
    }
  };

  const { title, titleHighlight, subtitle } = getHeaderInfo();

  return (
    <View style={{ overflow: 'hidden', borderBottomWidth: 0, backgroundColor: 'transparent', paddingTop: insets.top }}>
      <View className="flex-row justify-between items-center px-6 py-4">
        <View>
          <Text className="text-2xl font-black text-text dark:text-text-dark tracking-tight">
            {title}<Text className="text-primary">{titleHighlight}</Text>
            <Text className="text-primary text-2xl">.</Text>
          </Text>
          <Text className="text-xs text-muted dark:text-muted-dark font-bold mt-0.5 uppercase tracking-widest">
            {subtitle}
          </Text>
        </View>
        <View className="flex-row items-center">
          {options.headerRight?.({ canGoBack: navigation.canGoBack() })}
        </View>
      </View>
    </View>
  );
}

function SuperadminNavigator() {
  const isDark = useAppSelector(selectIsDark);
  return (
    <View style={{ flex: 1, backgroundColor: isDark ? '#09090A' : '#FFFFFF' }}>
      <BlobBackground />
      <Tab.Navigator
        tabBar={(props) => <CustomTabBar {...props} />}
        screenOptions={{
          headerShown: true,
          header: (props) => <CustomHeader {...props} />,
          animation: 'shift',
          sceneStyle: { backgroundColor: 'transparent' }
        }}
      >
        <Tab.Screen name="Dashboard" component={SuperadminDashboardScreen} />
        <Tab.Screen name="Owners" component={ManageOwnersScreen} />
        <Tab.Screen name="Profile" component={ProfileScreen} />
      </Tab.Navigator>
    </View>
  );
}

function OwnerNavigator() {
  const isDark = useAppSelector(selectIsDark);
  return (
    <View style={{ flex: 1, backgroundColor: isDark ? '#09090A' : '#FFFFFF' }}>
      <BlobBackground />
      <Tab.Navigator
        tabBar={(props) => <CustomTabBar {...props} />}
        screenOptions={{
          headerShown: true,
          header: (props) => <CustomHeader {...props} />,
          animation: 'shift',
          sceneStyle: { backgroundColor: 'transparent' }
        }}
      >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Inventory" component={InventoryScreen} />
      <Tab.Screen name="Recipes" component={RecipeBuilderScreen} />
      <Tab.Screen name="Counter" component={CounterScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
    </View>
  );
}

function RootApp() {
  const dispatch = useAppDispatch();
  
  // 1. Listen for system color scheme changes at runtime
  const systemColorScheme = useColorScheme();
  
  // 2. Select the current theme preference from Redux
  const themePreference = useAppSelector((state) => state.theme.theme);
  
  // 3. Select isDark computed preference (respects manual select & dev override)
  const isDark = useAppSelector(selectIsDark);

  // 4. Select authentication status & user details
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const currentUser = useAppSelector(selectCurrentUser);
  
  // 5. Select authentication loading state
  const isAuthLoading = useAppSelector(selectAuthLoading);

  // Load saved theme and auth session from storage on mount
  useEffect(() => {
    dispatch(loadTheme());
    dispatch(loadStoredAuth());
  }, [dispatch]);

  // Keep Redux updated when system theme changes
  useEffect(() => {
    dispatch(setSystemIsDark(systemColorScheme === 'dark'));
  }, [systemColorScheme, dispatch]);

  // Synchronize React Native Appearance with Redux theme selection (supporting dev override)
  useEffect(() => {
    if (DEV_THEME_OVERRIDE) {
      Appearance.setColorScheme(DEV_THEME_OVERRIDE); // Force development override
    } else if (themePreference === 'system') {
      Appearance.setColorScheme(null); // Reset override, follow system
    } else {
      Appearance.setColorScheme(themePreference); // Force manual preference ('dark' or 'light')
    }
  }, [themePreference]);

  if (isAuthLoading) {
    return <SplashScreen />;
  }

  const navTheme = {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      background: 'transparent',
    },
  };

  return (
    <SafeAreaProvider>
      <View className={isDark ? 'dark flex-1' : 'flex-1'}>
        <NavigationContainer theme={navTheme}>
          <Stack.Navigator
            screenOptions={{
              headerShown: false,
              animation: 'slide_from_right',
            }}
          >
            {isAuthenticated ? (
              currentUser?.role === 'Superadmin' ? (
                <Stack.Screen name="SuperadminFlow" component={SuperadminNavigator} />
              ) : (
                <Stack.Screen name="OwnerFlow" component={OwnerNavigator} />
              )
            ) : (
              <>
                <Stack.Screen 
                  name="Splash" 
                  component={SplashScreen} 
                  options={{ gestureEnabled: false }}
                />
                <Stack.Screen 
                  name="Onboarding" 
                  component={OnboardingScreen} 
                  options={{ gestureEnabled: false }}
                />
                <Stack.Screen name="Login" component={LoginScreen} />
                <Stack.Screen name="Register" component={RegisterScreen} />
              </>
            )}
          </Stack.Navigator>
        </NavigationContainer>
      </View>
    </SafeAreaProvider>
  );
}

export default function App() {
  return (
    <Provider store={store}>
      <RootApp />
    </Provider>
  );
}
