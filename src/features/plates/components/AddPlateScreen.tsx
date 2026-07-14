import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Modal,
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
import { useGetRecipesQuery } from '../../recipes/recipesApi';
import { useGetPlatesQuery, useCreatePlateMutation, useUpdatePlateMutation, PlateCustomItem } from '../platesApi';
import { useGetIngredientsQuery, STOCK_SORT_FETCH_LIMIT } from '../../inventory/inventoryApi';
import IngredientPicker from '../../recipes/components/IngredientPicker';
import { useThemeColors } from '../../../hooks/useThemeColors';
import { useAppDispatch } from '../../../store/store';
import { showToast } from '../../../store/toastSlice';
import { formatInr, parseDecimalInput } from '../../dashboard/dashboardUtils';
import { OwnerRootStackParamList } from '../../../navigation/ownerNavigation.types';
import { SCROLL_LIST_PROPS, LIST_VIRTUALIZATION_PROPS } from '../../../components/scrollUtils';

type LineItem = {
  id: string;
  kind: 'custom' | 'stock';
  ingredientId?: string;
  name: string;
  price: string;
  quantity: string;
  baseUnit?: string;
};

let lineCounter = 0;
const newCustomItemLine = (): LineItem => ({
  id: `custom-item-${++lineCounter}`,
  kind: 'custom',
  name: '',
  price: '',
  quantity: '1',
});

