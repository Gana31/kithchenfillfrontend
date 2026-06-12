import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface ToastState {
  visible: boolean;
  message: string;
  type: 'success' | 'error' | 'info';
  title?: string;
}

const initialState: ToastState = {
  visible: false,
  message: '',
  type: 'info',
  title: undefined,
};

const toastSlice = createSlice({
  name: 'toast',
  initialState,
  reducers: {
    showToast: (
      state,
      action: PayloadAction<{ message: string; type?: 'success' | 'error' | 'info'; title?: string }>
    ) => {
      state.visible = true;
      state.message = action.payload.message;
      state.type = action.payload.type || 'info';
      state.title = action.payload.title;
    },
    hideToast: (state) => {
      state.visible = false;
    },
  },
});

export const { showToast, hideToast } = toastSlice.actions;
export default toastSlice.reducer;
