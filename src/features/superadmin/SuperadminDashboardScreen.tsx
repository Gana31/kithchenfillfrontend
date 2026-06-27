import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useAppDispatch, useAppSelector } from '../../store/store';
import { logoutUser, selectCurrentUser } from '../auth/authSlice';
import { useGetTenantsQuery } from './superadminApi';
import Card from '../../components/Card';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '../../hooks/useThemeColors';
import ScreenContainer from '../../components/ScreenContainer';
import { openOwnerWorkspace } from './superadminNavigation';
import { TenantData } from './superadminApi';

export default function SuperadminDashboardScreen({ navigation }: { navigation?: any }) {
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectCurrentUser);
  const { primary, isDark } = useThemeColors();
  
  // Fetch tenants data from backend
  const { data, isLoading, error, refetch } = useGetTenantsQuery();

  const handleLogout = () => {
    dispatch(logoutUser());
  };

  const tenants = data?.tenants || [];
  const totalTenants = tenants.length;
  const activeTenants = tenants.filter(t => t.status === 'active').length;
  const deactivatedTenants = totalTenants - activeTenants;

  const handleManageWorkspace = (tenant: TenantData) => {
    if (!navigation) return;
    openOwnerWorkspace(navigation, tenant, dispatch);
  };

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <ScreenContainer scrollable contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 16 }}>




        {isLoading ? (
          <View className="py-8 justify-center items-center">
            <ActivityIndicator size="large" color={primary} />
          </View>
        ) : error ? (
          <Card className="p-5 border-red-500/20 mb-6 bg-red-500/5 items-center">
            <Text className="text-red-500 text-xs font-bold mb-2">Failed to load platform statistics</Text>
            <TouchableOpacity onPress={refetch} className="px-4 py-2 rounded-lg bg-red-500/10 border border-red-500/20">
              <Text className="text-red-500 text-xs font-bold uppercase">Retry</Text>
            </TouchableOpacity>
          </Card>
        ) : (
          <>
            {/* Row 1: Total Tenants */}
            <Card className="mb-4 p-5 flex-row justify-between items-center bg-gradient-to-r from-card to-card/50">
              <View>
                <Text className="text-xs text-muted dark:text-muted-dark font-bold tracking-normalr">
                  Total Registered Kitchens
                </Text>
                <Text className="text-3xl font-semibold text-text dark:text-text-dark mt-1">
                  {totalTenants}
                </Text>
              </View>
              <View className="p-3.5 rounded-2xl bg-zinc-800/80 border border-zinc-700/50">
                <Ionicons name="business" size={26} color={primary} />
              </View>
            </Card>

            {/* Row 2: Active & Deactivated split */}
            <View className="flex-row space-x-4 mb-6" style={{ gap: 16 }}>
              {/* Active */}
              <View className="flex-1">
                <Card className="p-4 bg-emerald-500/5 border-emerald-500/10">
                  <View className="flex-row justify-between items-center mb-2">
                    <Text className="text-xs text-muted dark:text-muted-dark font-bold tracking-normalr">
                      Active
                    </Text>
                    <View className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  </View>
                  <Text className="text-2xl font-semibold text-emerald-500 mt-1">
                    {activeTenants}
                  </Text>
                  <Text className="text-[10px] text-muted dark:text-muted-dark font-medium mt-1">
                    Operational workspaces
                  </Text>
                </Card>
              </View>

              {/* Deactivated */}
              <View className="flex-1">
                <Card className="p-4 bg-zinc-500/5 border-zinc-500/10">
                  <View className="flex-row justify-between items-center mb-2">
                    <Text className="text-xs text-muted dark:text-muted-dark font-bold tracking-normalr">
                      Suspended
                    </Text>
                    <View className="w-2.5 h-2.5 rounded-full bg-red-500" />
                  </View>
                  <Text className="text-2xl font-semibold text-red-500 mt-1">
                    {deactivatedTenants}
                  </Text>
                  <Text className="text-[10px] text-muted dark:text-muted-dark font-medium mt-1">
                    Locked workspaces
                  </Text>
                </Card>
              </View>
            </View>

            {/* Recent Registrations Section */}
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-lg font-semibold text-text dark:text-text-dark">
                Recent Workspace Signs
              </Text>
              <TouchableOpacity onPress={refetch} activeOpacity={0.7} className="flex-row items-center">
                <Ionicons name="refresh" size={14} color={primary} style={{ marginRight: 4 }} />
                <Text className="text-xs font-bold text-primary">Refresh</Text>
              </TouchableOpacity>
            </View>

            {tenants.length === 0 ? (
              <Card className="p-8 items-center justify-center">
                <Text className="text-muted dark:text-muted-dark text-xs font-bold">
                  No tenant accounts found.
                </Text>
              </Card>
            ) : (
              <View className="space-y-3" style={{ gap: 12 }}>
                {tenants.slice(0, 5).map((tenant) => (
                  <TouchableOpacity
                    key={tenant._id}
                    activeOpacity={0.85}
                    onPress={() => handleManageWorkspace(tenant)}
                  >
                    <Card className="p-4 flex-row justify-between items-center">
                      <View className="flex-1 pr-3">
                        <Text className="text-sm font-bold text-text dark:text-text-dark">
                          {tenant.businessName}
                        </Text>
                        <Text className="text-xs text-muted dark:text-muted-dark mt-0.5">
                          Owner: {tenant.ownerId?.name || 'N/A'} ({tenant.ownerId?.email || 'N/A'})
                        </Text>
                        <Text className="text-[10px] text-primary font-bold mt-1 tracking-normalr">
                          Tap to manage workspace
                        </Text>
                      </View>
                      <View
                        className={`px-2.5 py-1 rounded-full ${
                          tenant.status === 'active'
                            ? 'bg-emerald-500/10 border border-emerald-500/20'
                            : 'bg-red-500/10 border border-red-500/20'
                        }`}
                      >
                        <Text
                          className={`text-[10px] font-semibold uppercase ${
                            tenant.status === 'active' ? 'text-emerald-500' : 'text-red-500'
                          }`}
                        >
                          {tenant.status}
                        </Text>
                      </View>
                    </Card>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </>
        )}
      </ScreenContainer>
    </>
  );
}
