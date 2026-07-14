import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Modal,
  ScrollView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Input from '../../../components/Input';
import Button from '../../../components/Button';
import { LoadingView } from '../../../components/AsyncStateViews';
import { useGetPlatesQuery } from '../../plates/platesApi';
import { useCreateUdhaarMutation, useGetUdhaarsQuery } from '../udhaarApi';
import { useThemeColors } from '../../../hooks/useThemeColors';
import { useAppDispatch } from '../../../store/store';
import { showToast } from '../../../store/toastSlice';
import { formatInr, parseDecimalInput } from '../../dashboard/dashboardUtils';
import { OwnerRootStackParamList } from '../../../navigation/ownerNavigation.types';
import { SCROLL_LIST_PROPS, LIST_VIRTUALIZATION_PROPS } from '../../../components/scrollUtils';

export default function AddUdhaarScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<OwnerRootStackParamList, 'AddUdhaar'>>();
  const insets = useSafeAreaInsets();
  const { primary, muted, text, card, border, background, isDark } = useThemeColors();
  const dispatch = useAppDispatch();

  // Queries
  const { data: platesData, isLoading: platesLoading } = useGetPlatesQuery();
  const { data: udhaarRes } = useGetUdhaarsQuery();
  const [createUdhaar, { isLoading: isSaving }] = useCreateUdhaarMutation();

  const plates = platesData?.plates ?? [];
  const udhaars = udhaarRes?.udhaars ?? [];

  // Form states
  const [customerName, setCustomerName] = useState('');
  const [selectedPlateId, setSelectedPlateId] = useState<string | null>(null);
  const [plateName, setPlateName] = useState('Custom item');
  const [amount, setAmount] = useState('0');
  const [status, setStatus] = useState<'unpaid' | 'paid'>('unpaid');
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState('');
  const [showPlateModal, setShowPlateModal] = useState(false);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [isCustomCustomer, setIsCustomCustomer] = useState(true);

  // Extract unique customer names
  const existingCustomers = useMemo(() => {
    const names = udhaars.map((u) => u.customerName.trim());
    return [...new Set(names)].filter(Boolean).sort();
  }, [udhaars]);

  // Set initial customer choice
  React.useEffect(() => {
    if (existingCustomers.length > 0 && !customerName) {
      setIsCustomCustomer(false);
      setCustomerName(existingCustomers[0]);
    } else if (existingCustomers.length === 0) {
      setIsCustomCustomer(true);
    }
  }, [existingCustomers]);

  const activePlate = useMemo(() => {
    if (!selectedPlateId) return null;
    return plates.find((p) => p._id === selectedPlateId) || null;
  }, [selectedPlateId, plates]);

  const handleSelectPlate = (id: string | null) => {
    setSelectedPlateId(id);
    setShowPlateModal(false);
    if (id) {
      const plate = plates.find((p) => p._id === id);
      if (plate) {
        setPlateName(plate.name);
        setAmount(String(plate.sellPrice));
      }
    } else {
      setPlateName('Custom plate/item');
      setAmount('0');
    }
  };

  const handleSubmit = async () => {
    setFormError('');
    if (!customerName.trim()) {
      setFormError('Customer name is required.');
      return;
    }
    if (!plateName.trim()) {
      setFormError('Plate or item name is required.');
      return;
    }
    const amountVal = parseDecimalInput(amount);
    if (amountVal === undefined || amountVal < 0) {
      setFormError('Amount must be 0 or more.');
      return;
    }

    try {
      await createUdhaar({
        customerName: customerName.trim(),
        plateId: selectedPlateId || undefined,
        plateName: plateName.trim(),
        amount: amountVal,
        status: status,
        notes: notes.trim() || undefined,
      }).unwrap();

      dispatch(
        showToast({
          title: 'Udhaar logged',
          message: `Logged dues for ${customerName.trim()} — ${formatInr(amountVal)}`,
          type: 'success',
        })
      );
      navigation.goBack();
    } catch (err: any) {
      setFormError(err?.data?.error || 'Could not log credit record.');
    }
  };

  const listHeader = (
    <View style={{ gap: 12 }}>
      {existingCustomers.length > 0 && (
        <View style={{ marginBottom: 6 }}>
          <Text style={[styles.fieldLabel, { color: muted }]}>Select Customer</Text>
          <TouchableOpacity
            onPress={() => setShowCustomerModal(true)}
            style={[styles.pickerTrigger, { borderColor: border, backgroundColor: card }]}
          >
            <View className="flex-row items-center">
              <Ionicons
                name="person-outline"
                size={18}
                color={!isCustomCustomer ? primary : muted}
                style={{ marginRight: 8 }}
              />
              <Text style={{ color: !isCustomCustomer ? text : muted, fontWeight: '600' }}>
                {!isCustomCustomer ? customerName : 'New Customer (Add Custom Name)'}
              </Text>
            </View>
            <Ionicons name="chevron-down" size={16} color={muted} />
          </TouchableOpacity>
        </View>
      )}

      {isCustomCustomer && (
        <Input
          label="Customer Name"
          value={customerName}
          onChangeText={setCustomerName}
          placeholder="e.g. Rahul Sharma"
        />
      )}

      {/* Plate Picker */}
      <View style={{ marginBottom: 6 }}>
        <Text style={[styles.fieldLabel, { color: muted }]}>Select Portion Plate</Text>
        <TouchableOpacity
          onPress={() => setShowPlateModal(true)}
          style={[styles.pickerTrigger, { borderColor: border, backgroundColor: card }]}
        >
          <View className="flex-row items-center">
            <Ionicons
              name={selectedPlateId ? 'fast-food-outline' : 'cash-outline'}
              size={18}
              color={selectedPlateId ? primary : muted}
              style={{ marginRight: 8 }}
            />
            <Text style={{ color: selectedPlateId ? text : muted, fontWeight: '600' }}>
              {activePlate ? activePlate.name : 'Custom Amount (No Plate)'}
            </Text>
          </View>
          <Ionicons name="chevron-down" size={16} color={muted} />
        </TouchableOpacity>
      </View>

      <Input
        label="Plate/Item Name"
        value={plateName}
        onChangeText={setPlateName}
        placeholder="e.g. 1 Plate Biryani"
        editable={!selectedPlateId}
      />

      <Input
        label="Due Amount (₹)"
        value={amount}
        onChangeText={setAmount}
        keyboardType="decimal-pad"
        placeholder="100"
      />

      {/* Status Switcher */}
      <View style={{ marginBottom: 6 }}>
        <Text style={[styles.fieldLabel, { color: muted }]}>Initial Payment Status</Text>
        <View className="flex-row bg-card dark:bg-card-dark border border-border dark:border-border-dark rounded-xl p-1 h-[48px]" style={{ gap: 4 }}>
          <TouchableOpacity
            onPress={() => setStatus('unpaid')}
            className={`flex-1 justify-center items-center rounded-lg ${status === 'unpaid' ? 'bg-red-500' : ''}`}
          >
            <Text style={{ fontSize: 13, fontWeight: '800', color: status === 'unpaid' ? '#fff' : muted }}>
              UNPAID (DUES)
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setStatus('paid')}
            className={`flex-1 justify-center items-center rounded-lg ${status === 'paid' ? 'bg-green-500' : ''}`}
          >
            <Text style={{ fontSize: 13, fontWeight: '800', color: status === 'paid' ? '#fff' : muted }}>
              PAID (CLEARED)
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <Input
        label="Notes/Remark"
        value={notes}
        onChangeText={setNotes}
        placeholder="e.g. Rahul will pay this Friday by GPay"
        multiline
        numberOfLines={2}
      />

      {formError ? <Text className="text-sm font-bold text-red-500 mt-2">{formError}</Text> : null}

      <View style={{ marginTop: 12 }}>
        <Button label="Save Credit Log" onPress={handleSubmit} loading={isSaving} />
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
        <Text style={[styles.topTitle, { color: text }]}>Log Udhaar Credit</Text>
        <View style={styles.backBtn} />
      </View>

      {platesLoading ? (
        <LoadingView message="Loading plates list…" />
      ) : (
        <FlatList
          data={[]}
          renderItem={null}
          ListHeaderComponent={listHeader}
          contentContainerStyle={{
            paddingHorizontal: 24,
            paddingTop: 16,
            paddingBottom: insets.bottom + 24,
          }}
          {...SCROLL_LIST_PROPS}
          {...LIST_VIRTUALIZATION_PROPS}
        />
      )}

      {/* Plate Selection Modal */}
      <Modal visible={showPlateModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: background, borderColor: border }]}>
            <View className="flex-row justify-between items-center px-6 py-4 border-b border-border dark:border-border-dark">
              <Text style={{ fontSize: 16, fontWeight: 'bold', color: text }}>Select Portion Plate</Text>
              <TouchableOpacity onPress={() => setShowPlateModal(false)}>
                <Ionicons name="close" size={20} color={text} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              onPress={() => handleSelectPlate(null)}
              className="flex-row items-center px-6 py-4 border-b border-border dark:border-border-dark"
            >
              <Ionicons name="cash-outline" size={18} color={muted} style={{ marginRight: 12 }} />
              <Text style={{ fontSize: 14, color: text, fontWeight: '600' }}>
                Custom Amount (No Plate)
              </Text>
            </TouchableOpacity>

            <FlatList
              data={plates}
              keyExtractor={(p) => p._id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => handleSelectPlate(item._id)}
                  className="flex-row justify-between items-center px-6 py-4 border-b border-border dark:border-border-dark"
                >
                  <View>
                    <Text style={{ fontSize: 14, color: text, fontWeight: '600' }}>{item.name}</Text>
                    <Text style={{ fontSize: 11, color: muted, marginTop: 2 }}>
                      Portion: {item.size} {item.unit} · Standard Price: {formatInr(item.sellPrice)}
                    </Text>
                  </View>
                  {selectedPlateId === item._id && (
                    <Ionicons name="checkmark" size={18} color={primary} />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

      {/* Customer Selection Modal */}
      <Modal visible={showCustomerModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: background, borderColor: border }]}>
            <View className="flex-row justify-between items-center px-6 py-4 border-b border-border dark:border-border-dark">
              <Text style={{ fontSize: 16, fontWeight: 'bold', color: text }}>Select Customer</Text>
              <TouchableOpacity onPress={() => setShowCustomerModal(false)}>
                <Ionicons name="close" size={20} color={text} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              onPress={() => {
                setIsCustomCustomer(true);
                setCustomerName('');
                setShowCustomerModal(false);
              }}
              className="flex-row items-center px-6 py-4 border-b border-border dark:border-border-dark"
            >
              <Ionicons name="add-circle-outline" size={18} color={primary} style={{ marginRight: 12 }} />
              <Text style={{ fontSize: 14, color: primary, fontWeight: '700' }}>
                + Add New Customer
              </Text>
            </TouchableOpacity>

            <FlatList
              data={existingCustomers}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => {
                    setIsCustomCustomer(false);
                    setCustomerName(item);
                    setShowCustomerModal(false);
                  }}
                  className="flex-row justify-between items-center px-6 py-4 border-b border-border dark:border-border-dark"
                >
                  <Text style={{ fontSize: 14, color: text, fontWeight: '600' }}>{item}</Text>
                  {!isCustomCustomer && customerName === item && (
                    <Ionicons name="checkmark" size={18} color={primary} />
                  )}
                </TouchableOpacity>
              )}
              contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
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
  dropdownOverlay: {
    position: 'absolute',
    top: 76,
    left: 0,
    right: 0,
    borderRadius: 12,
    borderWidth: 1,
    zIndex: 9999,
    elevation: 5,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    overflow: 'hidden',
  },
  dropdownItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
});
