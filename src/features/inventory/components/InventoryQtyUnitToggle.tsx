import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { RecipeQtyUnit } from '../ingredientFormUtils';

interface InventoryQtyUnitToggleProps {
  options: RecipeQtyUnit[];
  value: RecipeQtyUnit;
  onChange: (unit: RecipeQtyUnit) => void;
  primary: string;
  muted: string;
  border: string;
  card: string;
}

export default function InventoryQtyUnitToggle({
  options,
  value,
  onChange,
  primary,
  muted,
  border,
  card,
}: InventoryQtyUnitToggleProps) {
  if (options.length === 1) {
    return (
      <View style={[styles.single, { borderColor: `${primary}40`, backgroundColor: `${primary}12` }]}>
        <Text style={[styles.singleText, { color: primary }]}>{options[0]}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.row, { borderColor: border, backgroundColor: card }]}>
      {options.map((unit) => {
        const active = value === unit;
        return (
          <TouchableOpacity
            key={unit}
            onPress={() => onChange(unit)}
            activeOpacity={0.7}
            style={[styles.btn, active ? { backgroundColor: `${primary}18` } : null]}
          >
            <Text style={[styles.btnText, { color: active ? primary : muted }]}>{unit}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    width: '100%',
    alignSelf: 'stretch',
    borderRadius: 10,
    borderWidth: 1,
    overflow: 'hidden',
  },
  btn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: {
    fontSize: 13,
    fontWeight: '800',
  },
  single: {
    width: '100%',
    alignSelf: 'stretch',
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
  },
  singleText: {
    fontSize: 13,
    fontWeight: '800',
  },
});
