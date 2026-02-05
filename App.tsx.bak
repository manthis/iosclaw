import React, { useEffect, useRef } from 'react';
import {
  StatusBar,
  View,
  StyleSheet,
  Animated,
  Easing,
  Text,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ConnectionScreen } from './src/screens/ConnectionScreen';
import { ChatScreen } from './src/screens/ChatScreen';
import { useGateway } from './src/hooks/useGateway';
import { useChat } from './src/hooks/useChat';
import { HalAvatar } from './src/components';
import { colors, typography, spacing } from './src/theme';

export default function App() {
  const {
    status,
    config,
    error,
    configLoaded,
    connect,
    disconnect,
    isConnected,
  } = useGateway();

  const {
    messages,
    isGenerating,
    sendMessage,
    abort,
    clearMessages,
  } = useChat();

  // Loading animation
  const loadingOpacity = useRef(new Animated.Value(1)).current;
  const loadingScale = useRef(new Animated.Value(1)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (configLoaded) {
      // Fade out loading, fade in content
      Animated.parallel([
        Animated.timing(loadingOpacity, {
          toValue: 0,
          duration: 400,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(loadingScale, {
          toValue: 1.1,
          duration: 400,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(contentOpacity, {
          toValue: 1,
          duration: 500,
          delay: 200,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [configLoaded]);

  const handleDisconnect = () => {
    disconnect();
    clearMessages();
  };

  const handleReconnect = () => {
    connect(config.gatewayUrl, config.token);
  };

  // Show loading screen while config is loading
  if (!configLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar barStyle="light-content" backgroundColor={colors.background.primary} />
        <LinearGradient
          colors={[colors.background.primary, colors.hal.dark, colors.background.primary]}
          locations={[0, 0.5, 1]}
          style={StyleSheet.absoluteFill}
        />
        <Animated.View
          style={[
            styles.loadingContent,
            {
              opacity: loadingOpacity,
              transform: [{ scale: loadingScale }],
            },
          ]}
        >
          <HalAvatar size={80} isActive isProcessing />
          <Text style={styles.loadingText}>iOSclaw</Text>
          <Text style={styles.loadingSubtext}>Initializing...</Text>
        </Animated.View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background.primary} />
      <Animated.View style={[styles.content, { opacity: contentOpacity }]}>
        {isConnected ? (
          <ChatScreen
            messages={messages}
            isGenerating={isGenerating}
            status={status}
            onSendMessage={sendMessage}
            onAbort={abort}
            onDisconnect={handleDisconnect}
            onReconnect={handleReconnect}
          />
        ) : (
          <ConnectionScreen
            config={config}
            status={status}
            error={error}
            onConnect={connect}
          />
        )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.background.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingContent: {
    alignItems: 'center',
  },
  loadingText: {
    fontSize: typography.size.xxl,
    fontWeight: typography.weight.bold,
    color: colors.text.primary,
    marginTop: spacing.xl,
  },
  loadingSubtext: {
    fontSize: typography.size.sm,
    color: colors.text.tertiary,
    marginTop: spacing.sm,
  },
});
