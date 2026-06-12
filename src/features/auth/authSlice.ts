import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../../config/constants';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'Superadmin' | 'Owner' | 'Staff';
  tenantId: string | null;
  status: string;
}

export interface AuthState {
  token: string | null;
  refreshToken: string | null;
  user: User | null;
  tenantId: string | null;
  tokenExpiry: number | null; // Timestamp (ms) when access token expires
  refreshTokenExpiry: number | null; // Timestamp (ms) when refresh token expires
  isAuthenticated: boolean;
  loading: boolean;
}

const initialState: AuthState = {
  token: null,
  refreshToken: null,
  user: null,
  tenantId: null,
  tokenExpiry: null,
  refreshTokenExpiry: null,
  isAuthenticated: false,
  loading: true,
};

// Async thunk to load the saved auth state from AsyncStorage on app start
export const loadStoredAuth = createAsyncThunk(
  'auth/loadStoredAuth',
  async (_, { dispatch }) => {
    try {
      const storedSession = await AsyncStorage.getItem('auth-session');
      if (!storedSession) {
        return null;
      }

      const session = JSON.parse(storedSession);
      const { token, refreshToken, user, tokenExpiry, refreshTokenExpiry } = session;

      if (!token || !refreshToken || !user || !tokenExpiry) {
        return null;
      }

      // Check if refresh token is already expired
      if (refreshTokenExpiry && Date.now() >= refreshTokenExpiry) {
        await AsyncStorage.removeItem('auth-session');
        return null;
      }

      // Check if access token is still valid (using a 1-minute buffer)
      if (Date.now() < tokenExpiry - 60 * 1000) {
        return session;
      }

      // Access token is expired (or close to), try to refresh it immediately

      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });

      const data = await response.json();
      if (data.success && data.accessToken) {
        const updatedSession = {
          token: data.accessToken,
          refreshToken: data.refreshToken || refreshToken,
          user,
          tokenExpiry: data.accessTokenExpiry,
          refreshTokenExpiry: data.refreshTokenExpiry || refreshTokenExpiry,
        };

        // Save new tokens
        await AsyncStorage.setItem('auth-session', JSON.stringify(updatedSession));
        return updatedSession;
      } else {
        // Refresh token expired or revoked, clear session
        await AsyncStorage.removeItem('auth-session');
        return null;
      }
    } catch (error) {
      console.error('Failed to load stored auth session:', error);
      return null;
    }
  }
);

// Async thunk to login
export const loginUser = createAsyncThunk(
  'auth/loginUser',
  async (credentials: { email: string; password: string }, { rejectWithValue }) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout
    try {

      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const data = await response.json();

      if (!response.ok || !data.success) {
        return rejectWithValue(data.error || 'Invalid credentials.');
      }

      const session = {
        token: data.accessToken,
        refreshToken: data.refreshToken,
        user: data.user,
        tokenExpiry: data.accessTokenExpiry,
        refreshTokenExpiry: data.refreshTokenExpiry,
      };

      // Save to AsyncStorage
      await AsyncStorage.setItem('auth-session', JSON.stringify(session));
      return session;
    } catch (error: any) {
      clearTimeout(timeoutId);
      console.error('Login Error:', error);
      if (error.name === 'AbortError') {
        return rejectWithValue('Request timed out. Please check if backend is running.');
      }
      return rejectWithValue(error.message || 'Server error. Please try again.');
    }
  }
);

// Async thunk to register
export const registerUser = createAsyncThunk(
  'auth/registerUser',
  async (fields: { name: string; email: string; password: string; businessName: string }, { rejectWithValue }) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout
    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fields),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const data = await response.json();

      if (!response.ok || !data.success) {
        return rejectWithValue(data.error || 'Failed to register.');
      }

      const session = {
        token: data.accessToken,
        refreshToken: data.refreshToken,
        user: data.user,
        tokenExpiry: data.accessTokenExpiry,
        refreshTokenExpiry: data.refreshTokenExpiry,
      };

      // Save to AsyncStorage
      await AsyncStorage.setItem('auth-session', JSON.stringify(session));
      return session;
    } catch (error: any) {
      clearTimeout(timeoutId);
      console.error('Register Error:', error);
      if (error.name === 'AbortError') {
        return rejectWithValue('Request timed out. Please check if backend is running.');
      }
      return rejectWithValue(error.message || 'Server error. Please try again.');
    }
  }
);

