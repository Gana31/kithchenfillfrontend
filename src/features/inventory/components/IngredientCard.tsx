import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Card from '../../../components/Card';
import { useThemeColors } from '../../../hooks/useThemeColors';
import { IngredientData } from '../inventoryApi';

interface IngredientCardProps {
  ingredient: IngredientData;
  onEdit: () => void;
  onAdjust: () => void;
  onStepAdjust: (type: 'add' | 'deduct', amount: number) => void;
}

export default function IngredientCard({ ingredient, onEdit, onAdjust, onStepAdjust }: IngredientCardProps) {
  const { primary, danger, muted, success } = useThemeColors();
  const { name, currentStock, minThreshold, unitRelation, image } = ingredient;
  const [stepAmount, setStepAmount] = useState('1');

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
      return `${(stock / 1000).toFixed(2)} L`;
    }
    return `${stock} pcs`;
  };

  const getUnitName = () => {
    if (baseUnit === 'g') return 'kg';
    if (baseUnit === 'ml') return 'L';
    return 'pcs';
  };

  const formattedStock = formatStock(currentStock, baseUnit);
  const formattedThreshold = formatStock(minThreshold, baseUnit);
  const unitLabel = getUnitName();

  return (
    <Card className="overflow-hidden">
      <View className="flex-row items-stretch">
        
        {/* Left Side: Minus Button */}
        <TouchableOpacity 
          onPress={() => {
            const amount = Number(stepAmount);
            if (!isNaN(amount) && amount > 0) {
              onStepAdjust('deduct', amount);
            }
          }}
          activeOpacity={0.6}
          className="w-12 bg-red-500/10 border-r border-border dark:border-border-dark justify-center items-center active:bg-red-500/20"
        >
          <Ionicons name="remove" size={22} color={danger} />
        </TouchableOpacity>

        {/* Middle Content */}
        <View className="flex-1 p-4">
          {/* Row 1: Header (Category, Name, Edit Pencil) */}
          <View className="flex-row items-center justify-between mb-3">
            <View className="flex-row items-center flex-1 mr-2">
              {/* Image / Icon Thumbnail */}
              {image ? (
                <Image 
                  source={{ uri: image }} 
                  className="w-10 h-10 rounded-xl mr-3"
                  resizeMode="cover"
                />
              ) : (
                <View className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 items-center justify-center mr-3">
                  <Text className="text-lg">{icon}</Text>
                </View>
              )}

              <View className="flex-1">
                <Text className="text-[9px] font-bold text-primary uppercase tracking-wider">
                  {type}
                </Text>
                <Text className="text-sm font-bold text-text dark:text-text-dark leading-tight" numberOfLines={1}>
                  {name}
                </Text>
                <Text className="text-[9px] text-muted dark:text-muted-dark font-semibold mt-0.5">
                  Threshold: {formattedThreshold}
                </Text>
              </View>
            </View>

            {/* Edit Button */}
            <TouchableOpacity 
              onPress={onEdit}
              activeOpacity={0.7}
              className="w-8 h-8 rounded-lg bg-border/20 items-center justify-center"
            >
              <Ionicons name="pencil-outline" size={14} color={primary} />
            </TouchableOpacity>
          </View>

          {/* Row 2: Stock Display & Step Input */}
          <View className="flex-row items-center justify-between pt-2 border-t border-border/10">
            {/* Stock Level */}
            <TouchableOpacity 
              onPress={onAdjust}
              activeOpacity={0.7}
              className="flex-row items-center"
            >
              <View className="mr-2">
                <Text className="text-[8px] text-muted dark:text-muted-dark font-bold uppercase tracking-wider">
                  Stock
                </Text>
                <Text className={`text-sm font-black ${isLowStock ? 'text-red-500' : 'text-text dark:text-text-dark'}`}>
                  {formattedStock}
                </Text>
              </View>
              <View className={`px-1.5 py-0.5 rounded-md ${isLowStock ? 'bg-red-500/10' : 'bg-emerald-500/10'}`}>
                <Text className={`text-[8px] font-black uppercase ${isLowStock ? 'text-red-500' : 'text-emerald-500'}`}>
                  {isLowStock ? 'Low' : 'Good'}
                </Text>
              </View>
            </TouchableOpacity>

            {/* Stepper Amount Input */}
            <View className="flex-row items-center" style={{ gap: 6 }}>
              <Text className="text-[9px] text-muted dark:text-muted-dark font-bold uppercase">
                Step ({unitLabel})
              </Text>
              <TextInput
                value={stepAmount}
                onChangeText={setStepAmount}
                keyboardType="numeric"
                placeholder="1"
                placeholderTextColor={muted}
                className="w-14 h-7 bg-border/10 border border-border dark:border-border-dark rounded-lg text-center text-xs font-bold text-text dark:text-text-dark p-0 m-0"
                style={{ paddingVertical: 0 }}
              />
            </View>
          </View>
        </View>

        {/* Right Side: Plus Button */}
        <TouchableOpacity 
          onPress={() => {
            const amount = Number(stepAmount);
            if (!isNaN(amount) && amount > 0) {
              onStepAdjust('add', amount);
            }
          }}
          activeOpacity={0.6}
          className="w-12 bg-emerald-500/10 border-l border-border dark:border-border-dark justify-center items-center active:bg-emerald-500/20"
        >
          <Ionicons name="add" size={22} color={success} />
        </TouchableOpacity>

      </View>
    </Card>
  );
}
