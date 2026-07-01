import 'react-native-gesture-handler';
import React, { useEffect } from 'react';
import { useColorScheme, Appearance, View } from 'react-native';
import { enableFreeze } from 'react-native-screens';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Provider } from 'react-redux';
import { store, useAppDispatch, useAppSelector } from './src/store/store';
import SplashScreen from './src/features/auth/SplashScreen';
import OnboardingScreen from './src/features/auth/OnboardingScreen';
import LoginScreen from './src/features/auth/LoginScreen';
import RegisterScreen from './src/features/auth/RegisterScreen';
import ForgotPasswordScreen from './src/features/auth/ForgotPasswordScreen';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { loadTheme, setSystemIsDark, selectIsDark } from './src/store/themeSlice';
import {
  selectIsAuthenticated,
  loadStoredAuth,
  selectAuthLoading,
  selectCurrentUser,
} from './src/features/auth/authSlice';
import { DEV_THEME_OVERRIDE } from './src/config/constants';
import { useAppFonts } from './src/config/fonts';
import CustomTabBar from './src/components/CustomTabBar';
import SuperadminDashboardScreen from './src/features/superadmin/SuperadminDashboardScreen';
import ManageOwnersScreen from './src/features/superadmin/ManageOwnersScreen';
import OwnerWorkspaceScreen from './src/features/superadmin/OwnerWorkspaceScreen';
import ProfileScreen from './src/features/profile/ProfileScreen';
import Toast from './src/components/Toast';
import { useSystemChrome } from './src/hooks/useSystemChrome';
import OwnerWorkspaceNavigator from './src/navigation/OwnerWorkspaceNavigator';
import CustomAppHeader from './src/navigation/CustomAppHeader';
import { SuperadminRootStackParamList } from './src/navigation/superadminNavigation.types';
import AppErrorBoundary from './src/components/AppErrorBoundary';
import BlobBackground from './src/components/BlobBackground';
import './global.css';

enableFreeze(true);

const Stack = createNativeStackNavigator();
const SuperadminStack = createNativeStackNavigator<SuperadminRootStackParamList>();
const Tab = createBottomTabNavigator();

function SuperadminTabNavigator() {
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
      <Tab.Screen name="Dashboard" component={SuperadminDashboardScreen} />
      <Tab.Screen name="Owners" component={ManageOwnersScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

function SuperadminNavigator() {
  const isDark = useAppSelector(selectIsDark);
  return (
    <View style={{ flex: 1, backgroundColor: isDark ? '#09090A' : '#FFFFFF' }}>
      <BlobBackground />
      <View style={{ flex: 1, zIndex: 1, elevation: 1 }}>
        <SuperadminStack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
          <SuperadminStack.Screen name="MainTabs" component={SuperadminTabNavigator} />
          <SuperadminStack.Screen name="OwnerWorkspace" component={OwnerWorkspaceScreen} />
        </SuperadminStack.Navigator>
      </View>
    </View>
  );
}

function OwnerNavigator() {
  const isDark = useAppSelector(selectIsDark);
  return (
    <View style={{ flex: 1, backgroundColor: isDark ? '#09090A' : '#FFFFFF' }}>
      <BlobBackground />
      <View style={{ flex: 1, zIndex: 1, elevation: 1 }}>
        <OwnerWorkspaceNavigator />
      </View>
    </View>
  );
}

function RootApp() {
  const dispatch = useAppDispatch();
  const { loaded: fontsLoaded } = useAppFonts();
  const systemColorScheme = useColorScheme();
  const themePreference = useAppSelector((state) => state.theme.theme);
  const isDark = useAppSelector(selectIsDark);
  useSystemChrome(isDark);
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const currentUser = useAppSelector(selectCurrentUser);
  const isAuthLoading = useAppSelector(selectAuthLoading);

  useEffect(() => {
    dispatch(loadTheme());
    dispatch(loadStoredAuth());
  }, [dispatch]);

  useEffect(() => {
    dispatch(setSystemIsDark(systemColorScheme === 'dark'));
  }, [systemColorScheme, dispatch]);

  useEffect(() => {
    if (DEV_THEME_OVERRIDE) {
      Appearance.setColorScheme(DEV_THEME_OVERRIDE);
    } else if (themePreference === 'system') {
      Appearance.setColorScheme(null);
    } else {
      Appearance.setColorScheme(themePreference);
    }
  }, [themePreference]);

  if (isAuthLoading || !fontsLoaded) {
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
    <GestureHandlerRootView style={{ flex: 1 }}>
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
                  <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
                </>
              )}
            </Stack.Navigator>
          </NavigationContainer>
          <Toast />
        </View>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

export default function App() {
  return (
    <Provider store={store}>
      <AppErrorBoundary>
        <RootApp />
      </AppErrorBoundary>
    </Provider>
  );
}
