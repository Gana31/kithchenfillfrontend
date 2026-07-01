import React, { useState } from 'react';
import { View, Text, Image, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import BlobBackground from '../../components/BlobBackground';
import Button from '../../components/Button';
import Input from '../../components/Input';
import Card from '../../components/Card';
import { useAppDispatch, useAppSelector } from '../../store/store';
import { selectIsDark } from '../../store/themeSlice';
import { registerUser } from './authSlice';

type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

export default function RegisterScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp<AuthStackParamList>>();
  const dispatch = useAppDispatch();
  const isDark = useAppSelector(selectIsDark);

  const [kitchenName, setKitchenName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRegister = async () => {
    if (!kitchenName || !email || !password) {
      setError('Please fill in all fields.');
      return;
    }
    setLoading(true);
    setError('');
    
    try {
      const resultAction = await dispatch(registerUser({
        name: 'Owner',
        email,
        password,
        businessName: kitchenName
      }));

      if (registerUser.rejected.match(resultAction)) {
        setError(resultAction.payload as string || 'Registration failed.');
      }
    } catch (err: any) {
      setError('Connection failed. Please check if backend is running.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View 
      className="flex-1 bg-background dark:bg-background-dark" 
      style={{ paddingTop: Math.max(insets.top, 16), paddingBottom: Math.max(insets.bottom, 16) }}
    >
      <StatusBar style={isDark ? 'light' : 'dark'} />
      
      {/* Reusable Animated Background Blobs */}
      <BlobBackground />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
        className="flex-1"
      >
        <ScrollView
          contentContainerClassName="flex-grow px-6 py-8"
          className="flex-1"
          showsVerticalScrollIndicator={false}
        >
          <View className="my-auto">
            {/* Logo & Header */}
            <View className="items-center mb-8">
              <Image
                source={require('../../../assets/logo-sm.png')}
                className="w-20 h-20 rounded-2xl animate-fade-in"
                resizeMode="contain"
              />
              <Text className="text-3xl font-semibold text-text dark:text-text-dark mt-4 tracking-tight">
                Kitchen<Text className="text-primary">Fill</Text>
                <Text className="text-primary text-3xl">.</Text>
              </Text>
              <Text className="text-sm font-bold text-muted dark:text-muted-dark mt-1 tracking-normal">
                Create Account
              </Text>
              <Text className="text-xs text-muted dark:text-muted-dark mt-2 text-center font-semibold max-w-xs leading-relaxed">
                Register your kitchen tenant and start optimizing margins
              </Text>
            </View>

            {/* Reusable Card Component with balanced padding */}
            <Card className="p-7">
              <Text className="text-lg font-semibold text-text dark:text-text-dark mb-5">Sign Up</Text>

              {error ? (
                <View className="mb-4 bg-red-500/10 border border-red-500/20 p-3.5 rounded-xl">
                  <Text className="text-red-500 text-xs font-bold text-center leading-relaxed">{error}</Text>
                </View>
              ) : null}

              {/* Reusable Input Fields */}
              <Input
                label="Kitchen / Restaurant Name"
                value={kitchenName}
                onChangeText={setKitchenName}
                placeholder="e.g. Chai Garam, Central Kitchen"
              />

              <Input
                label="Email Address"
                value={email}
                onChangeText={setEmail}
                placeholder="Enter your email"
                keyboardType="email-address"
              />

              <Input
                label="Password"
                value={password}
                onChangeText={setPassword}
                placeholder="Enter your password"
                secureTextEntry
              />

              {/* Reusable Button Component */}
              <Button
                label="Register Kitchen"
                onPress={handleRegister}
                loading={loading}
                className="mt-3"
              />
            </Card>

            {/* Switch Screen Link */}
            <View className="mt-8 items-center flex-row justify-center">
              <Text className="text-muted dark:text-muted-dark text-xs font-semibold mr-1.5">
                Already have an account?
              </Text>
              <TouchableOpacity 
                onPress={() => navigation.navigate('Login')}
                activeOpacity={0.7}
              >
                <Text className="text-primary text-xs font-semibold tracking-wider uppercase">
                  Sign In
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
