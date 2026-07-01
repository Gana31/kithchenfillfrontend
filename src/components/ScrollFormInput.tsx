import React from 'react';
import { TextInput, TextInputProps, StyleSheet, View } from 'react-native';

/**
 * TextInput wrapper for forms inside gesture-handler ScrollView.
 * The outer view participates in scroll hit-testing; the input still receives taps to focus.
 */
export default function ScrollFormInput({ style, ...props }: TextInputProps) {
  return (
    <View style={styles.wrap} collapsable={false}>
      <TextInput
        {...props}
        style={[styles.input, style]}
        scrollEnabled={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
  },
  input: {
    width: '100%',
  },
});
