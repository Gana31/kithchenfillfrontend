import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import SearchBar from '../../components/SearchBar';
import { useThemeColors } from '../../hooks/useThemeColors';
import ScreenContainer from '../../components/ScreenContainer';
import FloatingActionButton from '../../components/FloatingActionButton';
import { LoadingView, ErrorState, EmptyStateCard } from '../../components/AsyncStateViews';
import { useGetUdhaarsQuery, useUpdateUdhaarMutation, useDeleteUdhaarMutation, UdhaarData } from './udhaarApi';
import { useAppDispatch } from '../../store/store';
import { showToast } from '../../store/toastSlice';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { formatInr } from '../dashboard/dashboardUtils';
import { SCROLL_LIST_PROPS, LIST_VIRTUALIZATION_PROPS } from '../../components/scrollUtils';

export default function UdhaarScreen() {
  const navigation = useNavigation<any>();
  const dispatch = useAppDispatch();
  const { primary, muted, text, card, border, background, isDark } = useThemeColors();
  const insets = useSafeAreaInsets();
  
  // Filter state
  const [activeTab, setActiveTab] = useState<'all' | 'unpaid' | 'paid' | 'cancelled'>('unpaid');
  const [searchQuery, setSearchQuery] = useState('');

  // Queries
  const { data, isLoading, error, refetch, isFetching } = useGetUdhaarsQuery(undefined, {
    refetchOnMountOrArgChange: true,
  });
  const [updateUdhaar] = useUpdateUdhaarMutation();
  const [deleteUdhaar] = useDeleteUdhaarMutation();

  const udhaars = data?.udhaars ?? [];

  // Filtered logs
  const filteredUdhaars = useMemo(() => {
    let result = udhaars;
    
    // 1. Status Filter
    if (activeTab !== 'all') {
      result = result.filter((u) => u.status === activeTab);
    }
    
    // 2. Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (u) =>
          u.customerName.toLowerCase().includes(q) ||
          u.plateName.toLowerCase().includes(q) ||
          (u.notes && u.notes.toLowerCase().includes(q))
      );
    }
    
    return result;
  }, [udhaars, activeTab, searchQuery]);

  const handleMarkPaid = async (udhaar: UdhaarData) => {
    try {
      await updateUdhaar({ id: udhaar._id, body: { status: 'paid' } }).unwrap();
      dispatch(
        showToast({
          title: 'Udhaar Cleared',
          message: `Dues of ${udhaar.customerName} marked as paid.`,
          type: 'success',
        })
      );
    } catch (err: any) {
      dispatch(
        showToast({
          title: 'Update failed',
          message: err?.data?.error || 'Could not update status.',
          type: 'error',
        })
      );
    }
  };

  const handleCancelUdhaar = async (udhaar: UdhaarData) => {
    Alert.alert('Cancel Udhaar?', `Cancel credit log for "${udhaar.customerName}"?`, [
      { text: 'No', style: 'cancel' },
      {
        text: 'Yes, Cancel',
        style: 'destructive',
        onPress: async () => {
          try {
            await updateUdhaar({ id: udhaar._id, body: { status: 'cancelled' } }).unwrap();
            dispatch(
              showToast({
                title: 'Udhaar Cancelled',
                message: `Dues of ${udhaar.customerName} cancelled.`,
                type: 'success',
              })
            );
          } catch (err: any) {
            dispatch(
              showToast({
                title: 'Cancellation failed',
                message: err?.data?.error || 'Could not cancel record.',
                type: 'error',
              })
            );
          }
        },
      },
    ]);
  };

  const confirmDelete = (udhaar: UdhaarData) => {
    Alert.alert('Delete Udhaar record?', `Permanently delete record for "${udhaar.customerName}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteUdhaar(udhaar._id).unwrap();
            dispatch(showToast({ title: 'Record deleted', message: udhaar.customerName, type: 'success' }));
          } catch (err: any) {
            dispatch(
              showToast({
                title: 'Delete failed',
                message: err?.data?.error || 'Could not delete record.',
                type: 'error',
              })
            );
          }
        },
      },
    ]);
  };

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  const renderItem = ({ item }: { item: UdhaarData }) => {
    let statusColor = '#ef4444'; // unpaid
    let statusBg = '#ef444415';
    let statusText = 'Unpaid';

    if (item.status === 'paid') {
      statusColor = '#10b981';
      statusBg = '#10b98115';
      statusText = 'Paid';
    } else if (item.status === 'cancelled') {
      statusColor = '#71717a';
      statusBg = '#71717a15';
      statusText = 'Cancelled';
    }

    return (
      <View
        style={{
          backgroundColor: card,
          borderColor: border,
          borderWidth: 1,
          borderRadius: 16,
          padding: 16,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.05,
          shadowRadius: 8,
          elevation: 2,
        }}
      >
        <View className="flex-row justify-between items-start mb-2">
          <View className="flex-1 mr-2">
            <Text className="text-base font-bold text-text dark:text-text-dark">
              {item.customerName}
            </Text>
            <Text className="text-xs text-muted dark:text-muted-dark mt-0.5 font-medium">
              Plate: <Text className="text-text dark:text-text-dark">{item.plateName}</Text>
            </Text>
            <Text className="text-[10px] text-muted dark:text-muted-dark mt-1 font-semibold">
              {formatDate(item.createdAt)}
            </Text>
          </View>

          <View className="items-end">
            <Text className="text-lg font-black text-primary mb-1">
              {formatInr(item.amount)}
            </Text>
            <View
              className="px-2 py-0.5 rounded-full border"
              style={{ borderColor: `${statusColor}30`, backgroundColor: statusBg }}
            >
              <Text className="text-[9px] font-extrabold" style={{ color: statusColor }}>
                {statusText}
              </Text>
            </View>
          </View>
        </View>

        {item.notes ? (
          <View className="bg-muted/10 dark:bg-muted-dark/5 rounded-xl px-3 py-2 mt-2 border border-border dark:border-border-dark">
            <Text className="text-xs italic text-muted dark:text-muted-dark leading-relaxed">
              Note: "{item.notes}"
            </Text>
          </View>
        ) : null}

        {/* Action Buttons */}
        <View className="flex-row justify-between items-center border-t border-border dark:border-border-dark mt-3 pt-3">
          <TouchableOpacity
            onPress={() => confirmDelete(item)}
            className="w-8 h-8 rounded-xl bg-red-500/10 border border-red-500/20 items-center justify-center"
            activeOpacity={0.7}
          >
            <Ionicons name="trash-outline" size={15} color="#ef4444" />
          </TouchableOpacity>

          {item.status === 'unpaid' && (
            <View className="flex-row" style={{ gap: 8 }}>
              <TouchableOpacity
                onPress={() => handleCancelUdhaar(item)}
                className="px-3 py-1.5 rounded-xl border border-muted/30 bg-card items-center justify-center"
                activeOpacity={0.7}
              >
                <Text className="text-[11px] font-extrabold text-muted">Cancel Log</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleMarkPaid(item)}
                className="px-4 py-1.5 rounded-xl bg-green-500 items-center justify-center flex-row"
                activeOpacity={0.7}
              >
                <Ionicons name="checkmark-circle-outline" size={12} color="#fff" style={{ marginRight: 4 }} />
                <Text className="text-[11px] font-extrabold text-white">Mark Paid</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    );
  };

  const renderEmpty = () => {
    if (isLoading) {
      return <LoadingView message="Loading udhaar logs…" />;
    }
    if (error) {
      return <ErrorState message="Could not load logs. Tap to retry." onRetry={refetch} />;
    }
    if (searchQuery.trim().length > 0) {
      return (
        <View className="items-center py-10">
          <Ionicons name="search-outline" size={32} color={muted} />
          <Text className="text-sm font-bold text-muted dark:text-muted-dark mt-3">
            No udhaars match "{searchQuery}"
          </Text>
        </View>
      );
    }
    return (
      <EmptyStateCard
        icon="cash-outline"
        title="No udhaars found"
        message="Log credits when a customer takes a plate/portion and wants to pay later."
        actionLabel="Log Udhaar"
        onAction={() => navigation.navigate('AddUdhaar')}
      />
    );
  };

  return (
    <ScreenContainer>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <View className="flex-1">
        {/* Tab Badges */}
        <View className="px-6 pt-3 flex-row justify-between" style={{ gap: 6 }}>
          {(['unpaid', 'paid', 'cancelled', 'all'] as const).map((tab) => (
            <TouchableOpacity
              key={tab}
              onPress={() => setActiveTab(tab)}
              className={`flex-1 py-2 items-center rounded-xl border ${
                activeTab === tab
                  ? 'bg-primary border-primary'
                  : 'bg-card dark:bg-card-dark border-border dark:border-border-dark'
              }`}
              activeOpacity={0.8}
            >
              <Text
                style={{
                  fontSize: 10,
                  fontWeight: '800',
                  textTransform: 'uppercase',
                  letterSpacing: 0.3,
                  color: activeTab === tab ? '#fff' : muted,
                }}
              >
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Toolbar */}
        {(udhaars.length > 0 || searchQuery.trim().length > 0) && (
          <View className="px-6 pt-3 flex-row items-center justify-between" style={{ gap: 8 }}>
            <View className="flex-1">
              <SearchBar
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search by customer or plate..."
              />
            </View>
            <TouchableOpacity
              onPress={refetch}
              disabled={isFetching}
              activeOpacity={0.7}
              className="w-10 h-10 rounded-xl border border-border dark:border-border-dark bg-card dark:bg-card-dark justify-center items-center"
            >
              {isFetching ? (
                <ActivityIndicator size="small" color={primary} />
              ) : (
                <Ionicons name="refresh-outline" size={18} color={muted} />
              )}
            </TouchableOpacity>
          </View>
        )}

        <FlatList
          data={filteredUdhaars}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          ListEmptyComponent={renderEmpty()}
          contentContainerStyle={{
            gap: 16,
            paddingHorizontal: 24,
            paddingTop: 16,
            paddingBottom: insets.bottom + 120,
            flexGrow: 1,
          }}
          {...SCROLL_LIST_PROPS}
          {...LIST_VIRTUALIZATION_PROPS}
        />

        <FloatingActionButton onPress={() => navigation.navigate('AddUdhaar')} icon="add" />
      </View>
    </ScreenContainer>
  );
}
