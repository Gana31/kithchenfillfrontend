import React from 'react';
import { View, Text } from 'react-native';
import Card from '../../../components/Card';
import { formatInr } from '../dashboardUtils';
import { DailySummary } from '../analyticsApi';

interface KpiGridProps {
  summary?: DailySummary;
  isLoading?: boolean;
}

function KpiCard({
  label,
  value,
  accent,
  sub,
}: {
  label: string;
  value: string;
  accent?: string;
  sub?: string;
}) {
  return (
    <Card className="p-4 flex-1">
      <Text className="text-[10px] text-muted dark:text-muted-dark font-bold tracking-normalr">
        {label}
      </Text>
      <Text className={`text-xl font-semibold mt-1 ${accent ?? 'text-text dark:text-text-dark'}`}>
        {value}
      </Text>
      {sub ? (
        <Text className="text-[10px] text-muted dark:text-muted-dark font-medium mt-1">{sub}</Text>
      ) : null}
    </Card>
  );
}

export default function KpiGrid({ summary, isLoading }: KpiGridProps) {
  if (isLoading || !summary) {
    return (
      <View className="flex-row flex-wrap" style={{ gap: 12 }}>
        {[1, 2, 3, 4].map((key) => (
          <View key={key} style={{ width: '47%' }}>
            <Card className="p-4 h-24 justify-center">
              <Text className="text-xs text-muted dark:text-muted-dark">Loading...</Text>
            </Card>
          </View>
        ))}
      </View>
    );
  }

  return (
    <View style={{ gap: 12 }}>
      <View className="flex-row" style={{ gap: 12 }}>
        <KpiCard label="Gross sales" value={formatInr(summary.grossRevenue)} />
        <KpiCard label="Making cost" value={formatInr(summary.makingCost)} accent="text-red-500" />
      </View>
      <View className="flex-row" style={{ gap: 12 }}>
        <KpiCard
          label="Net profit"
          value={formatInr(summary.netProfit)}
          accent={summary.netProfit >= 0 ? 'text-emerald-500' : 'text-red-500'}
          sub={`${summary.orderCount} orders`}
        />
        <KpiCard
          label="Margin"
          value={`${summary.marginPercent}%`}
          accent="text-primary"
          sub={`${summary.lowStockCount} low stock`}
        />
      </View>
    </View>
  );
}
