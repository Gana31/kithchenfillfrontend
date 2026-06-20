import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Define the theme preference type
export type ThemePreference = 'dark' | 'light' | 'system';

interface ThemeState {
  theme: ThemePreference;
  systemIsDark: boolean;
  loading: boolean;
}

const initialState: ThemeState = {
  theme: 'system',
  systemIsDark: false,
  loading: true,
};

// Async thunk to load the saved theme preference on app start
export const loadTheme = createAsyncThunk(
  'theme/loadTheme',
  async () => {
    try {
      const savedTheme = await AsyncStorage.getItem('user-theme-preference');
      if (savedTheme === 'dark' || savedTheme === 'light' || savedTheme === 'system') {
        return savedTheme as ThemePreference;
      }
    } catch (error) {
      console.error('Failed to load theme preference:', error);
    }
    return 'system' as ThemePreference;
  }
);

// Async thunk to update and save the theme preference
export const changeTheme = createAsyncThunk(
  'theme/changeTheme',
  async (newTheme: ThemePreference) => {
    try {
      await AsyncStorage.setItem('user-theme-preference', newTheme);
    } catch (error) {
      console.error('Failed to save theme preference:', error);
    }
    return newTheme;
  }
);

const themeSlice = createSlice({
  name: 'theme',
  initialState,
  reducers: {
    // Action to keep track of the system's actual color scheme changes
    setSystemIsDark(state, action: PayloadAction<boolean>) {
      state.systemIsDark = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadTheme.pending, (state) => {
        state.loading = true;
      })
      .addCase(loadTheme.fulfilled, (state, action) => {
        state.theme = action.payload;
        state.loading = false;
      })
      .addCase(loadTheme.rejected, (state) => {
        state.loading = false;
      })
      .addCase(changeTheme.fulfilled, (state, action) => {
        state.theme = action.payload;
      });
  },
});

import { DEV_THEME_OVERRIDE } from '../config/constants';

export const { setSystemIsDark } = themeSlice.actions;

export const selectThemePreference = (state: { theme: ThemeState }) => state.theme.theme;

// Selector to check if dark mode is active (based on theme preference or system default, with dev override)
export const selectIsDark = (state: { theme: ThemeState }) => {
  if (DEV_THEME_OVERRIDE) {
    return DEV_THEME_OVERRIDE === 'dark';
  }
  if (state.theme.theme === 'system') {
    return state.theme.systemIsDark;
  }
  return state.theme.theme === 'dark';
};

export default themeSlice.reducer;
