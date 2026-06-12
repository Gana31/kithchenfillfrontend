import React, { useState } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator, 
  Alert
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { 
  useGetTenantsQuery, 
  useToggleTenantStatusMutation 
} from './superadminApi';
import Card from '../../components/Card';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '../../hooks/useThemeColors';
import SearchBar from './components/SearchBar';
import OwnerCard from './components/OwnerCard';
import AddOwnerModal from './components/AddOwnerModal';

export default function ManageOwnersScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { primary, isDark } = useThemeColors();
  
  // API Queries & Mutations
  const { data, isLoading, error, refetch } = useGetTenantsQuery();
  const [toggleTenantStatus, { isLoading: isToggling }] = useToggleTenantStatusMutation();

  const [searchQuery, setSearchQuery] = useState('');
  const [isModalVisible, setIsModalVisible] = useState(false);

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
        // Success
      }
    } catch (err: any) {
      Alert.alert('Error', err.data?.error || 'Failed to update tenant status.');
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
          <ScrollView
            contentContainerStyle={{ paddingBottom: insets.bottom + 120 }}
            className="flex-1"
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
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
