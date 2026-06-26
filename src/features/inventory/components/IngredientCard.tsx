import React, { useMemo } from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '../../../hooks/useThemeColors';
import { IngredientData } from '../inventoryApi';
import {
  getCategoryDetails,
  formatStock,
  formatPurchasePriceDisplay,
  getStockLevelTheme,
  getStockLevelBorderStyle,
  computeStockLevel,
} from '../inventoryUtils';
import StockStepper from './StockStepper';

interface IngredientCardProps {
  ingredient: IngredientData;
  isUpdating?: boolean;
  onEdit: () => void;
  onAdjust: () => void;
  onStepAdjust: (type: 'add' | 'deduct', baseAmount: number) => void;
  onDelete: () => void;
}

function IngredientCard({
  ingredient,
  isUpdating = false,
  onEdit,
  onAdjust,
  onStepAdjust,
  onDelete,
}: IngredientCardProps) {
  const { primary, danger, muted, isDark } = useThemeColors();
  const {
    name,
    currentStock,
    minThreshold,
    unitRelation = { baseUnit: 'g', conversionRatio: 1000, purchaseUnit: 'kg' },
    image,
  } = ingredient;

  const baseUnit = unitRelation.baseUnit;
  const displayStock = Math.max(0, currentStock);
  const stockLevel = useMemo(
    () => computeStockLevel(displayStock, minThreshold),
    [displayStock, minThreshold]
  );

  const { type, icon, bgClass, textClass } = getCategoryDetails(ingredient.category, name);
  const stockTheme = getStockLevelTheme(stockLevel, isDark);
  const stockBorder = getStockLevelBorderStyle(stockLevel, isDark, 4);
  const formattedStock = formatStock(displayStock, baseUnit);
  const formattedPrice = formatPurchasePriceDisplay(ingredient);
  const showStepLoading = isUpdating;

  return (
    <View
      className="overflow-hidden shadow-sm p-3 rounded-3xl border border-border/30 dark:border-border-dark/30 bg-card dark:bg-card-dark w-full"
      style={stockBorder ?? undefined}
    >
      <View className="flex-row items-center mb-3">
        <View className="flex-row items-center flex-1 mr-2">
          {image ? (
            <Image
              key={ingredient._id}
              source={{ uri: image }}
              className="w-11 h-11 rounded-xl mr-2.5 border border-border/10"
              resizeMode="cover"
            />
          ) : (
            <View className="w-11 h-11 rounded-xl bg-primary/10 border border-primary/20 items-center justify-center mr-2.5">
              <Text className="text-lg">{icon}</Text>
            </View>
          )}

          <View className="flex-1">
            <Text
              className="text-sm font-black text-text dark:text-text-dark leading-tight"
              numberOfLines={2}
            >
              {name}
            </Text>
            <View className={`self-start px-1.5 py-0.5 rounded-md mt-1 ${bgClass}`}>
              <Text className={`text-[8px] font-black uppercase tracking-wider ${textClass}`}>
                {type}
              </Text>
            </View>
          </View>
        </View>

        <View className="items-center mx-2" style={{ minWidth: 80 }}>
          <TouchableOpacity
            onPress={onAdjust}
            disabled={isUpdating}
            activeOpacity={0.8}
            className="bg-border/10 dark:bg-border-dark/10 border border-border/20 dark:border-border-dark/20 rounded-xl px-3 py-1.5 items-center w-full"
          >
            <Text className="text-[7px] text-muted dark:text-muted-dark font-bold uppercase tracking-wider mb-0.5">
              Stock
            </Text>
            <View className="flex-row items-center" style={{ gap: 3 }}>
              <Text
                className={`text-sm font-black ${stockTheme?.badgeTextClass ?? 'text-text dark:text-text-dark'}`}
              >
                {formattedStock}
              </Text>
              {stockTheme ? (
                <View className={`px-1 py-0.5 rounded ${stockTheme.badgeBgClass}`}>
                  <Text className={`text-[6px] font-black uppercase ${stockTheme.badgeTextClass}`}>
                    {stockTheme.label}
                  </Text>
                </View>
              ) : null}
            </View>
          </TouchableOpacity>

          <Text
            className={`text-[10px] font-black mt-1.5 text-center ${
              formattedPrice.hasPrice ? 'text-primary' : 'text-muted dark:text-muted-dark'
            }`}
          >
            {formattedPrice.text}
          </Text>
        </View>

        <View className="items-center justify-center" style={{ gap: 6 }}>
          <TouchableOpacity
            onPress={onEdit}
            disabled={isUpdating}
            activeOpacity={0.7}
            className="w-8 h-8 rounded-xl bg-border/20 items-center justify-center active:bg-border/30 disabled:opacity-50"
          >
            <Ionicons name="pencil-sharp" size={14} color={primary} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={onDelete}
            disabled={isUpdating}
            activeOpacity={0.7}
            className="w-8 h-8 rounded-xl bg-red-500/10 items-center justify-center active:bg-red-500/20 disabled:opacity-50"
          >
            <Ionicons name="trash-outline" size={14} color={danger} />
          </TouchableOpacity>
        </View>
      </View>

      <StockStepper
        baseUnit={baseUnit}
        conversionRatio={unitRelation.conversionRatio}
        isUpdating={showStepLoading}
        onStepAdjust={onStepAdjust}
      />
    </View>
  );
}

function propsAreEqual(prev: IngredientCardProps, next: IngredientCardProps) {
  return (
    prev.ingredient._id === next.ingredient._id &&
    prev.ingredient.currentStock === next.ingredient.currentStock &&
    prev.ingredient.minThreshold === next.ingredient.minThreshold &&
    prev.ingredient.purchasePrice === next.ingredient.purchasePrice &&
    prev.ingredient.image === next.ingredient.image &&
    prev.isUpdating === next.isUpdating
  );
}

export default React.memo(IngredientCard, propsAreEqual);
