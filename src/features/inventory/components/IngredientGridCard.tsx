import React, { useRef } from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '../../../hooks/useThemeColors';
import { IngredientData } from '../inventoryApi';
import {
  getCategoryDetails,
  formatStockCompact,
  formatPurchasePriceDisplay,
  getStockLevelTheme,
  GRID_NAME_BLOCK_HEIGHT,
} from '../inventoryUtils';
import StockStepper from './StockStepper';

interface IngredientGridCardProps {
  ingredient: IngredientData;
  cardWidth: number;
  cardHeight: number;
  isUpdating?: boolean;
  selectionMode?: boolean;
  isSelected?: boolean;
  onEdit: (ingredient: IngredientData) => void;
  onLongPress: (id: string) => void;
  onToggleSelect: (id: string) => void;
  onStepAdjust: (ingredientId: string, type: 'add' | 'deduct', baseAmount: number) => void;
}

const LONG_PRESS_DELAY = 300;
const SUPPRESS_PRESS_MS = 700;
const SCROLL_PRESS_DELAY = 120;

export default React.memo(function IngredientGridCard({
  ingredient,
  cardWidth,
  cardHeight,
  isUpdating = false,
  selectionMode = false,
  isSelected = false,
  onEdit,
  onLongPress,
  onToggleSelect,
  onStepAdjust,
}: IngredientGridCardProps) {
  const { primary, isDark } = useThemeColors();
  const { name, currentStock, unitRelation = { baseUnit: 'g', conversionRatio: 1000, purchaseUnit: 'kg' }, image } = ingredient;
  const baseUnit = unitRelation.baseUnit;
  const imageSize = cardWidth - 2;
  const contentWidth = cardWidth - 14;
  const suppressPressUntil = useRef(0);
  const ignoreNextPress = useRef(false);

  const { icon } = getCategoryDetails(ingredient.category, name);
  const stockTheme = getStockLevelTheme(ingredient.stockLevel, isDark);
  const formattedStock = formatStockCompact(currentStock, baseUnit);
  const priceDisplay = formatPurchasePriceDisplay(ingredient);
  const showStepLoading = isUpdating;

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
    height: cardHeight,
    borderRadius: 10,
    overflow: 'hidden' as const,
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
        <Image
          key={ingredient._id}
          source={{ uri: image }}
          style={{ width: '100%', height: '100%' }}
          resizeMode="cover"
        />
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
    <View
      style={{
        width: contentWidth,
        height: GRID_NAME_BLOCK_HEIGHT,
        paddingHorizontal: 6,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}
    >
      <Text
        className="text-[11px] font-semibold text-text dark:text-text-dark text-center"
        numberOfLines={2}
        ellipsizeMode="tail"
        style={{ lineHeight: 13, maxHeight: 26 }}
      >
        {name}
      </Text>
      <Text
        className={`text-[9px] font-semibold text-center mt-0.5 ${stockTheme?.badgeTextClass ?? 'text-muted dark:text-muted-dark'}`}
        numberOfLines={1}
        ellipsizeMode="tail"
        style={{ lineHeight: 11 }}
      >
        {formattedStock}
      </Text>
      <Text
        className={`text-[9px] font-semibold text-center mt-0.5 ${
          priceDisplay.hasPrice ? 'text-primary' : 'text-muted dark:text-muted-dark'
        }`}
        numberOfLines={1}
        ellipsizeMode="tail"
        style={{ lineHeight: 11 }}
      >
        {priceDisplay.text}
      </Text>
    </View>
  );

  const stepperBlock = !selectionMode ? (
    <View className="mt-1 pb-2" style={{ width: cardWidth }}>
      <StockStepper
        baseUnit={baseUnit}
        conversionRatio={unitRelation.conversionRatio}
        isUpdating={showStepLoading}
        compact
        onStepAdjust={(type, amount) => onStepAdjust(ingredient._id, type, amount)}
      />
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
    <View style={{ width: cardWidth, height: cardHeight }}>
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
