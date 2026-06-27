import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Card from '../../../components/Card';
import { useThemeColors } from '../../../hooks/useThemeColors';
import { TenantData } from '../superadminApi';

interface OwnerCardProps {
  tenant: TenantData;
  onToggleStatus: (id: string, currentStatus: 'active' | 'deactivated') => void;
  onManageWorkspace: (tenant: TenantData) => void;
  isToggling: boolean;
}

export default function OwnerCard({
  tenant,
  onToggleStatus,
  onManageWorkspace,
  isToggling,
}: OwnerCardProps) {
  const { muted, primary } = useThemeColors();
  const ownerName =
    typeof tenant.ownerId === 'object' && tenant.ownerId !== null
      ? tenant.ownerId.name
      : 'N/A';
  const ownerEmail =
    typeof tenant.ownerId === 'object' && tenant.ownerId !== null
      ? tenant.ownerId.email
      : 'N/A';
  const ownerStatus =
    typeof tenant.ownerId === 'object' && tenant.ownerId !== null
      ? tenant.ownerId.status
      : null;

  return (
    <Card className="p-5">
      <View className="flex-row justify-between items-start">
        <View className="flex-1 pr-4">
          <Text className="text-base font-semibold text-text dark:text-text-dark leading-tight">
            {tenant.businessName}
          </Text>
          <View className="flex-row items-center mt-1.5" style={{ gap: 6 }}>
            <Ionicons name="person-outline" size={12} color={muted} />
            <Text className="text-xs text-muted dark:text-muted-dark font-semibold">
              {ownerName}
            </Text>
            {ownerStatus ? (
              <View
                className={`px-1.5 py-0.5 rounded ${
                  ownerStatus === 'active' ? 'bg-emerald-500/10' : 'bg-red-500/10'
                }`}
              >
                <Text
                  className={`text-[8px] font-semibold uppercase ${
                    ownerStatus === 'active' ? 'text-emerald-500' : 'text-red-500'
                  }`}
                >
                  {ownerStatus}
                </Text>
              </View>
            ) : null}
          </View>
          <View className="flex-row items-center mt-1" style={{ gap: 6 }}>
            <Ionicons name="mail-outline" size={12} color={muted} />
            <Text className="text-xs text-muted dark:text-muted-dark font-medium">
              {ownerEmail}
            </Text>
          </View>
        </View>

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
          <View
            className={`w-2 h-2 rounded-full ${
              tenant.status === 'active' ? 'bg-emerald-500' : 'bg-red-500'
            }`}
            style={{ marginRight: 8 }}
          />
          <Text
            className={`text-[10px] font-semibold tracking-normalr ${
              tenant.status === 'active' ? 'text-emerald-500' : 'text-red-500'
            }`}
          >
            {tenant.status === 'active' ? 'Active' : 'Locked'}
          </Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        onPress={() => onManageWorkspace(tenant)}
        activeOpacity={0.85}
        className="mt-4 w-full py-3.5 rounded-2xl bg-primary/10 border border-primary/25 flex-row items-center justify-center"
      >
        <Ionicons name="open-outline" size={16} color={primary} style={{ marginRight: 8 }} />
        <Text className="text-xs font-semibold uppercase text-primary tracking-wider">
          Manage Kitchen Workspace
        </Text>
      </TouchableOpacity>
    </Card>
  );
}
