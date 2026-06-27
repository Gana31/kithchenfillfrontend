import React from 'react';
import { View, Text } from 'react-native';
import { BottomTabHeaderProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppSelector } from '../store/store';
import {
  selectCurrentUser,
  selectImpersonatedBusinessName,
  selectIsImpersonating,
} from '../features/auth/authSlice';

export default function CustomAppHeader({ options, route, navigation }: BottomTabHeaderProps) {
  const insets = useSafeAreaInsets();
  const user = useAppSelector(selectCurrentUser);
  const isImpersonating = useAppSelector(selectIsImpersonating);
  const impersonatedBusinessName = useAppSelector(selectImpersonatedBusinessName);

  const getHeaderInfo = () => {
    switch (route.name) {
      case 'Dashboard':
        if (user?.role === 'Superadmin' && !isImpersonating) {
          return {
            title: 'SaaS',
            titleHighlight: 'Admin',
            subtitle: 'Platform Overview',
          };
        }
        return {
          title: 'Kitchen',
          titleHighlight: 'Fill',
          subtitle: isImpersonating
            ? impersonatedBusinessName || 'Owner workspace'
            : user?.email || 'owner@kitchen.fill',
        };
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
          subtitle: isImpersonating ? `${impersonatedBusinessName} · Stock` : 'Live Stock Levels',
        };
      case 'Recipes':
        return {
          title: 'My',
          titleHighlight: 'Recipes',
          subtitle: isImpersonating ? `${impersonatedBusinessName} · Recipes` : 'Manage Batches',
        };
      case 'Counter':
        return {
          title: 'Order',
          titleHighlight: 'Counter',
          subtitle: isImpersonating ? `${impersonatedBusinessName} · Sales` : 'Log Local Sales',
        };
      case 'Profile':
        return {
          title: 'User',
          titleHighlight: 'Profile',
          subtitle: isImpersonating ? 'Admin session' : 'User Settings',
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
    <View
      style={{
        overflow: 'hidden',
        borderBottomWidth: 0,
        backgroundColor: 'transparent',
        paddingTop: isImpersonating ? 0 : insets.top,
      }}
    >
      <View className="flex-row justify-between items-center px-6 py-4">
        <View className="flex-row items-center flex-1 mr-2" style={{ gap: 10 }}>
          <View className="flex-shrink">
            <Text className="text-2xl font-semibold text-text dark:text-text-dark tracking-tight">
              {title}
              <Text className="text-primary">{titleHighlight}</Text>
              <Text className="text-primary text-2xl">.</Text>
            </Text>
            <Text className="text-xs text-muted dark:text-muted-dark font-medium mt-0.5 tracking-normal">
              {subtitle}
            </Text>
          </View>
          {options.headerLeft?.({
            canGoBack: typeof navigation.canGoBack === 'function' ? navigation.canGoBack() : false,
          })}
        </View>
        <View className="flex-row items-center flex-shrink-0">
          {options.headerRight?.({
            canGoBack: typeof navigation.canGoBack === 'function' ? navigation.canGoBack() : false,
          })}
        </View>
      </View>
    </View>
  );
}
