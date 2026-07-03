import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Input from '../../../components/Input';
import Button from '../../../components/Button';
import ScrollFormInput from '../../../components/ScrollFormInput';
import { LoadingView } from '../../../components/AsyncStateViews';
import { useGetIngredientsQuery, STOCK_SORT_FETCH_LIMIT } from '../../inventory/inventoryApi';
import { useCreateRecipeMutation, useGetRecipesQuery, useUpdateRecipeMutation } from '../recipesApi';
import { useThemeColors } from '../../../hooks/useThemeColors';
import { useAppDispatch } from '../../../store/store';
import { showToast } from '../../../store/toastSlice';
import RecipeCostSummary from './RecipeCostSummary';
import IngredientPicker from './IngredientPicker';
import InventoryQtyUnitToggle from '../../inventory/components/InventoryQtyUnitToggle';
import { formatInr, parseDecimalInput } from '../../dashboard/dashboardUtils';
import {
  computeRecipeCostPreview,
  resolveBatchYieldFromName,
} from '../recipeCostingUtils';
import {
  getDefaultRecipeQtyUnit,
  getRecipeQtyUnitOptions,
  parseRecipeQtyWithUnit,
} from '../../inventory/ingredientFormUtils';
import { SCROLL_LIST_PROPS, LIST_VIRTUALIZATION_PROPS } from '../../../components/scrollUtils';
import { OwnerRootStackParamList } from '../../../navigation/ownerNavigation.types';
import {
  RecipeLine,
  createEmptyFormState,
  emptyCustomLine,
  emptyStockLine,
  recipeToFormState,
} from '../recipeFormUtils';

