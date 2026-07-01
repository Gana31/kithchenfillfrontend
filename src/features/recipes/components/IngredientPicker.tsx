import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  Modal,
  FlatList,
  Pressable,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import { TouchableOpacity as GestureTouchableOpacity } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { IngredientData } from '../../inventory/inventoryApi';
import { formatPurchasePriceDisplay } from '../../inventory/inventoryUtils';
import { useThemeColors } from '../../../hooks/useThemeColors';
import { SCROLL_PRESS_DELAY_MS } from '../../../components/scrollUtils';
import { getIngredientUnitDisplay } from '../recipeCostingUtils';

interface IngredientPickerProps {
  ingredients: IngredientData[];
  selectedId: string;
  onSelect: (ingredientId: string) => void;
  excludeIds?: string[];
  placeholder?: string;
}

export default function IngredientPicker({
  ingredients,
  selectedId,
  onSelect,
  excludeIds = [],
  placeholder = 'Pick ingredient',
}: IngredientPickerProps) {
  const { primary, muted, text, card, background, border } = useThemeColors();
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const selected = ingredients.find((item) => item._id === selectedId);
  const selectedUnit = selected ? getIngredientUnitDisplay(selected) : null;
  const selectedPrice = selected ? formatPurchasePriceDisplay(selected) : null;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return ingredients.filter((item) => {
      if (excludeIds.includes(item._id) && item._id !== selectedId) return false;
      if (!q) return true;
      return item.name.toLowerCase().includes(q);
    });
  }, [ingredients, search, excludeIds, selectedId]);

  const sheetMaxHeight = Math.round(windowHeight * 0.78);

  const openPicker = () => {
    setSearch('');
    setOpen(true);
  };

  const handleSelect = (id: string) => {
    onSelect(id);
    setOpen(false);
    setSearch('');
  };

  return (
    <View style={styles.wrapper}>
      <GestureTouchableOpacity
        onPress={openPicker}
        activeOpacity={0.85}
        delayPressIn={SCROLL_PRESS_DELAY_MS}
        style={[styles.trigger, { borderColor: border, backgroundColor: card }]}
      >
        <View style={styles.triggerMain}>
          <Text
            numberOfLines={1}
            style={[styles.triggerText, { color: selected ? text : muted }]}
          >
            {selected?.name ?? placeholder}
          </Text>
          {selected && selectedPrice ? (
            <Text
              numberOfLines={1}
              style={[
                styles.triggerPrice,
                { color: selectedPrice.hasPrice ? primary : muted },
              ]}
            >
              {selectedPrice.text}
            </Text>
          ) : null}
        </View>
        {selectedUnit ? (
          <View style={[styles.unitChip, { borderColor: `${primary}40` }]}>
            <Text style={[styles.unitChipText, { color: primary }]}>{selectedUnit.purchaseLabel}</Text>
          </View>
        ) : null}
        <Ionicons name="chevron-down" size={16} color={muted} />
      </GestureTouchableOpacity>

      <Modal
        visible={open}
        transparent
        animationType="slide"
        statusBarTranslucent
        onRequestClose={() => setOpen(false)}
      >
        <View style={styles.overlay}>
          <Pressable style={styles.backdrop} onPress={() => setOpen(false)} />

          <View
            style={[
              styles.sheet,
              {
                maxHeight: sheetMaxHeight,
                paddingBottom: Math.max(insets.bottom, 16),
                backgroundColor: background,
              },
            ]}
          >
            <View style={[styles.sheetHeader, { borderBottomColor: border }]}>
              <Text style={[styles.sheetTitle, { color: text }]}>Pick ingredient</Text>
              <TouchableOpacity onPress={() => setOpen(false)} hitSlop={10}>
                <Ionicons name="close" size={22} color={muted} />
              </TouchableOpacity>
            </View>

            <View style={[styles.searchRow, { borderColor: border, backgroundColor: card }]}>
              <Ionicons name="search" size={16} color={muted} />
              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder="Search..."
                placeholderTextColor={muted}
                style={[styles.searchInput, { color: text }]}
              />
              {search ? (
                <TouchableOpacity onPress={() => setSearch('')}>
                  <Ionicons name="close-circle" size={16} color={muted} />
                </TouchableOpacity>
              ) : null}
            </View>

            <FlatList
              data={filtered}
              keyExtractor={(item) => item._id}
              keyboardShouldPersistTaps="handled"
              style={styles.list}
              contentContainerStyle={styles.listContent}
              ListEmptyComponent={
                <Text style={[styles.emptyText, { color: muted }]}>
                  {ingredients.length === 0 ? 'No items in inventory.' : 'No matches.'}
                </Text>
              }
              renderItem={({ item }) => {
                const isSelected = item._id === selectedId;
                const unit = getIngredientUnitDisplay(item);
                const priceDisplay = formatPurchasePriceDisplay(item);

                return (
                  <TouchableOpacity
                    onPress={() => handleSelect(item._id)}
                    activeOpacity={0.75}
                    style={[
                      styles.listItem,
                      {
                        borderColor: isSelected ? primary : border,
                        backgroundColor: isSelected ? `${primary}12` : card,
                      },
                    ]}
                  >
                    <View style={styles.listItemMain}>
                      <Text numberOfLines={1} style={[styles.listItemName, { color: text }]}>
                        {item.name}
                      </Text>
                      <Text
                        numberOfLines={2}
                        style={[
                          styles.listItemMeta,
                          { color: priceDisplay.hasPrice ? primary : muted },
                        ]}
                      >
                        {priceDisplay.hasPrice
                          ? priceDisplay.text
                          : 'Set price in inventory'}
                      </Text>
                    </View>
                    <View style={[styles.unitChip, { borderColor: `${primary}40` }]}>
                      <Text style={[styles.unitChipText, { color: primary }]}>{unit.purchaseLabel}</Text>
                    </View>
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
  },
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    minHeight: 52,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    gap: 6,
  },
  triggerMain: {
    flex: 1,
    minWidth: 0,
  },
  triggerText: {
    fontSize: 14,
    fontWeight: '700',
  },
  triggerPrice: {
    fontSize: 12,
    fontWeight: '800',
    marginTop: 2,
  },
  unitChip: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  unitChipText: {
    fontSize: 11,
    fontWeight: '800',
  },
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
    minHeight: 280,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  sheetTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 12,
    marginVertical: 10,
    paddingHorizontal: 12,
    height: 42,
    borderRadius: 10,
    borderWidth: 1,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    paddingVertical: 0,
  },
  list: {
    flexGrow: 0,
    flexShrink: 1,
  },
  listContent: {
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  emptyText: {
    textAlign: 'center',
    paddingVertical: 32,
    fontSize: 14,
    fontWeight: '600',
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 8,
    gap: 10,
  },
  listItemMain: {
    flex: 1,
    minWidth: 0,
  },
  listItemName: {
    fontSize: 14,
    fontWeight: '800',
  },
  listItemMeta: {
    fontSize: 13,
    fontWeight: '800',
    marginTop: 3,
  },
});
