import React from 'react';
import { View, Text } from 'react-native';
import Card from '../../../components/Card';
import { formatInr } from '../dashboardUtils';
import { TopPlateRow } from '../analyticsApi';

interface TopPlatesListProps {
  plates: TopPlateRow[];
}

export default function TopPlatesList({ plates }: TopPlatesListProps) {
  return (
    <Card className="p-4 mb-4">
      <Text className="text-xs font-semibold text-text dark:text-text-dark tracking-normal mb-4">
        Top plates
      </Text>
      {plates.length === 0 ? (
        <Text className="text-xs text-muted dark:text-muted-dark py-2 text-center">
          No plates sold on this day.
        </Text>
      ) : (
        <View style={{ gap: 10 }}>
          {plates.map((plate, index) => (
            <View
              key={plate.name}
              className="flex-row items-center justify-between pb-2 border-b border-border/20 dark:border-border-dark/20"
            >
              <View className="flex-row items-center flex-1 mr-2">
                <Text className="text-xs font-semibold text-primary w-5">{index + 1}.</Text>
                <Text className="text-xs font-bold text-text dark:text-text-dark flex-1" numberOfLines={2}>
                  {plate.name}
                </Text>
              </View>
              <View className="items-end">
                <Text className="text-xs font-semibold text-text dark:text-text-dark">
                  {formatInr(plate.grossRevenue)}
                </Text>
                <Text className="text-[10px] text-muted dark:text-muted-dark">{plate.quantitySold} sold</Text>
              </View>
            </View>
          ))}
        </View>
      )}
    </Card>
  );
}
