import React, { useState } from 'react';
import { View, Text } from 'react-native';
import Card from '../../components/Card';
import Button from '../../components/Button';
import Input from '../../components/Input';
import {
  useConfirmChangePasswordMutation,
  useSendChangePasswordOtpMutation,
} from '../auth/passwordApi';

interface ChangePasswordCardProps {
  email: string;
  onSuccess?: (message: string) => void;
  onError?: (message: string) => void;
}

export default function ChangePasswordCard({ email, onSuccess, onError }: ChangePasswordCardProps) {
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [localError, setLocalError] = useState('');
  const [localInfo, setLocalInfo] = useState('');

  const [sendOtp, { isLoading: sendingOtp }] = useSendChangePasswordOtpMutation();
  const [confirmChange, { isLoading: saving }] = useConfirmChangePasswordMutation();

  const handleSendOtp = async () => {
    setLocalError('');
    setLocalInfo('');
    try {
      const result = await sendOtp().unwrap();
      setOtpSent(true);
      setLocalInfo(result.message || `Code sent to ${email}`);
      onSuccess?.(result.message);
    } catch (err: any) {
      const message = err?.data?.error || 'Could not send verification code.';
      setLocalError(message);
      onError?.(message);
    }
  };

  const handleUpdatePassword = async () => {
    if (!otp.trim() || !newPassword || !confirmPassword) {
      setLocalError('Please fill OTP and both password fields.');
      return;
    }
    if (newPassword.length < 6) {
      setLocalError('Password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setLocalError('Passwords do not match.');
      return;
    }

    setLocalError('');
    setLocalInfo('');
    try {
      const result = await confirmChange({ otp: otp.trim(), newPassword }).unwrap();
      setOtp('');
      setNewPassword('');
      setConfirmPassword('');
      setOtpSent(false);
      setLocalInfo(result.message);
      onSuccess?.(result.message);
    } catch (err: any) {
      const message = err?.data?.error || 'Could not update password.';
      setLocalError(message);
      onError?.(message);
    }
  };

  return (
    <Card className="mb-6 p-5">
      <Text className="text-xs text-muted dark:text-muted-dark font-bold tracking-normal mb-1">
        Change password
      </Text>
      <Text className="text-[11px] text-muted dark:text-muted-dark leading-relaxed mb-4">
        We will send a verification code to <Text className="font-semibold text-text dark:text-text-dark">{email}</Text>
      </Text>

      {localError ? (
        <View className="mb-3 bg-red-500/10 border border-red-500/20 p-3 rounded-xl">
          <Text className="text-red-500 text-xs font-bold text-center">{localError}</Text>
        </View>
      ) : null}

      {localInfo ? (
        <View className="mb-3 bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-xl">
          <Text className="text-emerald-600 text-xs font-bold text-center">{localInfo}</Text>
        </View>
      ) : null}

      {!otpSent ? (
        <Button label="Send verification code" onPress={handleSendOtp} loading={sendingOtp} variant="secondary" />
      ) : (
        <>
          <Input
            label="Verification code"
            value={otp}
            onChangeText={setOtp}
            placeholder="6-digit code"
            keyboardType="number-pad"
            maxLength={6}
          />
          <Input
            label="New password"
            value={newPassword}
            onChangeText={setNewPassword}
            placeholder="At least 6 characters"
            secureTextEntry
          />
          <Input
            label="Confirm new password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="Re-enter password"
            secureTextEntry
          />
          <Button label="Update password" onPress={handleUpdatePassword} loading={saving} className="mt-2" />
          <Button
            label="Resend code"
            onPress={handleSendOtp}
            loading={sendingOtp}
            variant="secondary"
            className="mt-3"
          />
        </>
      )}
    </Card>
  );
}
