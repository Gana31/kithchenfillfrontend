import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Platform, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import Card from '../../components/Card';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '../../hooks/useThemeColors';

export default function RecipeBuilderScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { primary, muted, isDark } = useThemeColors();

  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          onPress={() => Alert.alert('Add Recipe', 'Form to add new recipe batch details will be loaded here.')}
          activeOpacity={0.7}
          className="w-10 h-10 rounded-xl bg-card dark:bg-card-dark border border-border dark:border-border-dark justify-center items-center mr-6 shadow-sm"
        >
          <Ionicons name="add" size={22} color={primary} />
        </TouchableOpacity>
      ),
    });
  }, [navigation]);

  // Mock recipes data
  const recipes = [
    { id: '1', name: 'Butter Chicken (1kg Batch)', ingredientsCount: 8, makingCost: 350.00, yieldVal: '1000g' },
    { id: '2', name: 'Paneer Tikka Masala (1kg Batch)', ingredientsCount: 6, makingCost: 280.00, yieldVal: '1000g' },
    { id: '3', name: 'Chicken Biryani (1kg Batch)', ingredientsCount: 12, makingCost: 410.00, yieldVal: '1000g' },
    { id: '4', name: 'Jeera Rice (1kg Batch)', ingredientsCount: 4, makingCost: 90.00, yieldVal: '1000g' },
  ];

  return (
    <View 
      className="flex-1 bg-transparent" 
    >
      <StatusBar style={isDark ? 'light' : 'dark'} />

      <ScrollView 
        contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 16, paddingBottom: insets.bottom + 120 }}
        className="flex-1"
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        scrollEventThrottle={16}
      >

        {/* Info card */}
        <Card className="mb-6 bg-primary/10 border-primary/20">
          <View className="flex-row items-center space-x-3">
            <View className="p-2 rounded-xl bg-primary/20">
              <Ionicons name="restaurant" size={20} color={primary} />
            </View>
            <View className="flex-1 ml-3">
              <Text className="text-sm font-black text-text dark:text-text-dark">
                Portion Control Active
              </Text>
              <Text className="text-xs text-muted dark:text-muted-dark mt-0.5 leading-relaxed">
                Define batch yields (e.g. 1kg Biryani) then specify portion selling sizes (e.g. 250g half, 500g full) with automated cost calculations.
              </Text>
            </View>
          </View>
        </Card>

        {/* Recipes List */}
        <Text className="text-lg font-black text-text dark:text-text-dark mb-4">
          Cooked Batches
        </Text>

        <View className="space-y-4" style={{ gap: 16 }}>
          {recipes.map((recipe) => (
            <Card key={recipe.id} className="p-5">
              <View className="flex-row justify-between items-start">
                <View className="flex-grow pr-4">
                  <Text className="text-base font-black text-text dark:text-text-dark leading-tight">
                    {recipe.name}
                  </Text>
                  <View className="flex-row items-center mt-2" style={{ gap: 12 }}>
                    <View className="flex-row items-center" style={{ gap: 4 }}>
                      <Ionicons name="leaf-outline" size={12} color={muted} />
                      <Text className="text-[11px] text-muted dark:text-muted-dark font-bold">
                        {recipe.ingredientsCount} ingredients
                      </Text>
                    </View>
                    <View className="flex-row items-center" style={{ gap: 4 }}>
                      <Ionicons name="scale-outline" size={12} color={muted} />
                      <Text className="text-[11px] text-muted dark:text-muted-dark font-bold">
                        Yield: {recipe.yieldVal}
                      </Text>
                    </View>
                  </View>
                </View>

                <View className="items-end">
                  <Text className="text-xs text-muted dark:text-muted-dark font-bold uppercase">Making Cost</Text>
                  <Text className="text-lg font-black text-primary mt-0.5">
                    ₹{recipe.makingCost.toFixed(2)}
                  </Text>
                </View>
              </View>
            </Card>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
