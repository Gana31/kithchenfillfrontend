import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import Card from '../../components/Card';
import Button from '../../components/Button';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '../../hooks/useThemeColors';

export default function CounterScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { primary, danger, isDark } = useThemeColors();
  const [todaysTotal, setTodaysTotal] = useState(0);

  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          onPress={() => setTodaysTotal(0)}
          activeOpacity={0.7}
          className="w-10 h-10 rounded-xl bg-card dark:bg-card-dark border border-border dark:border-border-dark justify-center items-center mr-6 shadow-sm"
        >
          <Ionicons name="trash-outline" size={18} color={danger} />
        </TouchableOpacity>
      ),
    });
  }, [navigation, setTodaysTotal]);

  // Mock quick log items
  const menuItems = [
    { id: '1', name: 'Butter Chicken Full', price: 380, icon: '🍗' },
    { id: '2', name: 'Butter Chicken Half', price: 210, icon: '🍗' },
    { id: '3', name: 'Chicken Biryani Full', price: 290, icon: '🍛' },
    { id: '4', name: 'Chicken Biryani Half', price: 160, icon: '🍛' },
    { id: '5', name: 'Paneer Tikka Masala', price: 240, icon: '🧀' },
    { id: '6', name: 'Jeera Rice Portion', price: 110, icon: '🍚' },
  ];

  const handleLogSale = (name: string, price: number) => {
    setTodaysTotal(prev => prev + price);
    Alert.alert('Plate Logged', `Logged 1x ${name} (₹${price}). Stock has been decremented.`);
  };

  return (
    <View 
      className="flex-1 bg-transparent" 
    >
      <StatusBar style={isDark ? 'light' : 'dark'} />

      <ScrollView 
        contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 16, paddingBottom: insets.bottom + 100 }}
        className="flex-1"
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        scrollEventThrottle={16}
      >
        {/* Counter Summary */}
        <Card className="mb-6 p-5">
          <View className="flex-row justify-between items-start">
            <View>
              <Text className="text-xs text-muted dark:text-muted-dark font-bold uppercase tracking-wider">
                Manually Logged Sales (Today)
              </Text>
              <Text className="text-3xl font-black text-text dark:text-text-dark mt-1">
                ₹{todaysTotal.toLocaleString()}
              </Text>
            </View>
          </View>
          <View className="mt-3 pt-3 border-t border-border/20 dark:border-border-dark/20 flex-row justify-between items-center">
            <Text className="text-xs text-muted dark:text-muted-dark font-medium">Status</Text>
            <Text className="text-xs text-primary font-bold">
              Live Stock Deductions active
            </Text>
          </View>
        </Card>

        {/* Action Title */}
        <Text className="text-lg font-black text-text dark:text-text-dark mb-4">
          Quick Counter Plates
        </Text>

        {/* Grid of quick tap buttons */}
        <View className="flex-row flex-wrap justify-between mb-8" style={{ gap: 16 }}>
          {menuItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              onPress={() => handleLogSale(item.name, item.price)}
              activeOpacity={0.8}
              style={{ width: '47%' }}
            >
              <Card className="p-4 items-center border border-border/40 dark:border-border-dark/40 active:border-primary/50">
                <Text className="text-3xl mb-2">{item.icon}</Text>
                <Text className="text-xs font-black text-text dark:text-text-dark text-center leading-tight h-8 justify-center">
                  {item.name}
                </Text>
                <Text className="text-sm font-extrabold text-primary mt-2">
                  ₹{item.price}
                </Text>
              </Card>
            </TouchableOpacity>
          ))}
        </View>

        {/* Import CSV Card */}
        <Card className="p-5 items-center bg-card dark:bg-card-dark border border-dashed border-border dark:border-border-dark">
          <Ionicons name="cloud-upload" size={36} color={primary} style={{ marginBottom: 8 }} />
          <Text className="text-sm font-black text-text dark:text-text-dark text-center">
            Upload Delivery Spreadsheets
          </Text>
          <Text className="text-xs text-muted dark:text-muted-dark text-center mt-1 mb-4 leading-relaxed">
            Drag/Select CSV daily invoices from Zomato, Swiggy, or Magicpin to bulk deduct stock.
          </Text>
          <Button 
            label="Upload Order CSV" 
            onPress={() => Alert.alert('CSV Upload', 'Spreadsheet parser will be loaded here.')}
            variant="secondary"
            className="w-full"
          />
        </Card>

      </ScrollView>
    </View>
  );
}
