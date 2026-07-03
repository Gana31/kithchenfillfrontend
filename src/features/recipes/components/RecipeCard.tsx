import React from 'react';
import { View, Text, Pressable, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Card from '../../../components/Card';
import { RecipeData } from '../recipesApi';
import { formatInr } from '../../dashboard/dashboardUtils';
import { InventoryLayout } from '../../inventory/inventoryUtils';

interface RecipeCardProps {
  recipe: RecipeData;
  layout: InventoryLayout;
  width?: number;
  muted: string;
  primary: string;
  isDeleting: boolean;
  onPreview: (recipe: RecipeData) => void;
  onEdit: (recipeId: string) => void;
  onDelete: (recipe: RecipeData) => void;
}

function RecipeCardBase({
  recipe,
  layout,
  width,
  muted,
  primary,
  isDeleting,
  onPreview,
  onEdit,
  onDelete,
}: RecipeCardProps) {
  const batchCost = recipe.costing?.batchCost ?? 0;
  const yieldLabel = `${recipe.batchYieldAmount}${recipe.batchYieldUnit}`;
  const customCount = recipe.customCostLines?.length ?? 0;
  const itemCount = recipe.ingredientsUsed.length + customCount;

  if (layout === 'grid') {
    return (
      <Pressable onPress={() => onPreview(recipe)} style={{ width }}>
        <View className="bg-card dark:bg-card-dark rounded-2xl border border-border dark:border-border-dark shadow-sm p-3 items-center">
          <View className="w-11 h-11 rounded-full bg-primary/10 items-center justify-center mb-2">
            <Ionicons name="restaurant-outline" size={22} color={primary} />
          </View>

          <Text
            className="text-[12px] font-semibold text-text dark:text-text-dark text-center leading-tight"
            numberOfLines={2}
            style={{ minHeight: 30 }}
          >
            {recipe.name}
          </Text>

          <Text className="text-base font-bold text-primary text-center mt-1.5" numberOfLines={1}>
            {formatInr(batchCost)}
          </Text>

          <Text className="text-[10px] text-muted dark:text-muted-dark font-semibold text-center mt-0.5" numberOfLines={1}>
            {itemCount} items · {yieldLabel}
          </Text>

          <View
            className="flex-row items-center justify-center mt-2.5 pt-2.5 border-t border-border/40 dark:border-border-dark/40 w-full"
            style={{ gap: 22 }}
          >
            <TouchableOpacity onPress={() => onEdit(recipe._id)} hitSlop={8} disabled={isDeleting}>
              <Ionicons name="create-outline" size={17} color={primary} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => onDelete(recipe)} hitSlop={8} disabled={isDeleting}>
              <Ionicons name="trash-outline" size={17} color="#ef4444" />
            </TouchableOpacity>
          </View>
        </View>
      </Pressable>
    );
  }

  return (
    <Card className="p-5">
      <Pressable onPress={() => onPreview(recipe)}>
        <View className="flex-row justify-between items-start">
          <View className="flex-grow pr-3">
            <Text className="text-base font-semibold text-text dark:text-text-dark leading-tight">
              {recipe.name}
            </Text>
            <View className="flex-row items-center mt-2 flex-wrap" style={{ gap: 12 }}>
              <View className="flex-row items-center" style={{ gap: 4 }}>
                <Ionicons name="leaf-outline" size={12} color={muted} />
                <Text className="text-[11px] text-muted dark:text-muted-dark font-bold">{itemCount} items</Text>
              </View>
              <View className="flex-row items-center" style={{ gap: 4 }}>
                <Ionicons name="scale-outline" size={12} color={muted} />
                <Text className="text-[11px] text-muted dark:text-muted-dark font-bold">Yield: {yieldLabel}</Text>
              </View>
            </View>
          </View>

          <View className="items-end">
            <Text className="text-xs text-muted dark:text-muted-dark font-bold uppercase">Total cost</Text>
            <Text className="text-lg font-semibold text-primary mt-0.5">{formatInr(batchCost)}</Text>
          </View>
        </View>
      </Pressable>

      <View
        className="flex-row items-center justify-end mt-4 pt-3 border-t border-border/30 dark:border-border-dark/30"
        style={{ gap: 16 }}
      >
        <TouchableOpacity
          onPress={() => onEdit(recipe._id)}
          className="flex-row items-center"
          style={{ gap: 6 }}
          disabled={isDeleting}
        >
          <Ionicons name="create-outline" size={18} color={primary} />
          <Text className="text-xs font-bold text-primary">Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => onDelete(recipe)}
          className="flex-row items-center"
          style={{ gap: 6 }}
          disabled={isDeleting}
        >
          <Ionicons name="trash-outline" size={18} color="#ef4444" />
          <Text className="text-xs font-bold text-red-500">Delete</Text>
        </TouchableOpacity>
      </View>
    </Card>
  );
}

const RecipeCard = React.memo(RecipeCardBase);
export default RecipeCard;
