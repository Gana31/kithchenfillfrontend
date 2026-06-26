import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Input from '../../../components/Input';
import Button from '../../../components/Button';
import ScreenContainer from '../../../components/ScreenContainer';
import { useGetIngredientsQuery, STOCK_SORT_FETCH_LIMIT } from '../../inventory/inventoryApi';
import { useCreateRecipeMutation, useGetRecipesQuery, useUpdateRecipeMutation } from '../recipesApi';
import { useThemeColors } from '../../../hooks/useThemeColors';
import { useAppDispatch } from '../../../store/store';
import { showToast } from '../../../store/toastSlice';
import RecipeCostSummary from './RecipeCostSummary';
import IngredientPicker from './IngredientPicker';
import { formatInr, parseDecimalInput } from '../../dashboard/dashboardUtils';
import {
  computeRecipeCostPreview,
  resolveBatchYieldFromName,
} from '../recipeCostingUtils';
import {
  getDefaultRecipeQtyUnit,
  getRecipeQtyUnitOptions,
  parseRecipeQtyWithUnit,
  RecipeQtyUnit,
} from '../../inventory/ingredientFormUtils';
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
  const { data: ingredientsData } = useGetIngredientsQuery(
    {
      page: 1,
      limit: STOCK_SORT_FETCH_LIMIT,
      search: '',
      sortBy: 'name-asc',
    },
    { refetchOnMountOrArgChange: true }
  );

  const ingredients = ingredientsData?.ingredients ?? [];

  const [name, setName] = useState('');
  const [extraWastagePercent, setExtraWastagePercent] = useState('5');
  const [lines, setLines] = useState<RecipeLine[]>([emptyStockLine()]);
  const [formError, setFormError] = useState('');

  useFocusEffect(
    useCallback(() => {
      if (recipeId) {
        if (!editingRecipe) return;
        const form = recipeToFormState(editingRecipe, ingredients);
        setName(form.name);
        setExtraWastagePercent(form.extraWastagePercent);
        setLines(form.lines);
        setFormError('');
        return;
      }

      const fresh = createEmptyFormState();
      setName(fresh.name);
      setExtraWastagePercent(fresh.extraWastagePercent);
      setLines(fresh.lines);
      setFormError('');
    }, [recipeId, editingRecipe, ingredients])
  );

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
    [lines, ingredients]
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

      <ScreenContainer
        scrollable
        bottomInset={120}
        contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 16 }}
        scrollProps={{ keyboardShouldPersistTaps: 'handled' }}
      >
        {isEditing && recipeId && !editingRecipe ? (
          <Text className="text-sm text-muted dark:text-muted-dark font-bold mb-4">Loading recipe…</Text>
        ) : null}

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

        <Text className="text-sm font-black text-text dark:text-text-dark mt-2 mb-3">Ingredients</Text>

        {lines.map((row, index) => {
          if (row.kind === 'stock') {
            const selected = ingredients.find((ing) => ing._id === row.ingredientId);
            const lineCost = row.ingredientId ? lineCostById.get(row.ingredientId) : undefined;

            return (
              <View
                key={row.id}
                style={[styles.lineCard, { borderColor: border, backgroundColor: card }]}
              >
                <View style={styles.lineCardHeader}>
                  <Text style={[styles.lineCardTitle, { color: muted }]}>
                    From stock · {index + 1}
                  </Text>
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

                <View style={styles.qtyRow}>
                  <View style={styles.qtyBlock}>
                    <Text style={[styles.fieldLabel, { color: muted }]}>Quantity</Text>
                    <View style={styles.qtyInputRow}>
                      <TextInput
                        value={row.netAmount}
                        onChangeText={(v) => updateLine(row.id, { netAmount: v })}
                        keyboardType="decimal-pad"
                        placeholder={
                          row.qtyUnit === 'kg' ? '0.5' : row.qtyUnit === 'L' ? '1' : row.qtyUnit === 'pcs' ? '2' : '500'
                        }
                        placeholderTextColor={muted}
                        style={[fieldStyle, styles.qtyInput]}
                      />
                      {selected ? (
                        <RecipeQtyUnitToggle
                          options={getRecipeQtyUnitOptions(selected.unitRelation)}
                          value={row.qtyUnit}
                          onChange={(unit) => updateLine(row.id, { qtyUnit: unit })}
                          primary={primary}
                          muted={muted}
                          border={border}
                          card={card}
                        />
                      ) : (
                        <View style={[styles.unitBadge, { borderColor: `${primary}40`, backgroundColor: `${primary}12` }]}>
                          <Text style={[styles.unitBadgeText, { color: primary }]}>—</Text>
                        </View>
                      )}
                    </View>
                  </View>

                  <View style={styles.costBlock}>
                    <Text style={[styles.fieldLabel, { color: muted }]}>Line cost</Text>
                    <Text style={[styles.costValue, { color: primary }]}>
                      {lineCost !== undefined ? formatInr(lineCost) : '—'}
                    </Text>
                  </View>
                </View>
              </View>
            );
          }

          const customCost = parseDecimalInput(row.customAmount);
          const customCostDisplay = customCost > 0 ? customCost : undefined;

          return (
            <View
              key={row.id}
              style={[styles.lineCard, { borderColor: border, backgroundColor: card }]}
            >
              <View style={styles.lineCardHeader}>
                <Text style={[styles.lineCardTitle, { color: muted }]}>
                  Custom · recipe only · {index + 1}
                </Text>
                <TouchableOpacity onPress={() => removeLine(row.id)} hitSlop={8}>
                  <Ionicons name="trash-outline" size={18} color="#ef4444" />
                </TouchableOpacity>
              </View>

              <Text style={[styles.fieldLabel, { color: muted }]}>Name</Text>
              <TextInput
                value={row.customLabel}
                onChangeText={(v) => updateLine(row.id, { customLabel: v })}
                placeholder="Gas, paper, labour…"
                placeholderTextColor={muted}
                style={[fieldStyle, styles.fullField, { marginBottom: 12 }]}
              />

              <View style={styles.qtyRow}>
                <View style={styles.qtyBlock}>
                  <Text style={[styles.fieldLabel, { color: muted }]}>Cost</Text>
                  <TextInput
                    value={row.customAmount}
                    onChangeText={(v) => updateLine(row.id, { customAmount: v })}
                    keyboardType="decimal-pad"
                    placeholder="50.25"
                    placeholderTextColor={muted}
                    style={[fieldStyle, styles.fullField]}
                  />
                </View>
                <View style={styles.costBlock}>
                  <Text style={[styles.fieldLabel, { color: muted }]}>Line cost</Text>
                  <Text style={[styles.costValue, { color: primary }]}>
                    {customCostDisplay !== undefined ? formatInr(customCostDisplay) : '—'}
                  </Text>
                </View>
              </View>
            </View>
          );
        })}

        <View style={styles.addRow}>
          <TouchableOpacity
            onPress={() => setLines((rows) => [...rows, emptyStockLine()])}
            style={[styles.addBtn, { borderColor: border, backgroundColor: background }]}
          >
            <Ionicons name="leaf-outline" size={18} color={primary} />
            <Text style={[styles.addBtnText, { color: primary }]}>Add from stock</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setLines((rows) => [...rows, emptyCustomLine()])}
            style={[styles.addBtn, { borderColor: border, backgroundColor: background }]}
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

        {formError ? (
          <Text className="text-sm text-red-500 font-bold mb-3">{formError}</Text>
        ) : null}

        <Button
          label={isEditing ? 'Save changes' : 'Save recipe'}
          onPress={handleSubmit}
          loading={isSaving}
        />
      </ScreenContainer>
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
    marginBottom: 14,
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
  qtyRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 16,
  },
  qtyBlock: {
    flex: 1,
  },
  qtyInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  qtyInput: {
    flex: 1,
    height: 48,
  },
  fullField: {
    height: 48,
  },
  unitBadge: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  unitBadgeText: {
    fontSize: 13,
    fontWeight: '800',
  },
  costBlock: {
    minWidth: 88,
    alignItems: 'flex-end',
  },
  costValue: {
    fontSize: 16,
    fontWeight: '800',
    paddingVertical: 12,
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
    marginBottom: 16,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  addBtnText: {
    fontSize: 14,
    fontWeight: '800',
  },
});

