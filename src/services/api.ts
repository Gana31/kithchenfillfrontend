import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { BaseQueryFn, FetchArgs, FetchBaseQueryError } from '@reduxjs/toolkit/query';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../config/constants';
import { setCredentials, logout } from '../features/auth/authSlice';

interface StateWithAuth {
  auth: {
    token: string | null;
    refreshToken: string | null;
    tenantId: string | null;
    tokenExpiry: number | null;
    refreshTokenExpiry: number | null;
    user: any;
  };
}

const baseQuery = fetchBaseQuery({
  baseUrl: API_BASE_URL,
  prepareHeaders: (headers, { getState }) => {
    const state = getState() as StateWithAuth;
    const token = state.auth?.token;
    const tenantId = state.auth?.tenantId;

    if (token) {
      headers.set('authorization', `Bearer ${token}`);
    }

    if (tenantId) {
      headers.set('x-tenant-id', tenantId);
    }

    if (!headers.has('content-type')) {
      headers.set('content-type', 'application/json');
    }

    return headers;
  },
});

// Mutex lock to prevent multiple simultaneous refresh calls
let isRefreshing = false;

export const baseQueryWithReauth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  let state = api.getState() as StateWithAuth;
  const token = state.auth?.token;
  const refreshToken = state.auth?.refreshToken;
  const tokenExpiry = state.auth?.tokenExpiry;
  const refreshTokenExpiry = state.auth?.refreshTokenExpiry;

  // 0. Check if refresh token is already expired
  if (refreshTokenExpiry && Date.now() >= refreshTokenExpiry) {
    console.log('RTK Query: Stored refresh token has expired. Logging out.');
    api.dispatch(logout());
    await AsyncStorage.removeItem('auth-session');
    return {
      error: {
        status: 401,
        statusText: 'Unauthorized',
        data: { error: 'Session expired' },
      } as FetchBaseQueryError,
    };
  }

  // 1. Pre-emptively check if the token has expired
  if (token && tokenExpiry && Date.now() > tokenExpiry) {
    if (!isRefreshing && refreshToken) {
      isRefreshing = true;
      try {
        console.log('RTK Query: Pre-emptive access token refresh triggered...');
        const refreshResult = await fetch(`${API_BASE_URL}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken }),
        });

        const data = await refreshResult.json();
        if (data.success && data.accessToken) {
          const updatedSession = {
            token: data.accessToken,
            refreshToken: data.refreshToken || refreshToken,
            user: state.auth.user,
            tokenExpiry: data.accessTokenExpiry,
            refreshTokenExpiry: data.refreshTokenExpiry || refreshTokenExpiry,
          };

          // Update Redux state and AsyncStorage
          api.dispatch(setCredentials(updatedSession));
          await AsyncStorage.setItem('auth-session', JSON.stringify(updatedSession));
        } else {
          // Token expired on server, perform logout
          api.dispatch(logout());
          await AsyncStorage.removeItem('auth-session');
        }
      } catch (err) {
        console.error('Failed to auto-refresh access token:', err);
      } finally {
        isRefreshing = false;
      }
    }
  }

  // 2. Run original query
  let result = await baseQuery(args, api, extraOptions);

  // 3. Fallback: if we get a 401 response, try to refresh again on-demand
  if (result.error && result.error.status === 401) {
    state = api.getState() as StateWithAuth;
    const latestRefreshToken = state.auth?.refreshToken;
    const latestRefreshTokenExpiry = state.auth?.refreshTokenExpiry;

    if (latestRefreshTokenExpiry && Date.now() >= latestRefreshTokenExpiry) {
      api.dispatch(logout());
      await AsyncStorage.removeItem('auth-session');
      return result;
    }

    if (latestRefreshToken && !isRefreshing) {
      isRefreshing = true;
      try {
        const refreshResult = await fetch(`${API_BASE_URL}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken: latestRefreshToken }),
        });

        const data = await refreshResult.json();
        if (data.success && data.accessToken) {
          const updatedSession = {
            token: data.accessToken,
            refreshToken: data.refreshToken || latestRefreshToken,
            user: state.auth.user,
            tokenExpiry: data.accessTokenExpiry,
            refreshTokenExpiry: data.refreshTokenExpiry || latestRefreshTokenExpiry,
          };

          api.dispatch(setCredentials(updatedSession));
          await AsyncStorage.setItem('auth-session', JSON.stringify(updatedSession));

          // Retry the initial query with updated tokens
          result = await baseQuery(args, api, extraOptions);
        } else {
          api.dispatch(logout());
          await AsyncStorage.removeItem('auth-session');
        }
      } catch (err) {
        console.error('On-demand token refresh failed:', err);
        api.dispatch(logout());
        await AsyncStorage.removeItem('auth-session');
      } finally {
        isRefreshing = false;
      }
    }
  }

  return result;
};

export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Tenant', 'User', 'Ingredient', 'RecipeMapping', 'Order'],
  endpoints: () => ({}),
});
