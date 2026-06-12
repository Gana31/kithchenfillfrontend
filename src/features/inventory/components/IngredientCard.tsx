import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Card from '../../../components/Card';
import { useThemeColors } from '../../../hooks/useThemeColors';
import { IngredientData } from '../inventoryApi';

interface IngredientCardProps {
  ingredient: IngredientData;
  isUpdating?: boolean;
  onEdit: () => void;
  onAdjust: () => void;
  onStepAdjust: (type: 'add' | 'deduct', baseAmount: number) => void;
}

// Robust helper function to parse user inputs (e.g. "100g", "1.5 kg", "250 ml", "2", or empty input)
export function parseStepAmount(input: string, baseUnit: string, conversionRatio: number): number {
  const trimmed = input.trim();
  
  // If input is empty, default to 1 kg / 1 L / 1 pc (which is 1000g/ml or 1 count)
  if (!trimmed) {
    if (baseUnit === 'g' || baseUnit === 'ml') {
      return 1000;
    }
    return 1;
  }

  // Parse digits and optional units
  const match = trimmed.match(/^([0-9.]+)\s*([a-zA-Z]*)$/);
  if (!match) {
    // If format is unrecognized, try parsing float directly
    const val = parseFloat(trimmed);
    if (isNaN(val) || val <= 0) {
      return baseUnit === 'g' || baseUnit === 'ml' ? 1000 : 1;
    }
    if (baseUnit === 'g' || baseUnit === 'ml') {
      return val * 1000; // Default to kg/L multiplier
    }
    return val;
  }

  const val = parseFloat(match[1]);
  if (isNaN(val) || val <= 0) {
    return baseUnit === 'g' || baseUnit === 'ml' ? 1000 : 1;
  }

  const unit = match[2].toLowerCase();
  
  // Weight units mapping
  if (unit === 'g' || unit === 'gm' || unit === 'gram' || unit === 'grams') {
    return val; // grams (base unit)
  }
  if (unit === 'kg' || unit === 'kilo' || unit === 'kilogram' || unit === 'kilograms') {
    return val * 1000; // convert to grams
  }

  // Volume units mapping
  if (unit === 'ml' || unit === 'milliliter' || unit === 'milliliters') {
    return val; // ml (base unit)
  }
  if (unit === 'l' || unit === 'liter' || unit === 'liters') {
    return val * 1000; // convert to ml
  }

  // Count/packaging units mapping
  if (unit === 'pcs' || unit === 'pc' || unit === 'piece' || unit === 'pieces') {
    return val; // pieces (base unit)
  }

  // If no unit is specified: default to kg (for weight) or L (for volume) or pcs (for count)
  if (baseUnit === 'g' || baseUnit === 'ml') {
    return val * 1000;
  }
  return val * conversionRatio;
}

