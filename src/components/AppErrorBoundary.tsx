import React, { Component, ReactNode } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import * as Updates from 'expo-updates';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export default class AppErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    console.error('AppErrorBoundary:', error);
  }

  handleRetry = async () => {
    this.setState({ hasError: false });
    if (Updates.isEnabled) {
      try {
        await Updates.reloadAsync();
        return;
      } catch {
        // fall through to state reset
      }
    }
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <View style={styles.container}>
        <Text style={styles.title}>Something went wrong</Text>
        <Text style={styles.message}>
          The app hit an error after loading. Tap below to restart. If the screen stays blank,
          reinstall the app from your APK or Play Store.
        </Text>
        <TouchableOpacity style={styles.button} onPress={this.handleRetry} activeOpacity={0.8}>
          <Text style={styles.buttonText}>Restart app</Text>
        </TouchableOpacity>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#09090A',
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#F4F4F5',
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    color: '#A1A1AA',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  button: {
    backgroundColor: '#FF6B00',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 14,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
});
