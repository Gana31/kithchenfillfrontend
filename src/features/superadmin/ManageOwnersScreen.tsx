import React, { useCallback, useMemo, useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  ActivityIndicator,
  LayoutChangeEvent,
} from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { 
  useGetTenantsQuery, 
  useToggleTenantStatusMutation 
} from './superadminApi';
import Card from '../../components/Card';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '../../hooks/useThemeColors';
import SearchBar from '../../components/SearchBar';
import OwnerCard from './components/OwnerCard';
import AddOwnerModal from './components/AddOwnerModal';
import { useAppDispatch } from '../../store/store';
import { showToast } from '../../store/toastSlice';

export default function ManageOwnersScreen({ navigation }: any) {
  const dispatch = useAppDispatch();
  const insets = useSafeAreaInsets();
  const { primary, isDark } = useThemeColors();
  
  // API Queries & Mutations
  const { data, isLoading, error, refetch } = useGetTenantsQuery();
  const [toggleTenantStatus, { isLoading: isToggling }] = useToggleTenantStatusMutation();

  const [searchQuery, setSearchQuery] = useState('');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [scrollAreaHeight, setScrollAreaHeight] = useState(0);

  const onScrollAreaLayout = useCallback((event: LayoutChangeEvent) => {
    setScrollAreaHeight(event.nativeEvent.layout.height);
  }, []);

  const scrollContentStyle = useMemo(
    () => ({
      paddingBottom: insets.bottom + 120,
      ...(scrollAreaHeight > 0 ? { minHeight: scrollAreaHeight } : null),
    }),
    [insets.bottom, scrollAreaHeight]
  );

  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          onPress={() => setIsModalVisible(true)}
          activeOpacity={0.7}
          className="w-10 h-10 rounded-xl bg-card dark:bg-card-dark border border-border dark:border-border-dark justify-center items-center mr-6 shadow-sm"
        >
          <Ionicons name="add" size={22} color={primary} />
        </TouchableOpacity>
      ),
    });
  }, [navigation, primary]);

  // Handle tenant status toggle
  const handleToggleStatus = async (id: string, currentStatus: 'active' | 'deactivated') => {
    const newStatus = currentStatus === 'active' ? 'deactivated' : 'active';
    try {
      const response = await toggleTenantStatus({ id, status: newStatus }).unwrap();
      if (response.success) {
        dispatch(
          showToast({
            title: 'Success',
            message: `Owner account status updated to ${newStatus}.`,
            type: 'success',
          })
        );
      }
    } catch (err: any) {
      dispatch(
        showToast({
          title: 'Error',
          message: err.data?.error || 'Failed to update tenant status.',
          type: 'error',
        })
      );
    }
  };

  // Filtering tenants list based on search query
  const tenants = data?.tenants || [];
  const filteredTenants = tenants.filter(t => 
    t.businessName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.ownerId?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.ownerId?.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <View className="flex-1 bg-transparent">
      <StatusBar style={isDark ? 'light' : 'dark'} />

      <View className="flex-1 px-6">
        {/* Search Bar */}
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search by kitchen name, owner, or email..."
        />

        {/* Main List */}
        {isLoading ? (
          <View className="flex-1 justify-center items-center">
            <ActivityIndicator size="large" color={primary} />
            <Text className="text-xs text-muted mt-3 font-semibold uppercase tracking-widest">
              Loading accounts...
            </Text>
          </View>
        ) : error ? (
          <View className="flex-1 justify-center items-center">
            <Text className="text-red-500 text-xs font-bold mb-4">Error fetching tenant list</Text>
            <TouchableOpacity onPress={refetch} className="px-4 py-2 rounded-xl bg-card border border-border">
              <Text className="text-primary text-xs font-black uppercase">Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View className="flex-1" onLayout={onScrollAreaLayout} collapsable={false}>
            <ScrollView
              style={{ flex: 1 }}
              contentContainerStyle={scrollContentStyle}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              nestedScrollEnabled
              alwaysBounceVertical
              overScrollMode="always"
              scrollEventThrottle={16}
            >
            {filteredTenants.length === 0 ? (
              <Card className="p-8 items-center justify-center">
                <Text className="text-muted dark:text-muted-dark text-xs font-bold text-center">
                  {searchQuery ? 'No match found for your search query.' : 'No kitchen owners registered.'}
                </Text>
              </Card>
            ) : (
              <View className="space-y-4" style={{ gap: 16 }}>
                {filteredTenants.map((tenant) => (
                  <OwnerCard
                    key={tenant._id}
                    tenant={tenant}
                    onToggleStatus={handleToggleStatus}
                    isToggling={isToggling}
                  />
                ))}
              </View>
            )}
            </ScrollView>
          </View>
        )}
      </View>

      {/* Add New Owner Modal */}
      <AddOwnerModal
        visible={isModalVisible}
        onClose={() => setIsModalVisible(false)}
      />
    </View>
  );
}
