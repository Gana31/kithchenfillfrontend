import React from 'react';
import { View } from 'react-native';

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export default function Card({ children, className = '' }: CardProps) {
  return (
    <View className={`bg-card dark:bg-card-dark p-6 rounded-3xl border border-border dark:border-border-dark shadow-sm w-full ${className}`}>
      {children}
    </View>
  );
}
