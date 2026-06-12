import React, { useState } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator,
  TextInput
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import Card from '../../components/Card';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useGetIngredientsQuery, IngredientData } from './inventoryApi';
import IngredientCard from './components/IngredientCard';
import AddIngredientModal from './components/AddIngredientModal';
import AdjustStockModal from './components/AdjustStockModal';

export default function InventoryScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { primary, danger, muted, isDark } = useThemeColors();
  
  // Local state for modals and active items
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingIngredient, setEditingIngredient] = useState<IngredientData | null>(null);

  const [isAdjustModalVisible, setIsAdjustModalVisible] = useState(false);
  const [adjustingIngredient, setAdjustingIngredient] = useState<IngredientData | null>(null);

  const [searchQuery, setSearchQuery] = useState('');

  // Fetch ingredients from API
  const { data, isLoading, error, refetch } = useGetIngredientsQuery();

  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          onPress={() => {
            setEditingIngredient(null);
            setIsModalVisible(true);
          }}
          activeOpacity={0.7}
          className="w-10 h-10 rounded-xl bg-card dark:bg-card-dark border border-border dark:border-border-dark justify-center items-center mr-6 shadow-sm"
        >
          <Ionicons name="add" size={22} color={primary} />
        </TouchableOpacity>
      ),
    });
  }, [navigation, primary]);

  const ingredients = data?.ingredients || [];
  const lowStockCount = ingredients.filter(
    (item) => item.currentStock <= item.minThreshold
  ).length;

  const filteredIngredients = ingredients.filter((item) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <View className="flex-1 bg-transparent">
      <StatusBar style={isDark ? 'light' : 'dark'} />

      <ScrollView 
        contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 16, paddingBottom: insets.bottom + 120 }}
        className="flex-1"
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        scrollEventThrottle={16}
      >
        {/* Low Stock Alerts Banner */}
        {lowStockCount > 0 ? (
          <Card className="mb-6 bg-red-500/10 border-red-500/20">
            <View className="flex-row items-center space-x-3">
              <View className="p-2 rounded-xl bg-red-500/20">
                <Ionicons name="warning" size={20} color={danger} />
              </View>
              <View className="flex-1 ml-3">
                <Text className="text-sm font-black text-text dark:text-text-dark">
                  {lowStockCount} {lowStockCount === 1 ? 'Item' : 'Items'} Below Threshold!
                </Text>
                <Text className="text-xs text-muted dark:text-muted-dark mt-0.5 leading-relaxed">
                  Some ingredients are running critically low. Reorder soon to maintain seamless kitchen operations.
                </Text>
              </View>
            </View>
          </Card>
        ) : null}

        {/* Inventory Header */}
        <Text className="text-lg font-black text-text dark:text-text-dark mb-4">
          All Ingredients
        </Text>

        {/* Search Bar */}
        <View className="mb-6 flex-row items-center bg-card dark:bg-card-dark border border-border dark:border-border-dark rounded-2xl px-4 py-3 shadow-sm">
          <Ionicons name="search-outline" size={18} color={muted} style={{ marginRight: 8 }} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search ingredients..."
            placeholderTextColor={muted}
            className="flex-1 text-sm font-semibold text-text dark:text-text-dark py-0"
            style={{ paddingVertical: 0 }}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')} activeOpacity={0.7}>
              <Ionicons name="close-circle" size={18} color={muted} />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Main Content State Rendering */}
        {isLoading ? (
          <View className="py-20 justify-center items-center">
            <ActivityIndicator size="large" color={primary} />
            <Text className="text-xs text-muted mt-3 font-semibold uppercase tracking-widest">
              Loading inventory...
            </Text>
          </View>
        ) : error ? (
          <View className="py-20 justify-center items-center">
            <Text className="text-red-500 text-xs font-bold mb-4">Error fetching inventory</Text>
            <TouchableOpacity onPress={refetch} className="px-4 py-2 rounded-xl bg-card border border-border">
              <Text className="text-primary text-xs font-black uppercase">Retry</Text>
            </TouchableOpacity>
          </View>
        ) : ingredients.length === 0 ? (
          <Card className="p-8 items-center justify-center">
            <Text className="text-muted dark:text-muted-dark text-xs font-bold text-center">
              No ingredients in stock. Tap the '+' button in the top right to register your first ingredient.
            </Text>
          </Card>
        ) : filteredIngredients.length === 0 ? (
          <Card className="p-8 items-center justify-center">
            <Text className="text-muted dark:text-muted-dark text-xs font-bold text-center">
              No ingredients match "{searchQuery}"
            </Text>
          </Card>
        ) : (
          <View className="space-y-4" style={{ gap: 16 }}>
            {filteredIngredients.map((item) => (
              <IngredientCard 
                key={item._id} 
                ingredient={item} 
                onEdit={() => {
                  setEditingIngredient(item);
                  setIsModalVisible(true);
                }}
                onAdjust={() => {
                  setAdjustingIngredient(item);
                  setIsAdjustModalVisible(true);
                }}
              />
            ))}
          </View>
        )}
      </ScrollView>

      {/* Add / Edit Ingredient Modal */}
      <AddIngredientModal
        visible={isModalVisible}
        onClose={() => {
          setIsModalVisible(false);
          setEditingIngredient(null);
        }}
        ingredient={editingIngredient}
      />

      {/* Quick Adjust Stock Modal */}
      <AdjustStockModal
        visible={isAdjustModalVisible}
        onClose={() => {
          setIsAdjustModalVisible(false);
          setAdjustingIngredient(null);
        }}
        ingredient={adjustingIngredient}
      />
    </View>
  );
}
