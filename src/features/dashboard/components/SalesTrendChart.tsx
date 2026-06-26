import React, { useMemo } from 'react';
import { View, Text } from 'react-native';
import Card from '../../../components/Card';
import { useThemeColors } from '../../../hooks/useThemeColors';
import { SalesTrendRow } from '../analyticsApi';

interface SalesTrendChartProps {
  trend: SalesTrendRow[];
  title?: string;
}

export default function SalesTrendChart({ trend, title = '7-day sales trend' }: SalesTrendChartProps) {
  const { primary, muted } = useThemeColors();

  const { maxValue, bars } = useMemo(() => {
    const max = Math.max(...trend.map((row) => row.gross), 1);
    return {
      maxValue: max,
      bars: trend.map((row) => ({
        ...row,
        heightPct: row.gross / max,
        label: row.date.slice(5),
      })),
    };
  }, [trend]);

  return (
    <Card className="p-4 mb-4">
      <Text className="text-xs font-black text-text dark:text-text-dark uppercase tracking-widest mb-1">
        {title}
      </Text>
      <Text className="text-[10px] text-muted dark:text-muted-dark mb-4">
        Gross sales per day (tap counter to add today&apos;s sales)
      </Text>

      {maxValue <= 0 || trend.every((row) => row.gross === 0) ? (
        <Text className="text-xs text-muted dark:text-muted-dark py-8 text-center">
          No sales in this period yet.
        </Text>
      ) : (
        <View className="flex-row items-end justify-between" style={{ height: 120, gap: 6 }}>
          {bars.map((bar) => (
            <View key={bar.date} className="flex-1 items-center">
              <View
                style={{
                  width: '100%',
                  height: Math.max(6, bar.heightPct * 100),
                  backgroundColor: primary,
                  borderRadius: 4,
                  opacity: 0.85,
                }}
              />
              <Text className="text-[8px] text-muted dark:text-muted-dark mt-1 font-bold">{bar.label}</Text>
            </View>
          ))}
        </View>
      )}
    </Card>
  );
}
