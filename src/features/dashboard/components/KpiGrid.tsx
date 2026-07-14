import React from 'react';
import { View, Text } from 'react-native';
import Card from '../../../components/Card';
import { SCROLL_GAP_TOUCH } from '../../../components/scrollUtils';
import { ScrollGap } from '../../../components/SpacedStack';
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

const ROW_STYLE = {
  flexDirection: 'row' as const,
  alignItems: 'stretch' as const,
};

/** Touch-safe horizontal gap — Android ignores transparent space-between gutters. */
function RowGap() {
  return <View style={[{ width: 12 }, SCROLL_GAP_TOUCH]} collapsable={false} />;
}

export default function KpiGrid({ summary }: KpiGridProps) {
  const s = summary ?? EMPTY_SUMMARY;

  return (
    <View collapsable={false}>
      <View style={ROW_STYLE}>
        <View style={{ flex: 1 }}>
          <KpiCard label="Gross sales" value={formatInr(s.grossRevenue)} />
        </View>
        <RowGap />
        <View style={{ flex: 1 }}>
          <KpiCard label="Making cost" value={formatInr(s.makingCost)} accent="text-red-500" />
        </View>
      </View>
      <ScrollGap height={12} />
      <View style={ROW_STYLE}>
        <View style={{ flex: 1 }}>
          <KpiCard
            label="Net profit"
            value={formatInr(s.netProfit)}
            accent={s.netProfit >= 0 ? 'text-emerald-500' : 'text-red-500'}
            sub={`${s.orderCount} orders`}
          />
        </View>
        <RowGap />
        <View style={{ flex: 1 }}>
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
