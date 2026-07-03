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
    <Card className="p-4">
      <View style={{ minHeight: 62 }}>
        <Text
          className="text-[10px] text-muted dark:text-muted-dark font-bold tracking-normal"
          numberOfLines={1}
        >
          {label}
        </Text>
        <Text
          className={`text-lg font-semibold mt-1 ${accent ?? 'text-text dark:text-text-dark'}`}
          numberOfLines={1}
        >
          {value}
        </Text>
        {sub ? (
          <Text
            className="text-[10px] text-muted dark:text-muted-dark font-medium mt-1"
            numberOfLines={1}
          >
            {sub}
          </Text>
        ) : null}
      </View>
    </Card>
  );
}

const EMPTY_SUMMARY: DailySummary = {
  date: '',
  grossRevenue: 0,
  netRevenue: 0,
  makingCost: 0,
  netProfit: 0,
  marginPercent: 0,
  orderCount: 0,
  lowStockCount: 0,
};

// Explicit widths + margins (no flex `gap`) keep the 2x2 grid reliable on
// native Android, where `gap` + `flex-1` can collapse rows and overlap cards.
const ROW_STYLE = {
  flexDirection: 'row' as const,
  justifyContent: 'space-between' as const,
};
const CELL_STYLE = { width: '48%' as const };

export default function KpiGrid({ summary }: KpiGridProps) {
  // Always render the four cards; default to 0 so the layout never collapses on
  // days with no data. Values update once real data loads.
  const s = summary ?? EMPTY_SUMMARY;

  return (
    <View>
      <View style={[ROW_STYLE, { marginBottom: 12 }]}>
        <View style={CELL_STYLE}>
          <KpiCard label="Gross sales" value={formatInr(s.grossRevenue)} />
        </View>
        <View style={CELL_STYLE}>
          <KpiCard label="Making cost" value={formatInr(s.makingCost)} accent="text-red-500" />
        </View>
      </View>
      <View style={ROW_STYLE}>
        <View style={CELL_STYLE}>
          <KpiCard
            label="Net profit"
            value={formatInr(s.netProfit)}
            accent={s.netProfit >= 0 ? 'text-emerald-500' : 'text-red-500'}
            sub={`${s.orderCount} orders`}
          />
        </View>
        <View style={CELL_STYLE}>
          <KpiCard
            label="Margin"
            value={`${s.marginPercent}%`}
            accent="text-primary"
            sub={`${s.lowStockCount} low stock`}
          />
        </View>
      </View>
    </View>
  );
}