// Async thunk to logout
export const logoutUser = createAsyncThunk(
  'auth/logoutUser',
  async (_, { getState }) => {
    try {
      const state = getState() as { auth: AuthState };
      const refreshToken = state.auth.refreshToken;

      if (refreshToken) {
        await fetch(`${API_BASE_URL}/auth/logout`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken }),
        });
      }
    } catch (error) {
      console.error('Failed to notify backend of logout:', error);
    } finally {
      await AsyncStorage.removeItem('auth-session');
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    // Reducer to manually set credentials (useful during RTK auto-refresh in middleware)
    setCredentials: (
      state,
      action: PayloadAction<{ token: string; refreshToken: string; user: User; tokenExpiry: number; refreshTokenExpiry: number }>
    ) => {
      const { token, refreshToken, user, tokenExpiry, refreshTokenExpiry } = action.payload;
      state.token = token;
      state.refreshToken = refreshToken;
      state.user = user;
      state.tenantId = user.tenantId;
      state.tokenExpiry = tokenExpiry;
      state.refreshTokenExpiry = refreshTokenExpiry;
      state.isAuthenticated = true;
    },
    logout: (state) => {
      state.token = null;
      state.refreshToken = null;
      state.user = null;
      state.tenantId = null;
      state.tokenExpiry = null;
      state.refreshTokenExpiry = null;
      state.isAuthenticated = false;
    },
  },
  extraReducers: (builder) => {
    builder
      // loadStoredAuth
      .addCase(loadStoredAuth.pending, (state) => {
        state.loading = true;
      })
      .addCase(loadStoredAuth.fulfilled, (state, action) => {
        if (action.payload) {
          const { token, refreshToken, user, tokenExpiry, refreshTokenExpiry } = action.payload;
          state.token = token;
          state.refreshToken = refreshToken;
          state.user = user;
          state.tenantId = user.tenantId;
          state.tokenExpiry = tokenExpiry;
          state.refreshTokenExpiry = refreshTokenExpiry;
          state.isAuthenticated = true;
        }
        state.loading = false;
      })
      .addCase(loadStoredAuth.rejected, (state) => {
        state.loading = false;
      })
      // loginUser
      .addCase(loginUser.fulfilled, (state, action) => {
        const { token, refreshToken, user, tokenExpiry, refreshTokenExpiry } = action.payload;
        state.token = token;
        state.refreshToken = refreshToken;
        state.user = user;
        state.tenantId = user.tenantId;
        state.tokenExpiry = tokenExpiry;
        state.refreshTokenExpiry = refreshTokenExpiry;
        state.isAuthenticated = true;
      })
      // registerUser
      .addCase(registerUser.fulfilled, (state, action) => {
        const { token, refreshToken, user, tokenExpiry, refreshTokenExpiry } = action.payload;
        state.token = token;
        state.refreshToken = refreshToken;
        state.user = user;
        state.tenantId = user.tenantId;
        state.tokenExpiry = tokenExpiry;
        state.refreshTokenExpiry = refreshTokenExpiry;
        state.isAuthenticated = true;
      })
      // logoutUser
      .addCase(logoutUser.fulfilled, (state) => {
        state.token = null;
        state.refreshToken = null;
        state.user = null;
        state.tenantId = null;
        state.tokenExpiry = null;
        state.refreshTokenExpiry = null;
        state.isAuthenticated = false;
      });
  },
});

export const { setCredentials, logout } = authSlice.actions;

export default authSlice.reducer;

export const selectCurrentUser = (state: { auth: AuthState }) => state.auth.user;
export const selectCurrentToken = (state: { auth: AuthState }) => state.auth.token;
export const selectActiveTenantId = (state: { auth: AuthState }) => state.auth.tenantId;
export const selectIsAuthenticated = (state: { auth: AuthState }) => state.auth.isAuthenticated;
export const selectAuthLoading = (state: { auth: AuthState }) => state.auth.loading;
