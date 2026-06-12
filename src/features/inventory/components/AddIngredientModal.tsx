import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  Modal, 
  TouchableOpacity, 
  ScrollView, 
  KeyboardAvoidingView, 
  Platform,
  Alert,
  Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import Input from '../../../components/Input';
import Button from '../../../components/Button';
import { 
  useCreateIngredientMutation, 
  useUpdateIngredientMutation,
  useLazyGetUploadSignatureQuery,
  IngredientData 
} from '../inventoryApi';
import { useThemeColors } from '../../../hooks/useThemeColors';
import { useAppDispatch } from '../../../store/store';
import { showToast } from '../../../store/toastSlice';

interface AddIngredientModalProps {
  visible: boolean;
  onClose: () => void;
  ingredient?: IngredientData | null;
}

type UnitCategory = 'weight' | 'volume' | 'count';

const CATEGORIES = [
  { name: 'Meat', icon: '🍗' },
  { name: 'Dairy', icon: '🥛' },
  { name: 'Grains', icon: '🌾' },
  { name: 'Vegetables', icon: '🥦' },
  { name: 'Seafood', icon: '🐟' },
  { name: 'Spices', icon: '🧂' },
  { name: 'Beverages', icon: '🥤' },
  { name: 'Bakery', icon: '🍞' },
  { name: 'Packaging', icon: '📦' },
  { name: 'Pantry', icon: '🥫' }
];

