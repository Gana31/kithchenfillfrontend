import React, { useMemo } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeColors } from '../../../hooks/useThemeColors';
import { IngredientData } from '../../inventory/inventoryApi';
import { formatInr } from '../../dashboard/dashboardUtils';
import { RecipeData } from '../recipesApi';
import RecipeCostSummary from './RecipeCostSummary';
import { computeRecipeCostPreview, formatRecipeLineQtyDisplay } from '../recipeCostingUtils';

interface RecipePreviewModalProps {
  visible: boolean;
  recipe: RecipeData | null;
  ingredients: IngredientData[];
  onClose: () => void;
  onEdit?: (recipeId: string) => void;
}

export default function RecipePreviewModal({
  visible,
  recipe,
  ingredients,
  onClose,
  onEdit,
}: RecipePreviewModalProps) {
  const insets = useSafeAreaInsets();
  const { primary, muted, text, card, border, background } = useThemeColors();

  const previewInput = useMemo(() => {
    if (!recipe) return null;
    return {
      ingredientsUsed: recipe.ingredientsUsed.map((row) => ({
        ingredientId: String(row.ingredientId),
        netAmount: row.netAmount,
        wastagePercent: row.wastagePercent ?? 0,
      })),
      customCostLines: recipe.customCostLines ?? [],
      extraWastagePercent: recipe.extraWastagePercent ?? 0,
      makingCharges: recipe.makingCharges ?? { fixedAmount: 0, percentOfIngredients: 0 },
    };
  }, [recipe]);

  const costPreview = useMemo(() => {
    if (!previewInput) return null;
    return computeRecipeCostPreview(ingredients, previewInput);
  }, [ingredients, previewInput]);

  const lineCostById = useMemo(
    () => new Map((costPreview?.lines ?? []).map((line) => [line.ingredientId, line.lineCost])),
    [costPreview?.lines]
  );

  if (!recipe) return null;

  const yieldLabel = `${recipe.batchYieldAmount}${recipe.batchYieldUnit}`;
  const customLines = recipe.customCostLines ?? [];
  const extraWastagePercent = recipe.extraWastagePercent ?? 0;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={[styles.sheet, { backgroundColor: background, paddingBottom: insets.bottom + 16 }]}>
          <View style={[styles.header, { borderBottomColor: border, paddingTop: insets.top + 8 }]}>
            <TouchableOpacity onPress={onClose} style={styles.iconBtn} hitSlop={10}>
              <Ionicons name="close" size={24} color={text} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: text }]} numberOfLines={1}>
              Recipe preview
            </Text>
            {onEdit ? (
              <TouchableOpacity onPress={() => onEdit(recipe._id)} style={styles.iconBtn} hitSlop={10}>
                <Ionicons name="create-outline" size={22} color={primary} />
              </TouchableOpacity>
            ) : (
              <View style={styles.iconBtn} />
            )}
          </View>

          <ScrollView
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <Text style={[styles.recipeName, { color: text }]}>{recipe.name}</Text>
            <View style={styles.metaRow}>
              <View style={styles.metaItem}>
                <Ionicons name="scale-outline" size={14} color={muted} />
                <Text style={[styles.metaText, { color: muted }]}>Yield: {yieldLabel}</Text>
              </View>
              {extraWastagePercent > 0 ? (
                <View style={styles.metaItem}>
                  <Ionicons name="alert-circle-outline" size={14} color={muted} />
                  <Text style={[styles.metaText, { color: muted }]}>Extra waste: {extraWastagePercent}%</Text>
                </View>
              ) : null}
            </View>

            {recipe.ingredientsUsed.length > 0 ? (
              <View style={{ gap: 10, marginBottom: 16 }}>
                <Text style={[styles.sectionLabel, { color: muted }]}>From stock</Text>
                {recipe.ingredientsUsed.map((row) => {
                  const ingredient = ingredients.find((item) => item._id === String(row.ingredientId));
                  const name = ingredient?.name ?? 'Unknown ingredient';
                  const qtyLabel = formatRecipeLineQtyDisplay(row.netAmount, ingredient);
                  const lineCost = lineCostById.get(String(row.ingredientId));

                  return (
                    <View
                      key={String(row.ingredientId)}
                      style={[styles.lineCard, { borderColor: border, backgroundColor: card }]}
                    >
                      <Text style={[styles.lineName, { color: text }]} numberOfLines={2}>
                        {name}
                      </Text>
                      <View style={styles.lineFooter}>
                        <Text style={[styles.qtyLabel, { color: muted }]}>{qtyLabel}</Text>
                        <Text style={[styles.lineCost, { color: primary }]}>
                          {lineCost !== undefined ? formatInr(lineCost) : '—'}
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            ) : null}

            {customLines.length > 0 ? (
              <View style={{ gap: 10, marginBottom: 16 }}>
                <Text style={[styles.sectionLabel, { color: muted }]}>Custom items</Text>
                {customLines.map((row, index) => (
                  <View
                    key={`${row.label}-${index}`}
                    style={[styles.lineCard, { borderColor: border, backgroundColor: card }]}
                  >
                    <Text style={[styles.lineName, { color: text }]} numberOfLines={2}>
                      {row.label}
                    </Text>
                    <View style={styles.lineFooter}>
                      <Text style={[styles.qtyLabel, { color: muted }]}>Fixed cost</Text>
                      <Text style={[styles.lineCost, { color: primary }]}>{formatInr(row.amount)}</Text>
                    </View>
                  </View>
                ))}
              </View>
            ) : null}

            {costPreview ? (
              <RecipeCostSummary
                preview={costPreview}
                customCostLines={customLines}
                extraWastagePercent={extraWastagePercent}
              />
            ) : (
              <View className="rounded-2xl bg-primary/10 border border-primary/25 p-4 mb-4">
                <Text className="text-xs text-muted dark:text-muted-dark font-bold">
                  Loading cost breakdown…
                </Text>
              </View>
            )}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  sheet: {
    maxHeight: '92%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  iconBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '800',
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 24,
  },
  recipeName: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 10,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
    marginBottom: 20,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    fontWeight: '700',
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  lineCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 8,
  },
  lineName: {
    fontSize: 15,
    fontWeight: '700',
  },
  lineFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  qtyLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  lineCost: {
    fontSize: 15,
    fontWeight: '800',
  },
});
