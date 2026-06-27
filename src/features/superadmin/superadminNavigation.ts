import { AppDispatch } from '../../store/store';
import { startImpersonation } from '../auth/authSlice';
import { baseApi } from '../../services/api';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SuperadminRootStackParamList } from '../../navigation/superadminNavigation.types';
import { TenantData } from './superadminApi';

type SuperadminStackNav = NativeStackNavigationProp<SuperadminRootStackParamList>;

export function openOwnerWorkspace(
  navigation: { getParent: () => { navigate: SuperadminStackNav['navigate'] } | undefined },
  tenant: Pick<TenantData, '_id' | 'businessName'> & {
    ownerId?: { email?: string } | null;
  },
  dispatch: AppDispatch
) {
  dispatch(
    startImpersonation({
      tenantId: tenant._id,
      businessName: tenant.businessName,
      ownerEmail: tenant.ownerId?.email ?? null,
    })
  );
  dispatch(baseApi.util.resetApiState());

  const stackNav = navigation.getParent();
  if (!stackNav) return;

  stackNav.navigate('OwnerWorkspace', {
    tenantId: tenant._id,
    businessName: tenant.businessName,
    ownerEmail: tenant.ownerId?.email,
  });
}