export default function AddIngredientModal({ visible, onClose, ingredient }: AddIngredientModalProps) {
  const { muted, primary } = useThemeColors();
  const dispatch = useAppDispatch();
  const [createIngredient, { isLoading: isCreating }] = useCreateIngredientMutation();
  const [updateIngredient, { isLoading: isUpdating }] = useUpdateIngredientMutation();
  const [triggerGetSignature, { isFetching: isFetchingSignature }] = useLazyGetUploadSignatureQuery();

  // Form State
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Pantry');
  const [unitCategory, setUnitCategory] = useState<UnitCategory>('weight');
  const [minThresholdInput, setMinThresholdInput] = useState('');
  const [initialQtyInput, setInitialQtyInput] = useState('');
  const [purchaseCostInput, setPurchaseCostInput] = useState('');
  const [formError, setFormError] = useState('');

  // Image upload state
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Pre-populate form values when editing
  useEffect(() => {
    if (ingredient) {
      setName(ingredient.name);
      setCategory(ingredient.category || 'Pantry');
      
      const purchaseUnit = ingredient.unitRelation.purchaseUnit;
      let cat: UnitCategory = 'weight';
      if (purchaseUnit === 'liter') {
        cat = 'volume';
      } else if (purchaseUnit === 'pack') {
        cat = 'count';
      }
      setUnitCategory(cat);

      const ratio = ingredient.unitRelation.conversionRatio;
      setMinThresholdInput((ingredient.minThreshold / ratio).toString());
      setInitialQtyInput((ingredient.currentStock / ratio).toString());
      setPurchaseCostInput('0');
      setSelectedImage(ingredient.image);
    } else {
      setName('');
      setCategory('Pantry');
      setUnitCategory('weight');
      setMinThresholdInput('');
      setInitialQtyInput('');
      setSelectedImage(null);
      setPurchaseCostInput('');
    }
    setFormError('');
  }, [ingredient, visible]);

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        dispatch(showToast({ message: 'We need gallery access to select a photo.', type: 'error', title: 'Permission Denied' }));
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setSelectedImage(result.assets[0].uri);
      }
    } catch (err) {
      console.error('Pick image error:', err);
      dispatch(showToast({ message: 'Failed to pick image.', type: 'error', title: 'Error' }));
    }
  };

  const handleCreateOrUpdate = async () => {
    if (!name || !minThresholdInput || !initialQtyInput || (!ingredient && !purchaseCostInput)) {
      setFormError('All fields are required.');
      return;
    }

    setFormError('');

    // Configure units based on selection
    let purchaseUnit: 'kg' | 'liter' | 'pack' = 'kg';
    let baseUnit: 'g' | 'ml' | 'pcs' = 'g';
    let ratio = 1000;

    if (unitCategory === 'volume') {
      purchaseUnit = 'liter';
      baseUnit = 'ml';
      ratio = 1000;
    } else if (unitCategory === 'count') {
      purchaseUnit = 'pack';
      baseUnit = 'pcs';
      ratio = 1; 
    }

    const rawThreshold = Number(minThresholdInput);
    const rawQty = Number(initialQtyInput);
    const rawCost = Number(purchaseCostInput);

    if (isNaN(rawThreshold) || isNaN(rawQty) || (!ingredient && isNaN(rawCost))) {
      setFormError('Numeric fields must contain valid numbers.');
      return;
    }

    // Convert values to base units
    const baseThreshold = rawThreshold * ratio;
    const baseQuantity = rawQty * ratio;

    setIsUploading(true);
    let uploadedImageUrl = undefined;

    try {
      // 1. Upload photo directly to Cloudinary if selected (and changed to a local URI)
      if (selectedImage && selectedImage.startsWith('file:')) {
        const sigResponse = await triggerGetSignature().unwrap();
        if (sigResponse.success) {
          const { signature, timestamp, apiKey, uploadUrl, folder } = sigResponse;

          const formData = new FormData();
          formData.append('file', {
            uri: selectedImage,
            type: 'image/jpeg',
            name: 'upload.jpg',
          } as any);
          formData.append('api_key', apiKey);
          formData.append('timestamp', timestamp.toString());
          formData.append('signature', signature);
          formData.append('folder', folder);

          const uploadResult = await fetch(uploadUrl, {
            method: 'POST',
            body: formData,
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'multipart/form-data',
            },
          });

          const uploadData = await uploadResult.json();
          if (uploadData.secure_url) {
            uploadedImageUrl = uploadData.secure_url;
          } else {
            setFormError('Cloudinary upload failed: ' + (uploadData.error?.message || 'Unknown error'));
            setIsUploading(false);
            return;
          }
        } else {
          setFormError('Failed to retrieve upload signature.');
          setIsUploading(false);
          return;
        }
      }

      // 2. Perform Create or Update API Request
      if (ingredient) {
        // Edit mode
        const result = await updateIngredient({
          id: ingredient._id,
          body: {
            name: name.trim(),
            category,
            minThreshold: baseThreshold,
            purchaseUnit,
            baseUnit,
            conversionRatio: ratio,
            currentStock: baseQuantity,
            image: uploadedImageUrl !== undefined ? uploadedImageUrl : (selectedImage || undefined)
          }
        }).unwrap();

        if (result.success) {
          onClose();
          dispatch(showToast({ message: 'Ingredient successfully updated!', type: 'success', title: 'Success' }));
        }
      } else {
        // Add mode
        const result = await createIngredient({
          name: name.trim(),
          category,
          minThreshold: baseThreshold,
          purchaseUnit,
          baseUnit,
          conversionRatio: ratio,
          initialQuantity: rawQty,
          purchaseCost: rawCost,
          image: uploadedImageUrl
        }).unwrap();

        if (result.success) {
          setName('');
          setUnitCategory('weight');
          setMinThresholdInput('');
          setInitialQtyInput('');
          setPurchaseCostInput('');
          setSelectedImage(null);
          onClose();
          dispatch(showToast({ message: 'Ingredient successfully added to inventory!', type: 'success', title: 'Success' }));
        }
      }
    } catch (err: any) {
      setFormError(err.data?.error || 'Failed to save ingredient.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    setFormError('');
    setSelectedImage(null);
    onClose();
  };

  // Unit Labels
  const getUnitLabels = () => {
    switch (unitCategory) {
      case 'weight':
        return { label: 'kg', sub: 'grams (g)' };
      case 'volume':
        return { label: 'liters', sub: 'milliliters (ml)' };
      case 'count':
        return { label: 'pcs', sub: 'pieces (pcs)' };
    }
  };

  const { label } = getUnitLabels();

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <View className="flex-1 bg-black/60 justify-end">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          className="w-full"
        >
          <View className="bg-card dark:bg-card-dark rounded-t-[32px] border-t border-border dark:border-border-dark px-6 pt-6 pb-10 shadow-2xl">
            {/* Modal Drag Handle */}
            <View className="w-12 h-1.5 bg-border dark:bg-border-dark rounded-full mx-auto mb-6" />

            {/* Modal Header */}
            <View className="flex-row justify-between items-center mb-6">
              <Text className="text-xl font-black text-text dark:text-text-dark">
                {ingredient ? 'Edit Ingredient' : 'Add New Ingredient'}
              </Text>
              <TouchableOpacity 
                onPress={handleClose}
                className="w-8 h-8 rounded-full bg-border/20 items-center justify-center"
              >
                <Ionicons name="close" size={20} color={muted} />
              </TouchableOpacity>
            </View>

            {formError ? (
              <View className="mb-4 bg-red-500/10 border border-red-500/20 p-3 rounded-xl">
                <Text className="text-red-500 text-xs font-bold text-center">{formError}</Text>
              </View>
            ) : null}

            {/* Form Input Fields */}
            <ScrollView 
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 16 }}
              style={{ maxHeight: 420 }}
              keyboardShouldPersistTaps="handled"
              scrollEventThrottle={16}
            >
              {/* Photo Selector */}
              <Text className="text-xs font-black text-text dark:text-text-dark mb-2 uppercase tracking-wider">
                Ingredient Photo
              </Text>
              
              <View className="items-center mb-5">
                {selectedImage ? (
                  <View className="relative w-full h-44 rounded-2xl overflow-hidden border border-border dark:border-border-dark">
                    <Image 
                      source={{ uri: selectedImage }} 
                      className="w-full h-full"
                      resizeMode="cover"
                    />
                    <TouchableOpacity 
                      onPress={() => setSelectedImage(null)}
                      activeOpacity={0.7}
                      className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/60 items-center justify-center"
                    >
                      <Ionicons name="trash-outline" size={16} color="#FFFFFF" />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity
                    onPress={pickImage}
                    activeOpacity={0.7}
                    className="w-full h-32 rounded-2xl border border-dashed border-border dark:border-border-dark bg-border/10 justify-center items-center"
                  >
                    <Ionicons name="camera-outline" size={28} color={muted} />
                    <Text className="text-xs font-semibold text-muted dark:text-muted-dark mt-2">
                      Upload from Gallery
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              <Input
                label="Ingredient Name"
                placeholder="e.g. Basmati Rice, Salted Butter"
                value={name}
                onChangeText={setName}
              />

              {/* Category Badge Selector */}
              <Text className="text-xs font-black text-text dark:text-text-dark mb-2 uppercase tracking-wider">
                Category Badge
              </Text>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false} 
                className="mb-5"
                contentContainerStyle={{ gap: 8, paddingVertical: 4 }}
              >
                {CATEGORIES.map((cat) => {
                  const isSelected = category === cat.name;
                  return (
                    <TouchableOpacity
                      key={cat.name}
                      onPress={() => setCategory(cat.name)}
                      activeOpacity={0.7}
                      className={`flex-row py-2 px-3 rounded-full border items-center ${
                        isSelected
                          ? 'bg-primary/10 border-primary'
                          : 'bg-border/20 border-border dark:border-border-dark'
                      }`}
                    >
                      <Text className="text-sm mr-1.5">{cat.icon}</Text>
                      <Text className={`text-xs font-bold ${isSelected ? 'text-primary' : 'text-muted dark:text-muted-dark'}`}>
                        {cat.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {/* Unit Category Selector */}
              <Text className="text-xs font-black text-text dark:text-text-dark mb-2 uppercase tracking-wider">
                Unit Category
              </Text>
              <View className="flex-row mb-5" style={{ gap: 8 }}>
                <TouchableOpacity
                  onPress={() => setUnitCategory('weight')}
                  activeOpacity={0.7}
                  className={`flex-1 py-3 px-2 rounded-xl border items-center justify-center flex-row ${
                    unitCategory === 'weight'
                      ? 'bg-primary/10 border-primary'
                      : 'bg-border/20 border-border dark:border-border-dark'
                  }`}
                >
                  <Ionicons name="scale-outline" size={16} color={unitCategory === 'weight' ? primary : muted} style={{ marginRight: 6 }} />
                  <Text className={`text-xs font-bold ${unitCategory === 'weight' ? 'text-primary' : 'text-muted dark:text-muted-dark'}`}>
                    Weight (kg)
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setUnitCategory('volume')}
                  activeOpacity={0.7}
                  className={`flex-1 py-3 px-2 rounded-xl border items-center justify-center flex-row ${
                    unitCategory === 'volume'
                      ? 'bg-primary/10 border-primary'
                      : 'bg-border/20 border-border dark:border-border-dark'
                  }`}
                >
                  <Ionicons name="water-outline" size={16} color={unitCategory === 'volume' ? primary : muted} style={{ marginRight: 6 }} />
                  <Text className={`text-xs font-bold ${unitCategory === 'volume' ? 'text-primary' : 'text-muted dark:text-muted-dark'}`}>
                    Volume (L)
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setUnitCategory('count')}
                  activeOpacity={0.7}
                  className={`flex-1 py-3 px-2 rounded-xl border items-center justify-center flex-row ${
                    unitCategory === 'count'
                      ? 'bg-primary/10 border-primary'
                      : 'bg-border/20 border-border dark:border-border-dark'
                  }`}
                >
                  <Ionicons name="cube-outline" size={16} color={unitCategory === 'count' ? primary : muted} style={{ marginRight: 6 }} />
                  <Text className={`text-xs font-bold ${unitCategory === 'count' ? 'text-primary' : 'text-muted dark:text-muted-dark'}`}>
                    Count (pcs)
                  </Text>
                </TouchableOpacity>
              </View>

              <Input
                label={ingredient ? `Current Stock Quantity (${label})` : `Initial Stock Quantity (${label})`}
                placeholder={`e.g. 10`}
                value={initialQtyInput}
                onChangeText={setInitialQtyInput}
                keyboardType="numeric"
              />

              <Input
                label={`Alert Threshold (${label})`}
                placeholder={`e.g. 2`}
                value={minThresholdInput}
                onChangeText={setMinThresholdInput}
                keyboardType="numeric"
              />

              {!ingredient && (
                <Input
                  label="Total Purchase Cost (₹)"
                  placeholder="e.g. 1200"
                  value={purchaseCostInput}
                  onChangeText={setPurchaseCostInput}
                  keyboardType="numeric"
                />
              )}
            </ScrollView>

            {/* Submit Button */}
            <Button
              label={isUploading ? "Uploading Image..." : (ingredient ? "Save Changes" : "Add Ingredient")}
              onPress={handleCreateOrUpdate}
              loading={isCreating || isUpdating || isUploading || isFetchingSignature}
              className="mt-4 shadow-lg shadow-primary/20"
            />
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}
