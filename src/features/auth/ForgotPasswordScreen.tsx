import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import BlobBackground from '../../components/BlobBackground';
import Button from '../../components/Button';
import Input from '../../components/Input';
import Card from '../../components/Card';
import { useAppSelector } from '../../store/store';
import { selectIsDark } from '../../store/themeSlice';
import {
  useResetForgotPasswordMutation,
  useSendForgotPasswordOtpMutation,
} from './passwordApi';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '../../hooks/useThemeColors';

type AuthStackParamList = {
  Login: undefined;
  ForgotPassword: undefined;
};

export default function ForgotPasswordScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp<AuthStackParamList>>();
  const isDark = useAppSelector(selectIsDark);
  const { primary } = useThemeColors();

  const [step, setStep] = useState<'email' | 'reset'>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  const [sendOtp, { isLoading: sendingOtp }] = useSendForgotPasswordOtpMutation();
  const [resetPassword, { isLoading: resetting }] = useResetForgotPasswordMutation();

  const handleSendOtp = async () => {
    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }

    setError('');
    setInfo('');
    try {
      const result = await sendOtp({ email: email.trim() }).unwrap();
      setInfo(result.message);
      setStep('reset');
    } catch (err: any) {
      setError(err?.data?.error || 'Could not send verification code.');
    }
  };

  const handleResetPassword = async () => {
    if (!otp.trim() || !newPassword || !confirmPassword) {
      setError('Please fill in OTP and both password fields.');
      return;
    }
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setError('');
    setInfo('');
    try {
      const result = await resetPassword({
        email: email.trim(),
        otp: otp.trim(),
        newPassword,
      }).unwrap();
      setInfo(result.message);
      setTimeout(() => navigation.navigate('Login'), 1200);
    } catch (err: any) {
      setError(err?.data?.error || 'Could not reset password.');
    }
  };

  return (
    <View
      className="flex-1 bg-background dark:bg-background-dark"
      style={{ paddingTop: Math.max(insets.top, 16), paddingBottom: Math.max(insets.bottom, 16) }}
    >
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <BlobBackground />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'padding'} className="flex-1">
        <ScrollView contentContainerClassName="flex-grow px-6 py-8" showsVerticalScrollIndicator={false}>
          <TouchableOpacity
            onPress={() => navigation.navigate('Login')}
            className="flex-row items-center mb-6"
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={18} color={primary} style={{ marginRight: 6 }} />
            <Text className="text-primary text-sm font-semibold">Back to sign in</Text>
          </TouchableOpacity>

          <View className="items-center mb-6">
            <Image
              source={require('../../../assets/logo-sm.png')}
              className="w-16 h-16 rounded-2xl"
              resizeMode="contain"
            />
            <Text className="text-2xl font-semibold text-text dark:text-text-dark mt-4 tracking-tight">
              Reset password
            </Text>
            <Text className="text-xs text-muted dark:text-muted-dark mt-2 text-center leading-relaxed max-w-xs">
              {step === 'email'
                ? 'Enter your registered email and we will send a verification code.'
                : `Enter the code sent to ${email.trim()}`}
            </Text>
          </View>

          <Card className="p-7">
            {error ? (
              <View className="mb-4 bg-red-500/10 border border-red-500/20 p-3.5 rounded-xl">
                <Text className="text-red-500 text-xs font-bold text-center leading-relaxed">{error}</Text>
              </View>
            ) : null}

            {info ? (
              <View className="mb-4 bg-emerald-500/10 border border-emerald-500/20 p-3.5 rounded-xl">
                <Text className="text-emerald-600 text-xs font-bold text-center leading-relaxed">{info}</Text>
              </View>
            ) : null}

            {step === 'email' ? (
              <>
                <Input
                  label="Email address"
                  value={email}
                  onChangeText={setEmail}
                  placeholder="you@kitchen.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
                <Button label="Send verification code" onPress={handleSendOtp} loading={sendingOtp} className="mt-3" />
              </>
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
                <Button
                  label="Update password"
                  onPress={handleResetPassword}
                  loading={resetting}
                  className="mt-3"
                />
                <TouchableOpacity onPress={handleSendOtp} disabled={sendingOtp} className="mt-4 items-center">
                  <Text className="text-primary text-xs font-semibold">
                    {sendingOtp ? 'Sending...' : 'Resend code'}
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </Card>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