function RecipeQtyUnitToggle({
  options,
  value,
  onChange,
  primary,
  muted,
  border,
  card,
}: {
  options: RecipeQtyUnit[];
  value: RecipeQtyUnit;
  onChange: (unit: RecipeQtyUnit) => void;
  primary: string;
  muted: string;
  border: string;
  card: string;
}) {
  if (options.length === 1) {
    return (
      <View style={[unitToggleStyles.single, { borderColor: `${primary}40`, backgroundColor: `${primary}12` }]}>
        <Text style={[unitToggleStyles.singleText, { color: primary }]}>{options[0]}</Text>
      </View>
    );
  }

  return (
    <View style={[unitToggleStyles.row, { borderColor: border, backgroundColor: card }]}>
      {options.map((unit) => {
        const active = value === unit;
        return (
          <TouchableOpacity
            key={unit}
            onPress={() => onChange(unit)}
            activeOpacity={0.7}
            style={[
              unitToggleStyles.btn,
              active ? { backgroundColor: `${primary}18` } : null,
            ]}
          >
            <Text style={[unitToggleStyles.btnText, { color: active ? primary : muted }]}>{unit}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const unitToggleStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    borderRadius: 10,
    borderWidth: 1,
    overflow: 'hidden',
  },
  btn: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    minWidth: 44,
    alignItems: 'center',
  },
  btnText: {
    fontSize: 13,
    fontWeight: '800',
  },
  single: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    minWidth: 44,
    alignItems: 'center',
  },
  singleText: {
    fontSize: 13,
    fontWeight: '800',
  },
});
