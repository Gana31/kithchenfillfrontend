import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '../../../hooks/useThemeColors';
import { formatDisplayDate, formatDateKey, shiftDateKey } from '../dashboardUtils';

interface DateSelectorProps {
  selectedDate: string;
  onChange: (dateKey: string) => void;
}

export default function DateSelector({ selectedDate, onChange }: DateSelectorProps) {
  const { primary, muted } = useThemeColors();
  const today = formatDateKey(new Date());
  const isToday = selectedDate === today;

  return (
    <View className="flex-row items-center justify-between mb-4">
      <TouchableOpacity
        onPress={() => onChange(shiftDateKey(selectedDate, -1))}
        className="w-10 h-10 rounded-xl bg-card dark:bg-card-dark border border-border dark:border-border-dark items-center justify-center"
      >
        <Ionicons name="chevron-back" size={18} color={primary} />
      </TouchableOpacity>

      <View className="items-center flex-1 mx-3">
        <Text className="text-xs font-bold text-muted dark:text-muted-dark uppercase tracking-widest">
          {isToday ? 'Today' : 'Selected day'}
        </Text>
        <Text className="text-sm font-black text-text dark:text-text-dark mt-0.5">
          {formatDisplayDate(selectedDate)}
        </Text>
        {!isToday ? (
          <TouchableOpacity onPress={() => onChange(today)} className="mt-1">
            <Text className="text-[10px] font-black text-primary uppercase">Jump to today</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      <TouchableOpacity
        onPress={() => !isToday && onChange(shiftDateKey(selectedDate, 1))}
        disabled={isToday}
        className={`w-10 h-10 rounded-xl border items-center justify-center ${
          isToday ? 'opacity-30 bg-border/20' : 'bg-card dark:bg-card-dark border-border dark:border-border-dark'
        }`}
      >
        <Ionicons name="chevron-forward" size={18} color={isToday ? muted : primary} />
      </TouchableOpacity>
    </View>
  );
}
