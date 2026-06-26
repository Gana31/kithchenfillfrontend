import React, { useRef, useState } from 'react';
import { View, Text, TextInput, Pressable, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '../../../hooks/useThemeColors';
import { parseStepAmount, getPurchaseUnitLabel } from '../inventoryUtils';

interface StockStepperProps {
  baseUnit: string;
  conversionRatio: number;
  isUpdating?: boolean;
  compact?: boolean;
  onStepAdjust: (type: 'add' | 'deduct', baseAmount: number) => void;
}

export default function StockStepper({ baseUnit, conversionRatio, isUpdating = false, onStepAdjust, compact = false }: StockStepperProps) {
  const { danger, success, text, muted } = useThemeColors();
  const [stepInput, setStepInput] = useState('1');
  const lastStepPressAt = useRef(0);

  const handleAdjust = (type: 'add' | 'deduct') => {
    const now = Date.now();
    if (now - lastStepPressAt.current < 50) return;
    lastStepPressAt.current = now;

    const amount = parseStepAmount(stepInput, baseUnit, conversionRatio);
    if (amount <= 0) return;
    onStepAdjust(type, amount);
  };

  const unitLabel = getPurchaseUnitLabel(baseUnit);
  const btnSize = compact ? 30 : 36;
  const inputMinWidth = compact ? 22 : 36;
  const inputMaxWidth = compact ? 34 : 56;
  const inputHeight = compact ? 28 : 32;
  const fontSize = compact ? 11 : 14;

  return (
    <View
      className={`flex-row items-center bg-border/5 dark:bg-border-dark/5 border border-border/50 dark:border-border-dark/50 ${
        compact ? 'rounded-none px-1 py-1 mx-0' : 'rounded-xl p-1'
      }`}
    >
      <Pressable
        onPress={() => handleAdjust('deduct')}
        style={{ width: btnSize, height: btnSize }}
        className={`rounded-lg bg-red-500/10 ${compact ? 'border border-red-500/20' : ''} justify-center items-center active:bg-red-500/20`}
      >
        {isUpdating ? (
          <ActivityIndicator size="small" color={danger} />
        ) : (
          <Ionicons name="remove-outline" size={compact ? 18 : 18} color={danger} />
        )}
      </Pressable>

      <View className={`flex-1 flex-row items-center justify-center ${compact ? 'px-1' : 'px-2'}`} style={{ gap: compact ? 3 : 4 }}>
        <TextInput
          value={stepInput}
          onChangeText={setStepInput}
          keyboardType="decimal-pad"
          editable={!isUpdating}
          selectTextOnFocus
          style={{
            minWidth: inputMinWidth,
            maxWidth: inputMaxWidth,
            height: inputHeight,
            textAlign: 'center',
            fontSize,
            fontWeight: '900',
            color: text,
            padding: 0,
            margin: 0,
          }}
        />
        <Text className={`font-bold text-muted dark:text-muted-dark ${compact ? 'text-[8px]' : 'text-xs'}`}>{unitLabel}</Text>
      </View>

      <Pressable
        onPress={() => handleAdjust('add')}
        style={{ width: btnSize, height: btnSize }}
        className={`rounded-lg bg-emerald-500/10 ${compact ? 'border border-emerald-500/20' : ''} justify-center items-center active:bg-emerald-500/20`}
      >
        {isUpdating ? (
          <ActivityIndicator size="small" color={success} />
        ) : (
          <Ionicons name="add-outline" size={18} color={success} />
        )}
      </Pressable>
    </View>
  );
}
