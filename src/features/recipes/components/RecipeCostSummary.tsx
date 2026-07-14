import React from 'react';
import { View, Text } from 'react-native';
import { formatInr } from '../../dashboard/dashboardUtils';
import { RecipeCostPreview } from '../recipeCostingUtils';
import { CustomCostLine } from '../recipesApi';

interface RecipeCostSummaryProps {
  preview: RecipeCostPreview;
  customCostLines: CustomCostLine[];
  extraWastagePercent: number;
  yieldAmount?: number;
  yieldUnit?: string;
}

export default function RecipeCostSummary({
  preview,
  customCostLines,
  extraWastagePercent,
  yieldAmount,
  yieldUnit,
}: RecipeCostSummaryProps) {
  return (
    <View className="rounded-2xl bg-primary/10 border border-primary/25 p-4 mb-4">
      <Text className="text-xs font-semibold text-primary tracking-normal mb-3">
        Recipe cost preview
      </Text>

      {preview.lines.length > 0 ? (
        <View className="mb-3" style={{ gap: 4 }}>
          {preview.lines.map((line) => (
            <View key={line.ingredientId} className="flex-row justify-between">
              <Text className="text-xs font-bold text-text dark:text-text-dark flex-1 pr-2" numberOfLines={1}>
                {line.name}
              </Text>
              <Text className="text-xs font-semibold text-text dark:text-text-dark">{formatInr(line.lineCost)}</Text>
            </View>
          ))}
        </View>
      ) : (
        <Text className="text-xs text-muted dark:text-muted-dark mb-3">Add ingredients to see line costs.</Text>
      )}

      <View style={{ gap: 6 }}>
        <Row label="Ingredients" value={formatInr(preview.ingredientSubtotal)} />
        {customCostLines.map(
          (row, index) =>
            row.label.trim() && Number(row.amount) > 0 ? (
              <Row key={`${row.label}-${index}`} label={row.label} value={formatInr(Number(row.amount))} />
            ) : null
        )}
        {extraWastagePercent > 0 ? (
          <Row
            label={`Extra waste (${extraWastagePercent}% on all items)`}
            value={formatInr(preview.extraWastageCost)}
          />
        ) : null}
        <View className="border-t border-primary/20 pt-2 mt-1">
          <Row label="Total recipe cost" value={formatInr(preview.batchCost)} bold />
        </View>
        {yieldAmount && yieldAmount > 0 && yieldUnit ? (
          <View className="mt-2 border-t border-primary/10 pt-2" style={{ gap: 6 }}>
            <Row
              label={`Cost per batch (${yieldAmount} ${yieldUnit})`}
              value={formatInr(preview.batchCost)}
            />
            {yieldAmount !== 1 && (
              <Row
                label={`Cost per 1 ${yieldUnit}`}
                value={formatInr(preview.batchCost / yieldAmount)}
              />
            )}
          </View>
        ) : null}
      </View>
    </View>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <View className="flex-row justify-between items-center">
      <Text className={`text-xs ${bold ? 'font-semibold text-text dark:text-text-dark' : 'font-bold text-muted dark:text-muted-dark'}`}>
        {label}
      </Text>
      <Text className={`text-xs ${bold ? 'font-semibold text-primary text-base' : 'font-semibold text-text dark:text-text-dark'}`}>
        {value}
      </Text>
    </View>
  );
}
