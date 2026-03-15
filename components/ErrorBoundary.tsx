import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onReset?: () => void;
  screenName?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(`[ErrorBoundary][${this.props.screenName ?? 'Unknown'}]`, error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    this.props.onReset?.();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <View className="flex-1 bg-base justify-center items-center px-8">
          <View className="w-20 h-20 rounded-full bg-elevated justify-center items-center mb-6">
            <Text className="text-4xl">⚠️</Text>
          </View>
          <Text className="text-xl font-bold text-primary mb-2 text-center">Screen Error</Text>
          <Text className="text-sm text-secondary text-center leading-5 mb-6">
            {this.props.screenName
              ? `The "${this.props.screenName}" screen encountered an unexpected error.`
              : 'This screen encountered an unexpected error.'}
          </Text>
          {__DEV__ && this.state.error && (
            <View className="bg-elevated rounded-xl p-4 mb-6 w-full border-l-4 border-red-500">
              <Text className="text-xs text-red-400 font-mono" numberOfLines={4}>
                {this.state.error.message}
              </Text>
            </View>
          )}
          <TouchableOpacity
            className="bg-brand px-8 py-3.5 rounded-full"
            onPress={this.handleReset}
          >
            <Text className="text-white font-bold text-base">Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return this.props.children;
  }
}
