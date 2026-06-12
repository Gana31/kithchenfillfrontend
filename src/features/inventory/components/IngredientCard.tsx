import React from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Card from '../../../components/Card';
import { useThemeColors } from '../../../hooks/useThemeColors';
import { IngredientData } from '../inventoryApi';

interface IngredientCardProps {
  ingredient: IngredientData;
  onEdit: () => void;
  onAdjust: () => void;
  onStepAdjust: (type: 'add' | 'deduct') => void;
}

export default function IngredientCard({ ingredient, onEdit, onAdjust, onStepAdjust }: IngredientCardProps) {
  const { primary, danger, muted, success } = useThemeColors();
  const { name, currentStock, minThreshold, unitRelation, image } = ingredient;

  // Deriving category/icon based on name
  const getCategory = (itemName: string) => {
    const lowercaseName = itemName.toLowerCase();
    if (
      lowercaseName.includes('chicken') || 
      lowercaseName.includes('meat') || 
      lowercaseName.includes('mutton') || 
      lowercaseName.includes('fish') ||
      lowercaseName.includes('egg')
    ) {
      return { type: 'Meat', icon: '🍗' };
    }
    if (
      lowercaseName.includes('butter') || 
      lowercaseName.includes('cream') || 
      lowercaseName.includes('milk') || 
      lowercaseName.includes('paneer') || 
      lowercaseName.includes('cheese') ||
      lowercaseName.includes('dairy')
    ) {
      return { type: 'Dairy', icon: '🥛' };
    }
    if (
      lowercaseName.includes('rice') || 
      lowercaseName.includes('grain') || 
      lowercaseName.includes('flour') || 
      lowercaseName.includes('basmati') ||
      lowercaseName.includes('wheat')
    ) {
      return { type: 'Grains', icon: '🌾' };
    }
    if (
      lowercaseName.includes('container') || 
      lowercaseName.includes('pack') || 
      lowercaseName.includes('box') || 
      lowercaseName.includes('bag') ||
      lowercaseName.includes('paper')
    ) {
      return { type: 'Packaging', icon: '📦' };
    }
    return { type: 'Pantry', icon: '🥫' };
  };

  const { type, icon } = getCategory(name);
  const isLowStock = currentStock <= minThreshold;
  const baseUnit = unitRelation.baseUnit;

  // Formatted stock display
  const formatStock = (stock: number, unit: string) => {
    if (unit === 'g') {
      return `${(stock / 1000).toFixed(2)} kg`;
    }
    if (unit === 'ml') {
      return `${(stock / 1000).toFixed(2)} liters`;
    }
    return `${stock} pcs`;
  };

  const formattedStock = formatStock(currentStock, baseUnit);
  const formattedThreshold = formatStock(minThreshold, baseUnit);

  return (
    <Card className="p-4">
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center flex-1 mr-2">
          {/* Image / Icon Thumbnail */}
          {image ? (
            <Image 
              source={{ uri: image }} 
              className="w-12 h-12 rounded-xl mr-3"
              resizeMode="cover"
            />
          ) : (
            <View className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 items-center justify-center mr-3">
              <Text className="text-xl">{icon}</Text>
            </View>
          )}

          <View className="flex-1 pr-1">
            <Text className="text-[10px] font-bold text-primary uppercase tracking-wider mb-0.5">
              {type}
            </Text>
            <Text className="text-sm font-bold text-text dark:text-text-dark leading-tight" numberOfLines={1}>
              {name}
            </Text>
            <Text className="text-xs text-muted dark:text-muted-dark mt-0.5 font-semibold">
              Alert Threshold: {formattedThreshold}
            </Text>
          </View>
        </View>

        <View className="flex-row items-center" style={{ gap: 10 }}>
          {/* Edit Button */}
          <TouchableOpacity 
            onPress={onEdit}
            activeOpacity={0.7}
            className="w-8 h-8 rounded-lg bg-border/20 items-center justify-center"
          >
            <Ionicons name="pencil-outline" size={14} color={primary} />
          </TouchableOpacity>

          {/* Stock Stepper Controls */}
          <View className="flex-row items-center bg-border/10 border border-border dark:border-border-dark rounded-xl px-1 py-1" style={{ gap: 4 }}>
            {/* Minus Button */}
            <TouchableOpacity 
              onPress={() => onStepAdjust('deduct')}
              activeOpacity={0.6}
              className="w-7 h-7 rounded-lg bg-red-500/10 items-center justify-center active:bg-red-500/20"
            >
              <Ionicons name="remove" size={14} color={danger} />
            </TouchableOpacity>

            {/* Current Stock (Clickable to open custom adjust modal) */}
            <TouchableOpacity 
              onPress={onAdjust}
              activeOpacity={0.7}
              className="px-2 items-center justify-center"
            >
              <Text className={`text-sm font-black ${isLowStock ? 'text-red-500' : 'text-text dark:text-text-dark'}`}>
                {formattedStock}
              </Text>
              <Text className="text-[8px] text-muted dark:text-muted-dark font-bold uppercase tracking-wider -mt-0.5">
                {isLowStock ? 'Low' : 'Good'}
              </Text>
            </TouchableOpacity>

            {/* Plus Button */}
            <TouchableOpacity 
              onPress={() => onStepAdjust('add')}
              activeOpacity={0.6}
              className="w-7 h-7 rounded-lg bg-emerald-500/10 items-center justify-center active:bg-emerald-500/20"
            >
              <Ionicons name="add" size={14} color={success} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Card>
  );
}
