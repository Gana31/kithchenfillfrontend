import { baseApi } from '../../services/api';

export const passwordApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    sendForgotPasswordOtp: builder.mutation<{ success: boolean; message: string }, { email: string }>({
      query: (body) => ({
        url: '/auth/password/forgot/send-otp',
        method: 'POST',
        body,
      }),
    }),
    resetForgotPassword: builder.mutation<
      { success: boolean; message: string },
      { email: string; otp: string; newPassword: string }
    >({
      query: (body) => ({
        url: '/auth/password/forgot/reset',
        method: 'POST',
        body,
      }),
    }),
    sendChangePasswordOtp: builder.mutation<{ success: boolean; message: string; email: string }, void>({
      query: () => ({
        url: '/auth/password/change/send-otp',
        method: 'POST',
      }),
    }),
    confirmChangePassword: builder.mutation<
      { success: boolean; message: string },
      { otp: string; newPassword: string }
    >({
      query: (body) => ({
        url: '/auth/password/change/confirm',
        method: 'POST',
        body,
      }),
    }),
  }),
  overrideExisting: true,
});

export const {
  useSendForgotPasswordOtpMutation,
  useResetForgotPasswordMutation,
  useSendChangePasswordOtpMutation,
  useConfirmChangePasswordMutation,
} = passwordApi;
