import React, { useLayoutEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAppDispatch, useAppSelector } from '../../store/store';
import {
  startImpersonation,
  stopImpersonation,
  selectActiveTenantId,
} from '../auth/authSlice';
import { baseApi } from '../../services/api';
import ImpersonationBanner from '../../components/ImpersonationBanner';
import OwnerWorkspaceNavigator from '../../navigation/OwnerWorkspaceNavigator';
import { SuperadminRootStackParamList } from '../../navigation/superadminNavigation.types';
import { useThemeColors } from '../../hooks/useThemeColors';

type Props = NativeStackScreenProps<SuperadminRootStackParamList, 'OwnerWorkspace'>;

export default function OwnerWorkspaceScreen({ route, navigation }: Props) {
  const dispatch = useAppDispatch();
  const { tenantId, businessName, ownerEmail } = route.params;
  const activeTenantId = useAppSelector(selectActiveTenantId);
  const { primary } = useThemeColors();

  useLayoutEffect(() => {
    dispatch(
      startImpersonation({
        tenantId,
        businessName,
        ownerEmail: ownerEmail ?? null,
      })
    );

    return () => {
      dispatch(stopImpersonation());
      dispatch(baseApi.util.resetApiState());
    };
  }, [dispatch, tenantId, businessName, ownerEmail]);

  const handleExit = () => {
    navigation.goBack();
  };

  const isTenantReady = activeTenantId === tenantId;

  return (
    <View className="flex-1">
      <ImpersonationBanner onExit={handleExit} />
      <View className="flex-1">
        {isTenantReady ? (
          <OwnerWorkspaceNavigator />
        ) : (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color={primary} />
          </View>
        )}
      </View>
    </View>
  );
}
