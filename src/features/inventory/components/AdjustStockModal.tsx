import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  Modal, 
  TouchableOpacity, 
  KeyboardAvoidingView, 
  Platform,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Input from '../../../components/Input';
import Button from '../../../components/Button';
import { useUpdateIngredientMutation, IngredientData } from '../inventoryApi';
import { useThemeColors } from '../../../hooks/useThemeColors';
import { useAppDispatch } from '../../../store/store';
import { showToast } from '../../../store/toastSlice';

interface AdjustStockModalProps {
  visible: boolean;
  onClose: () => void;
  ingredient: IngredientData | null;
}

export default function AdjustStockModal({ visible, onClose, ingredient }: AdjustStockModalProps) {
  const { muted, primary, danger, success } = useThemeColors();
  const dispatch = useAppDispatch();
  const [updateIngredient, { isLoading: isUpdating }] = useUpdateIngredientMutation();

  // Input state
  const [adjustmentValue, setAdjustmentValue] = useState('');
  const [formError, setFormError] = useState('');

  useEffect(() => {
    setAdjustmentValue('');
    setFormError('');
  }, [visible, ingredient]);

  if (!ingredient) return null;

  const unitRelation = ingredient.unitRelation || { baseUnit: 'g', conversionRatio: 1000, purchaseUnit: 'kg' };
  const ratio = unitRelation.conversionRatio;
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

  const getUnitName = () => {
    if (baseUnit === 'g') return 'kg';
    if (baseUnit === 'ml') return 'liters';
    return 'pcs';
  };

  const formattedStock = formatStock(ingredient.currentStock, baseUnit);
  const unitLabel = getUnitName();

  const handleAdjust = async (type: 'add' | 'deduct') => {
    if (!adjustmentValue) {
      setFormError('Please enter an adjustment value.');
      return;
    }

    const valueNum = Number(adjustmentValue);
    if (isNaN(valueNum) || valueNum <= 0) {
      setFormError('Please enter a valid positive number.');
      return;
    }

    setFormError('');

    // Calculate new stock in base units
    const baseAdjustment = valueNum * ratio;
    let newBaseQuantity = ingredient.currentStock;

    if (type === 'add') {
      newBaseQuantity += baseAdjustment;
    } else {
      newBaseQuantity = Math.max(0, newBaseQuantity - baseAdjustment);
    }

    try {
      const result = await updateIngredient({
        id: ingredient._id,
        body: {
          name: ingredient.name,
          minThreshold: ingredient.minThreshold,
          purchaseUnit: ingredient.unitRelation.purchaseUnit,
          baseUnit: ingredient.unitRelation.baseUnit,
          conversionRatio: ratio,
          currentStock: newBaseQuantity,
          image: ingredient.image || undefined
        }
      }).unwrap();

      if (result.success) {
        onClose();
        dispatch(showToast({
          message: `Successfully ${type === 'add' ? 'added' : 'deducted'} ${valueNum} ${unitLabel} for ${ingredient.name}.`,
          type: 'success',
          title: 'Stock Adjusted'
        }));
      }
    } catch (err: any) {
      setFormError(err.data?.error || 'Failed to adjust stock.');
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/60 justify-end">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          className="w-full"
        >
          <View className="bg-card dark:bg-card-dark rounded-t-[32px] border-t border-border dark:border-border-dark px-6 pt-6 pb-10 shadow-2xl">
            {/* Modal Drag Handle */}
            <View className="w-12 h-1.5 bg-border dark:bg-border-dark rounded-full mx-auto mb-6" />

            {/* Modal Header */}
            <View className="flex-row justify-between items-center mb-4">
              <View className="flex-1 mr-4">
                <Text className="text-xs font-bold text-primary uppercase tracking-widest">
                  Quick Adjust Stock
                </Text>
                <Text className="text-xl font-black text-text dark:text-text-dark leading-tight mt-0.5" numberOfLines={1}>
                  {ingredient.name}
                </Text>
              </View>
              <TouchableOpacity 
                onPress={onClose}
                className="w-8 h-8 rounded-full bg-border/20 items-center justify-center"
              >
                <Ionicons name="close" size={20} color={muted} />
              </TouchableOpacity>
            </View>

            {/* Current Stock Banner */}
            <View className="mb-5 bg-border/10 border border-border dark:border-border-dark p-4 rounded-2xl flex-row justify-between items-center">
              <Text className="text-xs font-bold text-muted dark:text-muted-dark uppercase tracking-wider">
                Current Stock Level:
              </Text>
              <Text className="text-lg font-black text-text dark:text-text-dark">
                {formattedStock}
              </Text>
            </View>

            {formError ? (
              <View className="mb-4 bg-red-500/10 border border-red-500/20 p-3 rounded-xl">
                <Text className="text-red-500 text-xs font-bold text-center">{formError}</Text>
              </View>
            ) : null}

            {/* Input Value */}
            <Input
              label={`Adjustment Amount (${unitLabel})`}
              placeholder={`e.g. 15`}
              value={adjustmentValue}
              onChangeText={setAdjustmentValue}
              keyboardType="numeric"
            />

            {/* Action Buttons Row */}
            <View className="flex-row mt-4" style={{ gap: 12 }}>
              {/* Deduct Button */}
              <TouchableOpacity
                onPress={() => handleAdjust('deduct')}
                disabled={isUpdating}
                activeOpacity={0.8}
                className="flex-1 py-4 rounded-2xl bg-red-500 items-center justify-center flex-row shadow-md active:bg-red-600"
              >
                <Ionicons name="remove-circle-outline" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text className="text-sm font-black text-white uppercase tracking-wider">
                  Deduct
                </Text>
              </TouchableOpacity>

              {/* Add Button */}
              <TouchableOpacity
                onPress={() => handleAdjust('add')}
                disabled={isUpdating}
                activeOpacity={0.8}
                className="flex-1 py-4 rounded-2xl bg-emerald-500 items-center justify-center flex-row shadow-md active:bg-emerald-600"
              >
                <Ionicons name="add-circle-outline" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text className="text-sm font-black text-white uppercase tracking-wider">
                  Add Stock
                </Text>
              </TouchableOpacity>
            </View>

          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}