export default function IngredientCard({ 
  ingredient, 
  isUpdating = false, 
  onEdit, 
  onAdjust, 
  onStepAdjust 
}: IngredientCardProps) {
  const { primary, danger, muted, success } = useThemeColors();
  const { name, currentStock, minThreshold, unitRelation, image } = ingredient;
  const [stepAmount, setStepAmount] = useState('');

  // Deriving category details based on name
  const getCategory = (itemName: string) => {
    const lowercaseName = itemName.toLowerCase();
    if (
      lowercaseName.includes('chicken') || 
      lowercaseName.includes('meat') || 
      lowercaseName.includes('mutton') || 
      lowercaseName.includes('fish') ||
      lowercaseName.includes('egg')
    ) {
      return { type: 'Meat', icon: '🍗', bgClass: 'bg-red-500/10', textClass: 'text-red-500 dark:text-red-400' };
    }
    if (
      lowercaseName.includes('butter') || 
      lowercaseName.includes('cream') || 
      lowercaseName.includes('milk') || 
      lowercaseName.includes('paneer') || 
      lowercaseName.includes('cheese') ||
      lowercaseName.includes('dairy')
    ) {
      return { type: 'Dairy', icon: '🥛', bgClass: 'bg-blue-500/10', textClass: 'text-blue-500 dark:text-blue-400' };
    }
    if (
      lowercaseName.includes('rice') || 
      lowercaseName.includes('grain') || 
      lowercaseName.includes('flour') || 
      lowercaseName.includes('basmati') ||
      lowercaseName.includes('wheat')
    ) {
      return { type: 'Grains', icon: '🌾', bgClass: 'bg-amber-500/20', textClass: 'text-amber-700 dark:text-amber-400' };
    }
    if (
      lowercaseName.includes('container') || 
      lowercaseName.includes('pack') || 
      lowercaseName.includes('box') || 
      lowercaseName.includes('bag') ||
      lowercaseName.includes('paper')
    ) {
      return { type: 'Packaging', icon: '📦', bgClass: 'bg-purple-500/10', textClass: 'text-purple-500 dark:text-purple-400' };
    }
    return { type: 'Pantry', icon: '🥫', bgClass: 'bg-emerald-500/10', textClass: 'text-emerald-500 dark:text-emerald-400' };
  };

  const { type, icon, bgClass, textClass } = getCategory(name);
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

  const getStepPlaceholder = () => {
    if (baseUnit === 'g') return '1 kg';
    if (baseUnit === 'ml') return '1 L';
    return '1 pc';
  };

  const formattedStock = formatStock(currentStock, baseUnit);
  const formattedThreshold = formatStock(minThreshold, baseUnit);
  const stepPlaceholder = getStepPlaceholder();

  return (
    <Card className="overflow-hidden border border-border/30 dark:border-border-dark/30 shadow-sm p-4">
      {/* Top Section: Photo, Name, and Stock badge */}
      <View className="flex-row items-center justify-between mb-3">
        {/* Left Side: Photo & Details */}
        <View className="flex-row items-center flex-1 mr-3">
          {image ? (
            <Image 
              source={{ uri: image }} 
              className="w-12 h-12 rounded-2xl mr-3 border border-border/10"
              resizeMode="cover"
            />
          ) : (
            <View className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 items-center justify-center mr-3">
              <Text className="text-xl">{icon}</Text>
            </View>
          )}

          <View className="flex-1">
            <View className="flex-row mb-0.5">
              <View className={`px-1.5 py-0.5 rounded-md ${bgClass}`}>
                <Text className={`text-[8px] font-black uppercase tracking-wider ${textClass}`}>{type}</Text>
              </View>
            </View>
            <Text className="text-sm font-black text-text dark:text-text-dark leading-tight" numberOfLines={1}>
              {name}
            </Text>
            <Text className="text-[10px] text-muted dark:text-muted-dark font-semibold mt-0.5">
              Threshold: {formattedThreshold}
            </Text>
          </View>
        </View>

        {/* Right Side: Stock Value and Edit controls */}
        <View className="flex-row items-center" style={{ gap: 8 }}>
          <TouchableOpacity 
            onPress={onAdjust}
            disabled={isUpdating}
            activeOpacity={0.8}
            className="bg-border/10 dark:bg-border-dark/10 border border-border/20 dark:border-border-dark/20 rounded-2xl px-3 py-1.5 items-end justify-center"
          >
            <Text className="text-[8px] text-muted dark:text-muted-dark font-bold uppercase tracking-wider mb-0.5">
              Current Stock
            </Text>
            <View className="flex-row items-center" style={{ gap: 4 }}>
              <Text className={`text-sm font-black ${isLowStock ? 'text-red-500' : 'text-text dark:text-text-dark'}`}>
                {formattedStock}
              </Text>
              <View className={`px-1 py-0.2 rounded-md ${isLowStock ? 'bg-red-500/10' : 'bg-emerald-500/10'}`}>
                <Text className={`text-[7px] font-black uppercase ${isLowStock ? 'text-red-500' : 'text-emerald-500'}`}>
                  {isLowStock ? 'Low' : 'OK'}
                </Text>
              </View>
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={onEdit}
            disabled={isUpdating}
            activeOpacity={0.7}
            className="w-8 h-8 rounded-xl bg-border/20 items-center justify-center active:bg-border/30 disabled:opacity-50"
          >
            <Ionicons name="pencil-sharp" size={14} color={primary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Bottom Section: Integrated Capsule Stepper Widget */}
      <View className="flex-row items-center bg-border/5 dark:bg-border-dark/5 border border-border/50 dark:border-border-dark/50 rounded-2xl p-1 justify-between">
        {/* Decrement Button */}
        <TouchableOpacity
          onPress={() => {
            const baseAmount = parseStepAmount(stepAmount, baseUnit, unitRelation.conversionRatio);
            onStepAdjust('deduct', baseAmount);
          }}
          disabled={isUpdating}
          activeOpacity={0.6}
          className="w-10 h-10 rounded-xl bg-red-500/10 justify-center items-center active:bg-red-500/20 disabled:opacity-50"
        >
          {isUpdating ? (
            <ActivityIndicator size="small" color={danger} />
          ) : (
            <Ionicons name="remove-outline" size={20} color={danger} />
          )}
        </TouchableOpacity>

        {/* Center: Custom Step Amount Input Field */}
        <View className="flex-row items-center justify-center flex-1 px-4" style={{ gap: 4 }}>
          <Text className="text-[9px] text-muted dark:text-muted-dark font-bold uppercase tracking-wider">
            Step Size:
          </Text>
          <View className="flex-row items-center bg-card dark:bg-card-dark border border-border dark:border-border-dark rounded-xl px-3 py-1 shadow-sm">
            <Ionicons name="create-outline" size={12} color={muted} style={{ marginRight: 4 }} />
            <TextInput
              value={stepAmount}
              onChangeText={setStepAmount}
              keyboardType="default"
              placeholder={stepPlaceholder}
              placeholderTextColor={muted}
              editable={!isUpdating}
              className="w-16 h-7 text-center text-xs font-black text-text dark:text-text-dark p-0 m-0"
              style={{ paddingVertical: 0 }}
            />
          </View>
        </View>

        {/* Increment Button */}
        <TouchableOpacity
          onPress={() => {
            const baseAmount = parseStepAmount(stepAmount, baseUnit, unitRelation.conversionRatio);
            onStepAdjust('add', baseAmount);
          }}
          disabled={isUpdating}
          activeOpacity={0.6}
          className="w-10 h-10 rounded-xl bg-emerald-500/10 justify-center items-center active:bg-emerald-500/20 disabled:opacity-50"
        >
          {isUpdating ? (
            <ActivityIndicator size="small" color={success} />
          ) : (
            <Ionicons name="add-outline" size={20} color={success} />
          )}
        </TouchableOpacity>
      </View>
    </Card>
  );
}