export default function AddPlateScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<OwnerRootStackParamList, 'AddPlate'>>();
  const route = useRoute<RouteProp<OwnerRootStackParamList, 'AddPlate'>>();
  const plateId = route.params?.plateId;
  const prefillRecipeId = route.params?.prefillRecipeId;
  const isEditing = Boolean(plateId);
  const insets = useSafeAreaInsets();
  const { primary, muted, text, card, border, background, isDark } = useThemeColors();
  const dispatch = useAppDispatch();

  // Queries
  const { data: recipesData, isLoading: recipesLoading } = useGetRecipesQuery();
  const { data: platesData } = useGetPlatesQuery();
  const { data: ingredientsData } = useGetIngredientsQuery({
    page: 1,
    limit: STOCK_SORT_FETCH_LIMIT,
    search: '',
    sortBy: 'name-asc',
    stockFilter: 'all',
  });
  const [createPlate, { isLoading: isCreating }] = useCreatePlateMutation();
  const [updatePlate, { isLoading: isUpdating }] = useUpdatePlateMutation();

  const isSaving = isCreating || isUpdating;
  const editingPlate = plateId ? platesData?.plates.find((p) => p._id === plateId) : undefined;
  const recipes = recipesData?.recipes ?? [];
  const ingredients = ingredientsData?.ingredients ?? [];

  // Form states
  const [name, setName] = useState('');
  const [selectedRecipeId, setSelectedRecipeId] = useState<string | null>(null);
  const [size, setSize] = useState('1');
  const [unit, setUnit] = useState<'g' | 'ml' | 'pcs'>('g');
  const [customFoodCost, setCustomFoodCost] = useState('0');
  const [customLines, setCustomLines] = useState<LineItem[]>([newCustomItemLine()]);
  const [sellPrice, setSellPrice] = useState('0');
  const [formError, setFormError] = useState('');
  const [showRecipeModal, setShowRecipeModal] = useState(false);

  // Pre-fill states from route params or editing state
  useEffect(() => {
    if (prefillRecipeId) {
      setSelectedRecipeId(prefillRecipeId);
      const recipe = recipes.find((r) => r._id === prefillRecipeId);
      if (recipe) {
        setUnit(recipe.batchYieldUnit);
        setName(`${recipe.name} Plate`);
      }
    }
  }, [prefillRecipeId, recipes]);

  useEffect(() => {
    if (isEditing && editingPlate && ingredients.length > 0) {
      setName(editingPlate.name);
      setSelectedRecipeId(editingPlate.recipeId || null);
      setSize(String(editingPlate.size));
      setUnit(editingPlate.unit);
      setCustomFoodCost(String(editingPlate.customFoodCost || 0));
      setSellPrice(String(editingPlate.sellPrice));
      
      const loadedLines = editingPlate.customItems.map((item) => {
        const isStock = Boolean(item.ingredientId);
        let baseUnit = '';
        if (isStock) {
          const matched = ingredients.find((i) => i._id === String(item.ingredientId));
          if (matched) {
            baseUnit = matched.unitRelation?.baseUnit || '';
          }
        }
        return {
          id: `custom-item-${++lineCounter}`,
          kind: isStock ? ('stock' as const) : ('custom' as const),
          ingredientId: item.ingredientId ? String(item.ingredientId) : undefined,
          name: item.name,
          price: String(item.price),
          quantity: String(item.quantity),
          baseUnit,
        };
      });
      setCustomLines(loadedLines.length > 0 ? loadedLines : [newCustomItemLine()]);
    }
  }, [isEditing, editingPlate, ingredients]);

  // Find active recipe details
  const activeRecipe = useMemo(() => {
    if (!selectedRecipeId) return null;
    return recipes.find((r) => r._id === selectedRecipeId) || null;
  }, [selectedRecipeId, recipes]);

  // Calculations
  const calculatedFoodCost = useMemo(() => {
    if (selectedRecipeId && activeRecipe) {
      const yieldAmt = Math.max(0.001, activeRecipe.batchYieldAmount);
      const batchCost = activeRecipe.costing?.batchCost ?? 0;
      const sizeVal = parseDecimalInput(size) || 0;
      return (batchCost * sizeVal) / yieldAmt;
    }
    return parseDecimalInput(customFoodCost) || 0;
  }, [selectedRecipeId, activeRecipe, size, customFoodCost]);

  const packagingCost = useMemo(() => {
    return customLines.reduce((sum, item) => {
      let priceVal = parseDecimalInput(item.price) || 0;
      if (item.kind === 'stock' && item.ingredientId) {
        const ing = ingredients.find((i) => i._id === item.ingredientId);
        if (ing) {
          const ratio = ing.unitRelation?.conversionRatio || 1;
          priceVal = (ing.purchasePrice || 0) / ratio;
        }
      }
      const qtyVal = parseDecimalInput(item.quantity) || 0;
      return sum + priceVal * qtyVal;
    }, 0);
  }, [customLines, ingredients]);

  const totalMakingCost = calculatedFoodCost + packagingCost;
  const sellPriceVal = parseDecimalInput(sellPrice) || 0;

  const handleSelectRecipe = (id: string | null) => {
    setSelectedRecipeId(id);
    setShowRecipeModal(false);
    if (id) {
      const recipe = recipes.find((r) => r._id === id);
      if (recipe) {
        setUnit(recipe.batchYieldUnit);
        if (!name.trim() || name === 'New Plate') {
          setName(`${recipe.name} Portion`);
        }
      }
    } else {
      setUnit('g');
    }
  };

  const addCustomLine = () => {
    setCustomLines((rows) => [...rows, newCustomItemLine()]);
  };

  const removeCustomLine = (id: string) => {
    setCustomLines((rows) => {
      const next = rows.filter((row) => row.id !== id);
      return next.length > 0 ? next : [newCustomItemLine()];
    });
  };

  const updateCustomLine = (id: string, patch: Partial<LineItem>) => {
    setCustomLines((rows) => rows.map((row) => (row.id === id ? { ...row, ...patch } : row)));
  };

  const handleSubmit = async () => {
    setFormError('');
    if (!name.trim()) {
      setFormError('Plate name is required.');
      return;
    }

    const sizeVal = parseDecimalInput(size);
    if (!sizeVal || sizeVal <= 0) {
      setFormError('Portion size must be greater than 0.');
      return;
    }

    const payload = {
      name: name.trim(),
      recipeId: selectedRecipeId || undefined,
      size: sizeVal,
      unit,
      customFoodCost: selectedRecipeId ? undefined : parseDecimalInput(customFoodCost) || 0,
      customItems: customLines
        .filter((c) => (c.kind === 'stock' ? c.ingredientId : c.name.trim()) && parseDecimalInput(c.price) >= 0)
        .map((c) => ({
          name: c.name.trim(),
          price: parseDecimalInput(c.price) || 0,
          quantity: parseDecimalInput(c.quantity) || 1,
          ingredientId: c.kind === 'stock' ? c.ingredientId : undefined,
        })),
      sellPrice: parseDecimalInput(sellPrice) || 0,
    };

    try {
      if (isEditing && plateId) {
        await updatePlate({ id: plateId, body: payload }).unwrap();
      } else {
        await createPlate(payload).unwrap();
      }

      dispatch(
        showToast({
          title: isEditing ? 'Plate updated' : 'Plate created',
          message: `${name.trim()} successfully saved.`,
          type: 'success',
        })
      );
      navigation.goBack();
    } catch (err: any) {
      setFormError(err?.data?.error || 'Could not save portion/plate.');
    }
  };

  const listHeader = (
    <View style={{ gap: 12 }}>
      <Input
        label="Plate Name"
        value={name}
        onChangeText={setName}
        placeholder="e.g. Single Plate Biryani"
      />

      {/* Recipe Picker */}
      <View style={{ marginBottom: 6 }}>
        <Text style={[styles.fieldLabel, { color: muted }]}>Recipe Link</Text>
        <TouchableOpacity
          onPress={() => setShowRecipeModal(true)}
          style={[styles.pickerTrigger, { borderColor: border, backgroundColor: card }]}
        >
          <View className="flex-row items-center">
            <Ionicons
              name={selectedRecipeId ? 'restaurant-outline' : 'alert-circle-outline'}
              size={18}
              color={selectedRecipeId ? primary : muted}
              style={{ marginRight: 8 }}
            />
            <Text style={{ color: selectedRecipeId ? text : muted, fontWeight: '600' }}>
              {activeRecipe ? activeRecipe.name : 'None (Custom Food Cost)'}
            </Text>
          </View>
          <Ionicons name="chevron-down" size={16} color={muted} />
        </TouchableOpacity>
      </View>

      {selectedRecipeId && activeRecipe ? (
        <View style={[styles.infoBox, { borderColor: border, backgroundColor: `${primary}08` }]}>
          <Text style={{ color: text, fontSize: 13, fontWeight: '600' }}>
            Linked Recipe: <Text style={{ color: primary }}>{activeRecipe.name}</Text>
          </Text>
          <Text style={{ color: muted, fontSize: 11, marginTop: 4 }}>
            Recipe Batch: {activeRecipe.batchYieldAmount} {activeRecipe.batchYieldUnit} · Cost:{' '}
            {formatInr(activeRecipe.costing?.batchCost ?? 0)}
          </Text>
        </View>
      ) : null}

      <View className="flex-row" style={{ gap: 12 }}>
        <View className="flex-1">
          <Input
            label="Portion size"
            value={size}
            onChangeText={setSize}
            keyboardType="decimal-pad"
            placeholder="100"
          />
        </View>

        {!selectedRecipeId ? (
          <View style={{ width: 100 }}>
            <Text style={[styles.fieldLabel, { color: muted }]}>Unit</Text>
            <View className="flex-row bg-card dark:bg-card-dark border border-border dark:border-border-dark rounded-xl p-1 h-[48px]" style={{ gap: 4 }}>
              {(['g', 'ml', 'pcs'] as const).map((u) => (
                <TouchableOpacity
                  key={u}
                  onPress={() => setUnit(u)}
                  className={`flex-1 justify-center items-center rounded-lg ${unit === u ? 'bg-primary' : ''}`}
                >
                  <Text style={{ fontSize: 12, fontWeight: '700', color: unit === u ? '#fff' : muted }}>
                    {u}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ) : (
          <View style={{ width: 100 }}>
            <Text style={[styles.fieldLabel, { color: muted }]}>Unit</Text>
            <View style={[styles.unitBadge, { borderColor: border, backgroundColor: card }]}>
              <Text style={{ color: text, fontWeight: '700' }}>{unit}</Text>
            </View>
          </View>
        )}
      </View>

      {!selectedRecipeId && (
        <Input
          label="Base Food Cost (₹)"
          value={customFoodCost}
          onChangeText={setCustomFoodCost}
          keyboardType="decimal-pad"
          placeholder="50"
        />
      )}

      <Text className="text-sm font-bold text-text dark:text-text-dark mt-3 mb-1">
        Packaging & Extra Items
      </Text>
    </View>
  );

  const listFooter = (
    <View style={{ gap: 16, marginTop: 16 }}>
      <TouchableOpacity
        onPress={addCustomLine}
        activeOpacity={0.8}
        style={[styles.addBtn, { borderColor: primary, backgroundColor: card }]}
      >
        <Ionicons name="add-circle-outline" size={18} color={primary} />
        <Text style={[styles.addBtnText, { color: primary }]}>Add extra item/packaging</Text>
      </TouchableOpacity>

      <Input
        label="Selling Price (₹)"
        value={sellPrice}
        onChangeText={setSellPrice}
        keyboardType="decimal-pad"
        placeholder="100"
      />

      {/* Pricing Summary */}
      <View
        style={{
          borderWidth: 1,
          borderColor: border,
          backgroundColor: card,
          borderRadius: 16,
          padding: 16,
          gap: 12,
        }}
      >
        <Text style={{ fontSize: 12, fontWeight: '800', color: primary, textTransform: 'uppercase' }}>
          Plate Costing Summary
        </Text>

        <View className="flex-row justify-between">
          <Text style={{ fontSize: 13, color: muted }}>Base Food Cost</Text>
          <Text style={{ fontSize: 13, color: text, fontWeight: '600' }}>
            {formatInr(calculatedFoodCost)}
          </Text>
        </View>

        <View className="flex-row justify-between">
          <Text style={{ fontSize: 13, color: muted }}>Packaging / Extras</Text>
          <Text style={{ fontSize: 13, color: text, fontWeight: '600' }}>
            {formatInr(packagingCost)}
          </Text>
        </View>

        <View className="border-t border-border dark:border-border-dark my-1" />

        <View className="flex-row justify-between">
          <Text style={{ fontSize: 14, color: text, fontWeight: 'bold' }}>Total Making Cost</Text>
          <Text style={{ fontSize: 14, color: text, fontWeight: '800' }}>
            {formatInr(totalMakingCost)}
          </Text>
        </View>

        <View className="flex-row justify-between">
          <Text style={{ fontSize: 14, color: text, fontWeight: 'bold' }}>Sell Price</Text>
          <Text style={{ fontSize: 14, color: primary, fontWeight: '800' }}>
            {formatInr(sellPriceVal)}
          </Text>
        </View>
      </View>

      {formError ? <Text className="text-sm font-bold text-red-500">{formError}</Text> : null}

      <View style={{ paddingBottom: insets.bottom + 24 }}>
        <Button label={isEditing ? 'Save Portions' : 'Create Portion Plate'} onPress={handleSubmit} loading={isSaving} />
      </View>
    </View>
  );

  const renderCustomLine = ({ item, index }: { item: LineItem; index: number }) => (
    <View style={[styles.lineCard, { borderColor: border, backgroundColor: card }]}>
      <View className="flex-row justify-between items-center mb-3">
        <Text style={{ fontSize: 11, fontWeight: '800', color: muted, textTransform: 'uppercase' }}>
          Extra Item {index + 1}
        </Text>
        <TouchableOpacity onPress={() => removeCustomLine(item.id)}>
          <Ionicons name="trash-outline" size={16} color="#ef4444" />
        </TouchableOpacity>
      </View>

      {/* Kind Toggle Switch */}
      <View className="flex-row bg-background dark:bg-background-dark border border-border dark:border-border-dark rounded-xl p-1 mb-3" style={{ gap: 4 }}>
        <TouchableOpacity
          onPress={() => updateCustomLine(item.id, { kind: 'custom', name: '', price: '', ingredientId: undefined, baseUnit: undefined })}
          className={`flex-1 py-1.5 justify-center items-center rounded-lg ${item.kind === 'custom' ? 'bg-primary' : ''}`}
          activeOpacity={0.7}
        >
          <Text style={{ fontSize: 11, fontWeight: '800', color: item.kind === 'custom' ? '#fff' : muted }}>
            CUSTOM EXTRA
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => updateCustomLine(item.id, { kind: 'stock', name: '', price: '', ingredientId: undefined, baseUnit: undefined })}
          className={`flex-1 py-1.5 justify-center items-center rounded-lg ${item.kind === 'stock' ? 'bg-primary' : ''}`}
          activeOpacity={0.7}
        >
          <Text style={{ fontSize: 11, fontWeight: '800', color: item.kind === 'stock' ? '#fff' : muted }}>
            FROM INVENTORY
          </Text>
        </TouchableOpacity>
      </View>

      {item.kind === 'custom' ? (
        <Input
          label="Item Name"
          value={item.name}
          onChangeText={(v) => updateCustomLine(item.id, { name: v })}
          placeholder="Container, Foil bag, Spoons..."
        />
      ) : (
        <View style={{ marginBottom: 12 }}>
          <Text style={[styles.fieldLabel, { color: muted }]}>Select Ingredient</Text>
          <IngredientPicker
            ingredients={ingredients}
            selectedId={item.ingredientId || ''}
            onSelect={(id) => {
              const ing = ingredients.find((i) => i._id === id);
              const nameStr = ing ? ing.name : '';
              const ratio = ing?.unitRelation?.conversionRatio || 1;
              const priceStr = ing ? String(Math.round(((ing.purchasePrice || 0) / ratio) * 100) / 100) : '';
              const baseUnitStr = ing?.unitRelation?.baseUnit || '';
              updateCustomLine(item.id, {
                ingredientId: id,
                name: nameStr,
                price: priceStr,
                baseUnit: baseUnitStr,
              });
            }}
          />
        </View>
      )}

      <View className="flex-row mt-1" style={{ gap: 12 }}>
        <View className="flex-1">
          <Input
            label={item.kind === 'stock' ? `Cost / ${item.baseUnit || 'unit'} (₹)` : 'Cost Per Item (₹)'}
            value={item.price}
            onChangeText={(v) => updateCustomLine(item.id, { price: v })}
            keyboardType="decimal-pad"
            placeholder="5"
          />
        </View>
        <View className="flex-1">
          <Input
            label={item.kind === 'stock' ? `Quantity (${item.baseUnit || 'pcs'})` : 'Quantity'}
            value={item.quantity}
            onChangeText={(v) => updateCustomLine(item.id, { quantity: v })}
            keyboardType="decimal-pad"
            placeholder="1"
          />
        </View>
      </View>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar style={isDark ? 'light' : 'dark'} />

      {/* Top Bar */}
      <View
        style={[
          styles.topBar,
          { paddingTop: insets.top + 8, borderBottomColor: border, backgroundColor: background },
        ]}
      >
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} hitSlop={10}>
          <Ionicons name="arrow-back" size={22} color={text} />
        </TouchableOpacity>
        <Text style={[styles.topTitle, { color: text }]}>
          {isEditing ? 'Edit Portion Plate' : 'New Portion Plate'}
        </Text>
        <View style={styles.backBtn} />
      </View>

      {recipesLoading ? (
        <LoadingView message="Loading recipes…" />
      ) : (
        <FlatList
          data={customLines}
          keyExtractor={(item) => item.id}
          renderItem={renderCustomLine}
          ListHeaderComponent={listHeader}
          ListFooterComponent={listFooter}
          contentContainerStyle={{
            paddingHorizontal: 24,
            paddingTop: 16,
            gap: 14,
          }}
          {...SCROLL_LIST_PROPS}
          {...LIST_VIRTUALIZATION_PROPS}
        />
      )}

      {/* Recipe Selection Modal */}
      <Modal visible={showRecipeModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: background, borderColor: border }]}>
            <View className="flex-row justify-between items-center px-6 py-4 border-b border-border dark:border-border-dark">
              <Text style={{ fontSize: 16, fontWeight: 'bold', color: text }}>Select Recipe</Text>
              <TouchableOpacity onPress={() => setShowRecipeModal(false)}>
                <Ionicons name="close" size={20} color={text} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              onPress={() => handleSelectRecipe(null)}
              className="flex-row items-center px-6 py-4 border-b border-border dark:border-border-dark"
            >
              <Ionicons name="alert-circle-outline" size={18} color={muted} style={{ marginRight: 12 }} />
              <Text style={{ fontSize: 14, color: text, fontWeight: '600' }}>
                None (Custom Food Cost)
              </Text>
            </TouchableOpacity>

            <FlatList
              data={recipes}
              keyExtractor={(r) => r._id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => handleSelectRecipe(item._id)}
                  className="flex-row justify-between items-center px-6 py-4 border-b border-border dark:border-border-dark"
                >
                  <View>
                    <Text style={{ fontSize: 14, color: text, fontWeight: '600' }}>{item.name}</Text>
                    <Text style={{ fontSize: 11, color: muted, marginTop: 2 }}>
                      Batch: {item.batchYieldAmount} {item.batchYieldUnit} · Cost:{' '}
                      {formatInr(item.costing?.batchCost ?? 0)}
                    </Text>
                  </View>
                  {selectedRecipeId === item._id && (
                    <Ionicons name="checkmark" size={18} color={primary} />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
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
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  pickerTrigger: {
    height: 48,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoBox: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  unitBadge: {
    height: 48,
    borderWidth: 1,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    borderRadius: 12,
    borderWidth: 1.5,
    gap: 8,
  },
  addBtnText: {
    fontSize: 14,
    fontWeight: '800',
  },
  lineCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    maxHeight: '75%',
  },
});
