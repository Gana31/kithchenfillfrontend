import React, { useRef, useState } from 'react';
import { View, Text, Image, TouchableOpacity, Pressable, ActivityIndicator, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '../../../hooks/useThemeColors';
import { IngredientData } from '../inventoryApi';
import {
  getCategoryDetails,
  formatStockCompact,
  formatPurchasePrice,
  getQuickStepAmount,
  getGridImageSize,
  getPurchaseUnitLabel,
  parseStepAmount,
  getStockLevelTheme,
} from '../inventoryUtils';

interface IngredientGridCardProps {
  ingredient: IngredientData;
  cardWidth: number;
  isUpdating?: boolean;
  selectionMode?: boolean;
  isSelected?: boolean;
  onEdit: (ingredient: IngredientData) => void;
  onLongPress: (id: string) => void;
  onToggleSelect: (id: string) => void;
  onStepAdjust: (ingredient: IngredientData, type: 'add' | 'deduct', baseAmount: number) => void;
}

const LONG_PRESS_DELAY = 300;
const SUPPRESS_PRESS_MS = 700;
const SCROLL_PRESS_DELAY = 120;

export default React.memo(function IngredientGridCard({
  ingredient,
  cardWidth,
  isUpdating = false,
  selectionMode = false,
  isSelected = false,
  onEdit,
  onLongPress,
  onToggleSelect,
  onStepAdjust,
}: IngredientGridCardProps) {
  const { danger, success, primary, text, isDark } = useThemeColors();
  const { name, currentStock, unitRelation = { baseUnit: 'g', conversionRatio: 1000, purchaseUnit: 'kg' }, image } = ingredient;
  const baseUnit = unitRelation.baseUnit;
  const [stepInput, setStepInput] = useState('1');
  const imageSize = cardWidth - 2;
  const contentWidth = cardWidth - 14;
  const suppressPressUntil = useRef(0);
  const ignoreNextPress = useRef(false);

  const { icon } = getCategoryDetails(ingredient.category, name);
  const stockTheme = getStockLevelTheme(ingredient.stockLevel, isDark);
  const formattedStock = formatStockCompact(currentStock, baseUnit);
  const formattedPrice = formatPurchasePrice(ingredient);
  const unitLabel = getPurchaseUnitLabel(baseUnit);

  const handleStepAdjust = (type: 'add' | 'deduct') => {
    const amount = parseStepAmount(stepInput, baseUnit, unitRelation.conversionRatio) || getQuickStepAmount(baseUnit, unitRelation.conversionRatio);
    onStepAdjust(ingredient, type, amount);
  };

  const handleLongPress = () => {
    suppressPressUntil.current = Date.now() + SUPPRESS_PRESS_MS;
    ignoreNextPress.current = true;
    onLongPress(ingredient._id);
  };

  const handleCardPress = () => {
    if (ignoreNextPress.current) {
      ignoreNextPress.current = false;
      return;
    }
    if (Date.now() < suppressPressUntil.current) {
      return;
    }

    if (selectionMode) {
      onToggleSelect(ingredient._id);
    } else {
      onEdit(ingredient);
    }
  };

  const cardShellStyle = {
    width: cardWidth,
    borderRadius: 10,
    overflow: 'hidden' as const,
    alignSelf: 'flex-start' as const,
    borderWidth: isSelected ? 2 : 1,
    borderColor: isSelected ? primary : undefined,
    backgroundColor: isSelected ? `${primary}18` : undefined,
  };

  const imageFrameStyle = stockTheme && !isSelected
    ? { borderWidth: 2.5, borderColor: stockTheme.accentColor }
    : undefined;

  const imageBlock = (
    <View
      style={{
        width: imageSize,
        height: imageSize,
        borderRadius: 8,
        overflow: 'hidden',
        marginBottom: 6,
        alignSelf: 'center',
        ...imageFrameStyle,
      }}
    >
      {image ? (
        <Image source={{ uri: image }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
      ) : (
        <View style={{ width: '100%', height: '100%' }} className="bg-primary/10 items-center justify-center">
          <Text className="text-2xl">{icon}</Text>
        </View>
      )}
      {stockTheme && !isSelected ? (
        <View
          style={{
            position: 'absolute',
            top: 5,
            right: 5,
            width: 9,
            height: 9,
            borderRadius: 5,
            backgroundColor: stockTheme.accentColor,
            borderWidth: 1.5,
            borderColor: isDark ? '#161618' : '#FFFFFF',
          }}
        />
      ) : null}
    </View>
  );

  const nameBlock = (
    <View style={{ width: contentWidth, paddingHorizontal: 6, alignItems: 'center' }}>
      <Text className="text-[11px] font-black text-text dark:text-text-dark text-center" numberOfLines={2}>
        {name}
      </Text>
      <Text
        className={`text-[9px] font-black text-center mt-0.5 ${stockTheme?.badgeTextClass ?? 'text-muted dark:text-muted-dark'}`}
        numberOfLines={1}
      >
        {formattedStock}
      </Text>
    </View>
  );

  const stepperBlock = !selectionMode ? (
    <View className="mt-2 pb-2" style={{ width: cardWidth }}>
      <View className="mx-0 flex-row items-center bg-border/5 dark:bg-border-dark/5 border border-border/50 dark:border-border-dark/50 rounded-none px-1 py-1">
        <Pressable
          onPress={() => handleStepAdjust('deduct')}
          disabled={isUpdating}
          style={{ width: 30, height: 30 }}
          className="rounded-lg bg-red-500/10 border border-red-500/20 justify-center items-center active:bg-red-500/20 disabled:opacity-50"
        >
          {isUpdating ? (
            <ActivityIndicator size="small" color={danger} />
          ) : (
            <Ionicons name="remove-outline" size={18} color={danger} />
          )}
        </Pressable>

        <View className="flex-1 flex-row items-center justify-center px-1" style={{ gap: 3 }}>
          <TextInput
            value={stepInput}
            onChangeText={setStepInput}
            keyboardType="decimal-pad"
            editable={!isUpdating}
            selectTextOnFocus
            style={{
              minWidth: 22,
              maxWidth: 34,
              height: 28,
              textAlign: 'center',
              fontSize: 11,
              fontWeight: '900',
              color: text,
              padding: 0,
              margin: 0,
            }}
          />
          <Text className="text-[8px] font-bold text-muted dark:text-muted-dark">{unitLabel}</Text>
        </View>

        <Pressable
          onPress={() => handleStepAdjust('add')}
          disabled={isUpdating}
          style={{ width: 30, height: 30 }}
          className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 justify-center items-center active:bg-emerald-500/20 disabled:opacity-50"
        >
          {isUpdating ? (
            <ActivityIndicator size="small" color={success} />
          ) : (
            <Ionicons name="add-outline" size={18} color={success} />
          )}
        </Pressable>
      </View>

      {formattedPrice ? (
        <Text className="text-[9px] font-black text-primary text-center mt-1.5" numberOfLines={1}>
          {formattedPrice}
        </Text>
      ) : null}

    </View>
  ) : null;

  const selectionBadge = selectionMode ? (
    <View className="absolute top-2 right-2 z-10">
      {isSelected ? (
        <View className="w-6 h-6 rounded-lg bg-primary items-center justify-center">
          <Ionicons name="checkmark" size={12} color="#FFFFFF" />
        </View>
      ) : (
        <View className="w-6 h-6 rounded-lg border-2 border-border dark:border-border-dark bg-card/80" />
      )}
    </View>
  ) : null;

  return (
    <View style={{ width: cardWidth, alignSelf: 'flex-start' }}>
      <View
        style={cardShellStyle}
        className={isSelected ? '' : 'bg-card dark:bg-card-dark border-border/30 dark:border-border-dark/30'}
      >
        {selectionBadge}
        <TouchableOpacity
          onPress={handleCardPress}
          onLongPress={selectionMode ? undefined : handleLongPress}
          delayLongPress={LONG_PRESS_DELAY}
          delayPressIn={SCROLL_PRESS_DELAY}
          activeOpacity={0.85}
          disabled={isUpdating}
          style={{ alignItems: 'center', paddingTop: 4, paddingBottom: selectionMode ? 4 : 0 }}
        >
          {imageBlock}
          {nameBlock}
        </TouchableOpacity>

        {stepperBlock}
      </View>
    </View>
  );
});
