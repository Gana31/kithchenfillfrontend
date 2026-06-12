import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import authReducer from '../features/auth/authSlice';
import themeReducer from './themeSlice';
import { baseApi } from '../services/api';

/**
 * Configure the central Redux Store
 */
export const store = configureStore({
  reducer: {
    // Add auth feature slice reducer
    auth: authReducer,
    // Add theme slice reducer
    theme: themeReducer,
    // Add RTK Query base API slice reducer
    [baseApi.reducerPath]: baseApi.reducer,
  },
  // Add baseApi middleware for caching, invalidation, polling, and other RTK Query features
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore specific actions if persistence libraries or complex payloads are used
      },
    }).concat(baseApi.middleware),
});

// Setup listeners to enable refetchOnFocus, refetchOnReconnect, and polling behaviors
setupListeners(store.dispatch);

// Define RootState and AppDispatch types based on the store
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Custom typed hooks for use in components instead of generic useDispatch/useSelector
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
