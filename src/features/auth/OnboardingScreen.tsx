import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import BlobBackground from '../../components/BlobBackground';
import Button from '../../components/Button';
import { useAppSelector } from '../../store/store';
import { selectIsDark } from '../../store/themeSlice';

const { width, height } = Dimensions.get('window');

type RootStackParamList = {
  Splash: undefined;
  Onboarding: undefined;
  Login: undefined;
};

interface Slide {
  title: string;
  highlight: string;
  description: string;
  icon: string;
}

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const isDark = useAppSelector(selectIsDark);
  const scrollViewRef = useRef<ScrollView>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const slides: Slide[] = [
    {
      title: 'FIFO Stock',
      highlight: 'Costing',
      description: 'Track ingredient stock in chronological batches. The system automatically deducts from the oldest lot to calculate accurate profit margins.',
      icon: '📦',
    },
    {
      title: 'Aggregator Order',
      highlight: 'Syncing',
      description: 'Import daily orders from Zomato, Swiggy, and Magicpin. Automatically deduct ingredient levels and calculate payouts post-commissions.',
      icon: '📊',
    },
    {
      title: 'Tap to Log',
      highlight: 'Plates',
      description: 'Log sales instantly right at the counter. A single tap records the transaction, calculates gross profit, and decrements ingredients.',
      icon: '🍽️',
    },
  ];

  // Helper to start the auto-advance timer
  const startAutoAdvanceTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    // If we have reached the last slide, stop auto-advancing
    if (currentSlideIndex >= slides.length - 1) {
      return;
    }
    timerRef.current = setTimeout(() => {
      const nextIndex = currentSlideIndex + 1;
      setCurrentSlideIndex(nextIndex);
      scrollViewRef.current?.scrollTo({ x: nextIndex * width, animated: true });
    }, 4000); // Transition every 4 seconds
  };

  // Manage timer lifecycle based on current slide index
  useEffect(() => {
    startAutoAdvanceTimer();
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [currentSlideIndex]);

  const handleNext = () => {
    if (currentSlideIndex < slides.length - 1) {
      const nextIndex = currentSlideIndex + 1;
      setCurrentSlideIndex(nextIndex);
      scrollViewRef.current?.scrollTo({ x: nextIndex * width, animated: true });
    } else {
      navigation.navigate('Login');
    }
  };

  const handleSkip = () => {
    navigation.navigate('Login');
  };

  const handleMomentumScrollEnd = (event: any) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / width);
    setCurrentSlideIndex(index);
  };

  const handleScrollBeginDrag = () => {
    // User started dragging, pause timer to avoid scroll conflicts
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
  };

  const handleScrollEndDrag = () => {
    // User stopped dragging, restart timer
    startAutoAdvanceTimer();
  };

  return (
    <View className="flex-1 bg-background dark:bg-background-dark">
      <StatusBar style={isDark ? 'light' : 'dark'} />

      {/* Reusable Animated Background Blobs */}
      <BlobBackground />

      {/* Top Header - Skip Button (Absolute Overlay) */}
      <View 
        style={{ position: 'absolute', top: Math.max(insets.top, 16), left: 0, right: 0, zIndex: 10 }}
        className="flex-row justify-between items-center px-6 py-2"
      >
        <Text className="text-lg font-black text-text dark:text-text-dark tracking-tight">
          Kitchen<Text className="text-primary">Fill</Text>
          <Text className="text-primary text-xl">.</Text>
        </Text>
        {currentSlideIndex < slides.length - 1 && (
          <TouchableOpacity onPress={handleSkip} activeOpacity={0.7} className="px-3 py-1.5 rounded-lg">
            <Text className="text-muted dark:text-muted-dark text-sm font-semibold tracking-wide active:text-text dark:active:text-text-dark">
              Skip
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Scrollable Slides - Full Screen Paging Gestures */}
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleMomentumScrollEnd}
        onScrollBeginDrag={handleScrollBeginDrag}
        onScrollEndDrag={handleScrollEndDrag}
        className="flex-1"
        style={{ width, height }}
        scrollEventThrottle={16}
      >
        {slides.map((slide, index) => (
          <View 
            key={index} 
            style={{ width, height, justifyContent: 'center', alignItems: 'center' }} 
            className="px-8"
          >
            {/* Safe centered wrapper to avoid absolute overlays */}
            <View className="items-center justify-center pt-24 pb-44 w-full">
              {/* Large Decorative Icon Container with Glassmorphic feel */}
              <View className="w-28 h-28 md:w-32 md:h-32 rounded-3xl bg-card dark:bg-card-dark items-center justify-center border border-border/60 dark:border-border-dark/60 mb-8 shadow-2xl">
                <Text style={{ textAlign: 'center', textAlignVertical: 'center' }} className="text-5xl md:text-6xl">{slide.icon}</Text>
              </View>

              {/* Slide Title */}
              <Text className="text-2xl md:text-3xl font-black text-text dark:text-text-dark text-center tracking-tight leading-tight mb-4">
                {slide.title}{' '}
                <Text className="text-primary">{slide.highlight}</Text>
              </Text>

              {/* Slide Description */}
              <Text className="text-sm md:text-base text-muted dark:text-muted-dark text-center leading-relaxed font-semibold px-2 md:px-4 max-w-sm">
                {slide.description}
              </Text>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Bottom Navigation Panel (Absolute Overlay) */}
      <View 
        style={{ position: 'absolute', bottom: Math.max(insets.bottom, 16), left: 0, right: 0, zIndex: 10 }}
        className="px-8 items-center w-full"
      >
        {/* Step Indicator text */}
        <Text className="text-xs text-muted dark:text-muted-dark font-extrabold tracking-widest uppercase mb-1">
          Step {currentSlideIndex + 1} of {slides.length}
        </Text>

        {/* Dynamic navigation gesture hint */}
        <Text className="text-[10px] text-primary font-black tracking-widest uppercase mb-5">
          {currentSlideIndex === 0 && "← Swipe left to continue"}
          {currentSlideIndex === 1 && "← Swipe left or right →"}
          {currentSlideIndex === 2 && "Swipe right to go back →"}
        </Text>

        {/* Progress Indicators (Dots) with custom explicit margin gap */}
        <View className="flex-row justify-center mb-6">
          {slides.map((_, index) => (
            <View
              key={index}
              style={{ marginHorizontal: 12 }}
              className={`h-2.5 rounded-full transition-all duration-300 ${
                index === currentSlideIndex ? 'w-8 bg-primary' : 'w-2.5 bg-card dark:bg-card-dark border border-border dark:border-border-dark'
              }`}
            />
          ))}
        </View>

        {/* Reusable Action Button */}
        <Button
          label={currentSlideIndex === slides.length - 1 ? 'Get Started' : 'Next'}
          onPress={handleNext}
        />
      </View>
    </View>
  );
}