export default function AddRecipeScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<OwnerRootStackParamList, 'AddRecipe'>>();
  const route = useRoute<RouteProp<OwnerRootStackParamList, 'AddRecipe'>>();
  const recipeId = route.params?.recipeId;
  const isEditing = Boolean(recipeId);
  const insets = useSafeAreaInsets();
  const { primary, muted, text, card, border, background, isDark } = useThemeColors();
  const dispatch = useAppDispatch();
  const [createRecipe, { isLoading: isCreating }] = useCreateRecipeMutation();
  const [updateRecipe, { isLoading: isUpdating }] = useUpdateRecipeMutation();
  const { data: recipesData } = useGetRecipesQuery();
  const editingRecipe = recipeId ? recipesData?.recipes.find((row) => row._id === recipeId) : undefined;
  const isSaving = isCreating || isUpdating;
  const { data: ingredientsData, isLoading: ingredientsLoading } = useGetIngredientsQuery(
    {
      page: 1,
      limit: STOCK_SORT_FETCH_LIMIT,
      search: '',
      sortBy: 'name-asc',
      stockFilter: 'all',
    },
    { refetchOnMountOrArgChange: 120 }
  );

  const ingredients = ingredientsData?.ingredients ?? [];

  const [name, setName] = useState('');
  const [extraWastagePercent, setExtraWastagePercent] = useState('5');
  const [lines, setLines] = useState<RecipeLine[]>([emptyStockLine()]);
  const [formError, setFormError] = useState('');
  const [formHydrated, setFormHydrated] = useState(!isEditing);

  useEffect(() => {
    setFormHydrated(false);
  }, [recipeId]);

  useEffect(() => {
    if (!recipeId) {
      const fresh = createEmptyFormState();
      setName(fresh.name);
      setExtraWastagePercent(fresh.extraWastagePercent);
      setLines(fresh.lines);
      setFormError('');
      setFormHydrated(true);
      return;
    }

    if (!editingRecipe || ingredientsLoading) return;

    const form = recipeToFormState(editingRecipe, ingredients);
    setName(form.name);
    setExtraWastagePercent(form.extraWastagePercent);
    setLines(form.lines);
    setFormError('');
    setFormHydrated(true);
  }, [recipeId, editingRecipe, ingredients, ingredientsLoading]);

  const showFormLoading = isEditing && (!editingRecipe || ingredientsLoading || !formHydrated);

  const handleNameChange = (value: string) => {
    setName(value);
  };

  const parsedIngredients = useMemo(
    () =>
      lines
        .filter((row) => row.kind === 'stock' && row.ingredientId && row.netAmount.trim())
        .map((row) => {
          const netAmount = parseRecipeQtyWithUnit(row.netAmount, row.qtyUnit);
          return {
            ingredientId: row.ingredientId,
            netAmount,
            wastagePercent: 0,
          };
        })
        .filter((row) => Number.isFinite(row.netAmount) && row.netAmount > 0),
    [lines]
  );

  const parsedCustomLines = useMemo(
    () =>
      lines
        .filter((row) => row.kind === 'custom' && row.customLabel.trim())
        .map((row) => ({ label: row.customLabel.trim(), amount: parseDecimalInput(row.customAmount) }))
        .filter((row) => row.amount > 0),
    [lines]
  );

  const costPreview = useMemo(
    () =>
      computeRecipeCostPreview(ingredients, {
        ingredientsUsed: parsedIngredients,
        customCostLines: parsedCustomLines,
        extraWastagePercent: parseDecimalInput(extraWastagePercent) || 0,
        makingCharges: { fixedAmount: 0, percentOfIngredients: 0 },
      }),
    [ingredients, parsedIngredients, parsedCustomLines, extraWastagePercent]
  );

  const lineCostById = useMemo(
    () => new Map(costPreview.lines.map((line) => [line.ingredientId, line.lineCost])),
    [costPreview.lines]
  );

  const usedIngredientIds = lines
    .filter((row) => row.kind === 'stock')
    .map((row) => row.ingredientId)
    .filter(Boolean);

  const updateLine = (lineId: string, patch: Partial<RecipeLine>) => {
    setLines((rows) => rows.map((row) => (row.id === lineId ? { ...row, ...patch } : row)));
  };

  const removeLine = (lineId: string) => {
    setLines((rows) => {
      const next = rows.filter((row) => row.id !== lineId);
      return next.length > 0 ? next : [emptyStockLine()];
    });
  };

  const handleSubmit = async () => {
    setFormError('');

    if (!name.trim()) {
      setFormError('Recipe name is required.');
      return;
    }

    if (parsedIngredients.length === 0 && parsedCustomLines.length === 0) {
      setFormError('Add at least one ingredient or custom item.');
      return;
    }

    const { batchYieldAmount, batchYieldUnit, costingMode } = resolveBatchYieldFromName(name.trim());

    const payload = {
      name: name.trim(),
      costingMode,
      batchYieldAmount,
      batchYieldUnit,
      ingredientsUsed: parsedIngredients,
      makingCharges: { fixedAmount: 0, percentOfIngredients: 0 },
      customCostLines: parsedCustomLines,
      extraWastagePercent: parseDecimalInput(extraWastagePercent) || 0,
    };

    try {
      if (isEditing && recipeId) {
        await updateRecipe({ id: recipeId, body: payload }).unwrap();
      } else {
        await createRecipe(payload).unwrap();
      }

      dispatch(
        showToast({
          title: isEditing ? 'Recipe updated' : 'Recipe saved',
          message: `${name.trim()} — ${formatInr(costPreview.batchCost)}`,
          type: 'success',
        })
      );
      navigation.goBack();
    } catch (err: any) {
      setFormError(err?.data?.error || `Could not ${isEditing ? 'update' : 'save'} recipe.`);
    }
  };

  const fieldStyle = [styles.field, { borderColor: border, backgroundColor: card, color: text }];

  const renderLine = useCallback(
    ({ item: row, index }: { item: RecipeLine; index: number }) => {
      if (row.kind === 'stock') {
        const selected = ingredients.find((ing) => ing._id === row.ingredientId);
        const lineCost = row.ingredientId ? lineCostById.get(row.ingredientId) : undefined;

        return (
          <View style={[styles.lineCard, { borderColor: border, backgroundColor: card }]}>
            <View style={styles.lineCardHeader}>
              <Text style={[styles.lineCardTitle, { color: muted }]}>From stock · {index + 1}</Text>
              <TouchableOpacity onPress={() => removeLine(row.id)} hitSlop={8}>
                <Ionicons name="trash-outline" size={18} color="#ef4444" />
              </TouchableOpacity>
            </View>

            <IngredientPicker
              ingredients={ingredients}
              selectedId={row.ingredientId}
              onSelect={(id) => {
                const ingredient = ingredients.find((item) => item._id === id);
                updateLine(row.id, {
                  ingredientId: id,
                  qtyUnit: ingredient ? getDefaultRecipeQtyUnit(ingredient.unitRelation) : 'g',
                });
              }}
              excludeIds={usedIngredientIds.filter((id) => id !== row.ingredientId)}
            />

            <View style={styles.qtySection}>
              <View style={styles.qtyCostHeader}>
                <Text style={[styles.fieldLabel, styles.headerLabel, { color: muted }]}>Quantity</Text>
                <View style={styles.costInline}>
                  <Text style={[styles.fieldLabel, styles.headerLabel, { color: muted }]}>Line cost</Text>
                  <Text style={[styles.costValueInline, { color: primary }]}>
                    {lineCost !== undefined ? formatInr(lineCost) : '—'}
                  </Text>
                </View>
              </View>

              <ScrollFormInput
                value={row.netAmount}
                onChangeText={(v) => updateLine(row.id, { netAmount: v })}
                keyboardType="decimal-pad"
                placeholder={
                  row.qtyUnit === 'kg' ? '0.5' : row.qtyUnit === 'L' ? '1' : row.qtyUnit === 'pcs' ? '2' : '500'
                }
                placeholderTextColor={muted}
                style={[fieldStyle, styles.qtyInputFull]}
              />

              {selected ? (
                <InventoryQtyUnitToggle
                  options={getRecipeQtyUnitOptions(selected.unitRelation)}
                  value={row.qtyUnit}
                  onChange={(unit) => updateLine(row.id, { qtyUnit: unit })}
                  primary={primary}
                  muted={muted}
                  border={border}
                  card={card}
                />
              ) : (
                <View style={[styles.unitBadgeFull, { borderColor: `${primary}40`, backgroundColor: `${primary}12` }]}>
                  <Text style={[styles.unitBadgeText, { color: primary }]}>—</Text>
                </View>
              )}
            </View>
          </View>
        );
      }

      const customCost = parseDecimalInput(row.customAmount);
      const customCostDisplay = customCost > 0 ? customCost : undefined;

      return (
        <View style={[styles.lineCard, { borderColor: border, backgroundColor: card }]}>
          <View style={styles.lineCardHeader}>
            <Text style={[styles.lineCardTitle, { color: muted }]}>Custom · recipe only · {index + 1}</Text>
            <TouchableOpacity onPress={() => removeLine(row.id)} hitSlop={8}>
              <Ionicons name="trash-outline" size={18} color="#ef4444" />
            </TouchableOpacity>
          </View>

          <Text style={[styles.fieldLabel, { color: muted }]}>Name</Text>
          <ScrollFormInput
            value={row.customLabel}
            onChangeText={(v) => updateLine(row.id, { customLabel: v })}
            placeholder="Gas, paper, labour…"
            placeholderTextColor={muted}
            style={[fieldStyle, styles.fullField, { marginBottom: 12 }]}
          />

          <View style={styles.qtySection}>
            <View style={styles.qtyCostHeader}>
              <Text style={[styles.fieldLabel, styles.headerLabel, { color: muted }]}>Cost</Text>
              <View style={styles.costInline}>
                <Text style={[styles.fieldLabel, styles.headerLabel, { color: muted }]}>Line cost</Text>
                <Text style={[styles.costValueInline, { color: primary }]}>
                  {customCostDisplay !== undefined ? formatInr(customCostDisplay) : '—'}
                </Text>
              </View>
            </View>

            <ScrollFormInput
              value={row.customAmount}
              onChangeText={(v) => updateLine(row.id, { customAmount: v })}
              keyboardType="decimal-pad"
              placeholder="50.25"
              placeholderTextColor={muted}
              style={[fieldStyle, styles.qtyInputFull]}
            />
          </View>
        </View>
      );
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [ingredients, lineCostById, usedIngredientIds, border, card, muted, primary, text]
  );

  const listHeader = (
    <View>
      <Input
        label="Recipe name"
        value={name}
        onChangeText={handleNameChange}
        placeholder="1kg Chicken Biryani"
      />
      <Input
        label="Extra waste %"
        value={extraWastagePercent}
        onChangeText={setExtraWastagePercent}
        keyboardType="decimal-pad"
        placeholder="5.5"
      />
      <Text className="text-sm font-semibold text-text dark:text-text-dark mt-2 mb-3">Ingredients</Text>
    </View>
  );

  const listFooter = (
    <View style={{ marginTop: 14 }}>
      <View style={{ gap: 10, marginBottom: 16 }}>
        <TouchableOpacity
          onPress={() => setLines((rows) => [...rows, emptyStockLine()])}
          activeOpacity={0.85}
          style={[styles.addBtn, { borderColor: primary, backgroundColor: card }]}
        >
          <Ionicons name="leaf-outline" size={18} color={primary} />
          <Text style={[styles.addBtnText, { color: primary }]}>Add from stock</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setLines((rows) => [...rows, emptyCustomLine()])}
          activeOpacity={0.85}
          style={[styles.addBtn, { borderColor: primary, backgroundColor: card }]}
        >
          <Ionicons name="create-outline" size={18} color={primary} />
          <Text style={[styles.addBtnText, { color: primary }]}>Add custom</Text>
        </TouchableOpacity>
      </View>

      <RecipeCostSummary
        preview={costPreview}
        customCostLines={parsedCustomLines}
        extraWastagePercent={parseDecimalInput(extraWastagePercent) || 0}
      />

      {formError ? <Text className="text-sm text-red-500 font-bold mb-3">{formError}</Text> : null}

      <View style={{ paddingBottom: insets.bottom + 8 }}>
        <Button label={isEditing ? 'Save changes' : 'Save recipe'} onPress={handleSubmit} loading={isSaving} />
      </View>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar style={isDark ? 'light' : 'dark'} />

      <View
        style={[styles.topBar, { paddingTop: insets.top + 8, borderBottomColor: border, backgroundColor: background }]}
      >
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} hitSlop={10}>
          <Ionicons name="arrow-back" size={22} color={text} />
        </TouchableOpacity>
        <Text style={[styles.topTitle, { color: text }]}>{isEditing ? 'Edit Recipe' : 'New Recipe'}</Text>
        <View style={styles.backBtn} />
      </View>

      {showFormLoading ? (
        <LoadingView message="Loading recipe…" />
      ) : (
        <FlatList
          data={lines}
          keyExtractor={(row) => row.id}
          renderItem={renderLine}
          ListHeaderComponent={listHeader}
          ListFooterComponent={listFooter}
          contentContainerStyle={{
            paddingHorizontal: 24,
            paddingTop: 16,
            paddingBottom: insets.bottom + 56,
            gap: 14,
          }}
          {...SCROLL_LIST_PROPS}
          {...LIST_VIRTUALIZATION_PROPS}
        />
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topTitle: {
    fontSize: 17,
    fontWeight: '800',
  },
  lineCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    gap: 12,
  },
  lineCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  lineCardTitle: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  qtySection: {
    gap: 10,
  },
  qtyCostHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  headerLabel: {
    marginBottom: 0,
  },
  costInline: {
    alignItems: 'flex-end',
    flexShrink: 0,
    maxWidth: '46%',
  },
  costValueInline: {
    fontSize: 16,
    fontWeight: '800',
    marginTop: 2,
  },
  qtyInputFull: {
    width: '100%',
    height: 48,
  },
  fullField: {
    height: 48,
  },
  unitBadgeFull: {
    width: '100%',
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
  },
  unitBadgeText: {
    fontSize: 13,
    fontWeight: '800',
  },
  field: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontSize: 15,
    fontWeight: '600',
  },
  addRow: {
    gap: 10,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    borderRadius: 12,
    borderWidth: 1.5,
    gap: 8,
    opacity: 1,
  },
  addBtnText: {
    fontSize: 14,
    fontWeight: '800',
  },
});
