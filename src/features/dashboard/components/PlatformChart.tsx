import React from 'react';
import { View, Text } from 'react-native';
import Card from '../../../components/Card';
import { useThemeColors } from '../../../hooks/useThemeColors';
import { formatInr } from '../dashboardUtils';
import { PlatformRow } from '../analyticsApi';

interface PlatformChartProps {
  comparison: PlatformRow[];
}

const PLATFORM_COLORS: Record<string, string> = {
  Manual: '#FF6B00',
  Zomato: '#E23744',
  Swiggy: '#FC8019',
  Magicpin: '#8B5CF6',
};

export default function PlatformChart({ comparison }: PlatformChartProps) {
  const { muted } = useThemeColors();
  const maxGross = Math.max(...comparison.map((row) => row.gross), 1);

  if (comparison.length === 0) {
    return (
      <Card className="p-4 mb-4">
        <Text className="text-xs font-black uppercase tracking-widest mb-2">Sales by channel</Text>
        <Text className="text-xs text-muted dark:text-muted-dark py-4 text-center">No channel data for this day.</Text>
      </Card>
    );
  }

  return (
    <Card className="p-4 mb-4">
      <Text className="text-xs font-black text-text dark:text-text-dark uppercase tracking-widest mb-4">
        Sales by channel
      </Text>
      <View style={{ gap: 12 }}>
        {comparison.map((row) => {
          const widthPct = Math.max(4, (row.gross / maxGross) * 100);
          const color = PLATFORM_COLORS[row.platform] ?? muted;
          return (
            <View key={row.platform}>
              <View className="flex-row justify-between mb-1">
                <Text className="text-xs font-bold text-text dark:text-text-dark">{row.platform}</Text>
                <Text className="text-xs font-black text-primary">{formatInr(row.gross)}</Text>
              </View>
              <View className="h-2 rounded-full bg-border/30 dark:bg-border-dark/30 overflow-hidden">
                <View style={{ width: `${widthPct}%`, backgroundColor: color, height: '100%', borderRadius: 999 }} />
              </View>
              <Text className="text-[10px] text-muted dark:text-muted-dark mt-1">
                {row.orderCount} orders · profit {formatInr(row.profit)}
              </Text>
            </View>
          );
        })}
      </View>
    </Card>
  );
}
