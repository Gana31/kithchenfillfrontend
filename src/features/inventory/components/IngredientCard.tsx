import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, ActivityIndicator, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '../../../hooks/useThemeColors';
import { IngredientData } from '../inventoryApi';
import {
  getCategoryDetails,
  formatStock,
  formatPurchasePrice,
  getPurchaseUnitLabel,
  parseStepAmount,
  getStockLevelTheme,
  getStockLevelBorderStyle,
} from '../inventoryUtils';

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
  const { primary, danger, success, muted, text, isDark } = useThemeColors();
  const {
    name,
    currentStock,
    unitRelation = { baseUnit: 'g', conversionRatio: 1000, purchaseUnit: 'kg' },
    image,
  } = ingredient;

  const [stepInput, setStepInput] = useState('1');

  const { type, icon, bgClass, textClass } = getCategoryDetails(ingredient.category, name);
  const stockTheme = getStockLevelTheme(ingredient.stockLevel, isDark);
  const stockBorder = getStockLevelBorderStyle(ingredient.stockLevel, isDark, 4);
  const baseUnit = unitRelation.baseUnit;
  const unitLabel = getPurchaseUnitLabel(baseUnit);

  const formattedStock = formatStock(currentStock, baseUnit);
  const formattedPrice = formatPurchasePrice(ingredient);

  const handleStepAdjust = (type: 'add' | 'deduct') => {
    const amount = parseStepAmount(stepInput, baseUnit, unitRelation.conversionRatio);
    onStepAdjust(type, amount);
  };

  return (
    <View
      className="overflow-hidden shadow-sm p-3 rounded-3xl border border-border/30 dark:border-border-dark/30 bg-card dark:bg-card-dark w-full"
      style={stockBorder ?? undefined}
    >
      {/* Top row: Left (image + name + category) | Middle (stock + price) | Right (edit + delete) */}
      <View className="flex-row items-center mb-3">
        {/* Left */}
        <View className="flex-row items-center flex-1 mr-2">
          {image ? (
            <Image
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

        {/* Middle */}
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

          {formattedPrice ? (
            <Text className="text-[10px] font-black text-primary mt-1.5 text-center">
              {formattedPrice}
            </Text>
          ) : null}
        </View>

        {/* Right */}
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

      {/* Bottom: +/- with editable step amount in the middle */}
      <View className="flex-row items-center bg-border/5 dark:bg-border-dark/5 border border-border/50 dark:border-border-dark/50 rounded-xl p-1">
        <TouchableOpacity
          onPress={() => handleStepAdjust('deduct')}
          disabled={isUpdating}
          activeOpacity={0.6}
          className="w-9 h-9 rounded-lg bg-red-500/10 justify-center items-center active:bg-red-500/20 disabled:opacity-50"
        >
          {isUpdating ? (
            <ActivityIndicator size="small" color={danger} />
          ) : (
            <Ionicons name="remove-outline" size={18} color={danger} />
          )}
        </TouchableOpacity>

        <View className="flex-1 flex-row items-center justify-center px-2" style={{ gap: 4 }}>
          <TextInput
            value={stepInput}
            onChangeText={setStepInput}
            keyboardType="decimal-pad"
            editable={!isUpdating}
            selectTextOnFocus
            style={{
              minWidth: 36,
              maxWidth: 56,
              height: 32,
              textAlign: 'center',
              fontSize: 14,
              fontWeight: '900',
              color: text,
              backgroundColor: 'transparent',
              padding: 0,
              margin: 0,
            }}
          />
          <Text className="text-xs font-bold text-muted dark:text-muted-dark">{unitLabel}</Text>
        </View>

        <TouchableOpacity
          onPress={() => handleStepAdjust('add')}
          disabled={isUpdating}
          activeOpacity={0.6}
          className="w-9 h-9 rounded-lg bg-emerald-500/10 justify-center items-center active:bg-emerald-500/20 disabled:opacity-50"
        >
          {isUpdating ? (
            <ActivityIndicator size="small" color={success} />
          ) : (
            <Ionicons name="add-outline" size={18} color={success} />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default React.memo(IngredientCard);
