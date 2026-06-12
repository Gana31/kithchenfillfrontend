import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Card from '../../../components/Card';
import { useThemeColors } from '../../../hooks/useThemeColors';

interface Tenant {
  _id: string;
  businessName: string;
  status: 'active' | 'deactivated';
  ownerId?: {
    name: string;
    email: string;
  };
}

interface OwnerCardProps {
  tenant: Tenant;
  onToggleStatus: (id: string, currentStatus: 'active' | 'deactivated') => void;
  isToggling: boolean;
}

export default function OwnerCard({ tenant, onToggleStatus, isToggling }: OwnerCardProps) {
  const { muted } = useThemeColors();

  return (
    <Card className="p-5">
      <View className="flex-row justify-between items-start">
        <View className="flex-1 pr-4">
          <Text className="text-base font-black text-text dark:text-text-dark leading-tight">
            {tenant.businessName}
          </Text>
          <View className="flex-row items-center mt-1.5 space-x-1.5" style={{ gap: 6 }}>
            <Ionicons name="person-outline" size={12} color={muted} />
            <Text className="text-xs text-muted dark:text-muted-dark font-semibold">
              {tenant.ownerId?.name || 'N/A'}
            </Text>
          </View>
          <View className="flex-row items-center mt-1 space-x-1.5" style={{ gap: 6 }}>
            <Ionicons name="mail-outline" size={12} color={muted} />
            <Text className="text-xs text-muted dark:text-muted-dark font-medium">
              {tenant.ownerId?.email || 'N/A'}
            </Text>
          </View>
        </View>

        {/* Active Status Toggle Button */}
        <TouchableOpacity
          onPress={() => onToggleStatus(tenant._id, tenant.status)}
          disabled={isToggling}
          activeOpacity={0.7}
          className={`px-4 py-2 rounded-xl flex-row items-center justify-center border ${
            tenant.status === 'active'
              ? 'bg-emerald-500/10 border-emerald-500/20'
              : 'bg-red-500/10 border-red-500/20'
          }`}
          style={{ minWidth: 110 }}
        >
          <View className={`w-2 h-2 rounded-full ${
            tenant.status === 'active' ? 'bg-emerald-500' : 'bg-red-500'
          }`} style={{ marginRight: 8 }} />
          <Text className={`text-[10px] font-black uppercase tracking-wider ${
            tenant.status === 'active' ? 'text-emerald-500' : 'text-red-500'
          }`}>
            {tenant.status === 'active' ? 'Active' : 'Locked'}
          </Text>
        </TouchableOpacity>
      </View>
    </Card>
  );
}
