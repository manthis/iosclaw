import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Animated,
  Easing,
  SafeAreaView,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { ConnectionConfig, ConnectionStatus } from '../types';
import { colors, typography, spacing, borderRadius, shadows } from '../theme';
import { HalAvatar } from '../components';

interface Props {
  config: ConnectionConfig;
  status: ConnectionStatus;
  error: string | null;
  onConnect: (url: string, token: string) => Promise<void>;
}

export function ConnectionScreen({ config, status, error, onConnect }: Props) {
  const [url, setUrl] = useState(config.gatewayUrl);
  const [token, setToken] = useState(config.token);
  const [localError, setLocalError] = useState<string | null>(null);
  const [focused, setFocused] = useState<'url' | 'token' | null>(null);

  const isConnecting = status === 'connecting';
  const displayError = localError || error;

  // Animations
  const logoScale = useRef(new Animated.Value(0.8)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const formTranslate = useRef(new Animated.Value(30)).current;
  const formOpacity = useRef(new Animated.Value(0)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;
  const errorShake = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Entrance animation
    Animated.sequence([
      Animated.parallel([
        Animated.spring(logoScale, {
          toValue: 1,
          damping: 12,
          stiffness: 100,
          useNativeDriver: true,
        }),
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(formTranslate, {
          toValue: 0,
          duration: 300,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(formOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, []);

  useEffect(() => {
    // Shake animation on error
    if (displayError) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Animated.sequence([
        Animated.timing(errorShake, { toValue: 10, duration: 50, useNativeDriver: true }),
        Animated.timing(errorShake, { toValue: -10, duration: 50, useNativeDriver: true }),
        Animated.timing(errorShake, { toValue: 10, duration: 50, useNativeDriver: true }),
        Animated.timing(errorShake, { toValue: 0, duration: 50, useNativeDriver: true }),
      ]).start();
    }
  }, [displayError]);

  const handleConnect = async () => {
    if (!url.trim() || !token.trim()) {
      setLocalError('URL and token are required');
      return;
    }

    setLocalError(null);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    // Button press animation
    Animated.sequence([
      Animated.timing(buttonScale, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(buttonScale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    try {
      await onConnect(url.trim(), token.trim());
    } catch {
      // Error handled by parent
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.container}>
        {/* Background gradient */}
        <LinearGradient
          colors={[colors.background.primary, colors.hal.dark, colors.background.primary]}
          locations={[0, 0.3, 0.7]}
          style={StyleSheet.absoluteFill}
        />

        <SafeAreaView style={styles.safeArea}>
          <KeyboardAvoidingView
            style={styles.keyboardView}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          >
            <View style={styles.content}>
              {/* Logo section */}
              <Animated.View
                style={[
                  styles.logoContainer,
                  {
                    opacity: logoOpacity,
                    transform: [{ scale: logoScale }],
                  },
                ]}
              >
                <HalAvatar size={100} isActive isProcessing={isConnecting} />
                <Text style={styles.title}>iOSclaw</Text>
                <Text style={styles.subtitle}>OpenClaw Gateway Client</Text>
              </Animated.View>

              {/* Form section */}
              <Animated.View
                style={[
                  styles.form,
                  {
                    opacity: formOpacity,
                    transform: [
                      { translateY: formTranslate },
                      { translateX: errorShake },
                    ],
                  },
                ]}
              >
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Gateway URL</Text>
                  <View
                    style={[
                      styles.inputWrapper,
                      focused === 'url' && styles.inputWrapperFocused,
                    ]}
                  >
                    <TextInput
                      style={styles.input}
                      value={url}
                      onChangeText={setUrl}
                      placeholder="wss://hal9000.local:18789"
                      placeholderTextColor={colors.text.subtle}
                      autoCapitalize="none"
                      autoCorrect={false}
                      editable={!isConnecting}
                      onFocus={() => setFocused('url')}
                      onBlur={() => setFocused(null)}
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Token</Text>
                  <View
                    style={[
                      styles.inputWrapper,
                      focused === 'token' && styles.inputWrapperFocused,
                    ]}
                  >
                    <TextInput
                      style={styles.input}
                      value={token}
                      onChangeText={setToken}
                      placeholder="Enter your gateway token"
                      placeholderTextColor={colors.text.subtle}
                      autoCapitalize="none"
                      autoCorrect={false}
                      secureTextEntry
                      editable={!isConnecting}
                      onFocus={() => setFocused('token')}
                      onBlur={() => setFocused(null)}
                    />
                  </View>
                </View>

                {displayError && (
                  <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>{displayError}</Text>
                  </View>
                )}

                <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
                  <TouchableOpacity
                    style={[
                      styles.button,
                      isConnecting && styles.buttonConnecting,
                    ]}
                    onPress={handleConnect}
                    disabled={isConnecting}
                    activeOpacity={0.8}
                  >
                    {isConnecting ? (
                      <View style={styles.buttonContent}>
                        <ActivityIndicator color={colors.text.primary} size="small" />
                        <Text style={styles.buttonText}>Connecting...</Text>
                      </View>
                    ) : (
                      <Text style={styles.buttonText}>Connect</Text>
                    )}
                  </TouchableOpacity>
                </Animated.View>
              </Animated.View>

              {/* Hint */}
              <Animated.Text
                style={[
                  styles.hint,
                  { opacity: formOpacity },
                ]}
              >
                Ensure the Gateway is running and accessible on your network.
              </Animated.Text>
            </View>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  safeArea: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: spacing.xxxl,
  },
  title: {
    fontSize: typography.size.title,
    fontWeight: typography.weight.bold,
    color: colors.text.primary,
    marginTop: spacing.xl,
    letterSpacing: typography.letterSpacing.tight,
  },
  subtitle: {
    fontSize: typography.size.md,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  form: {
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border.primary,
    ...shadows.lg,
  },
  inputGroup: {
    marginBottom: spacing.lg,
  },
  label: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
    color: colors.text.secondary,
    marginBottom: spacing.sm,
    marginLeft: spacing.xs,
  },
  inputWrapper: {
    backgroundColor: colors.background.primary,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border.primary,
    overflow: 'hidden',
  },
  inputWrapperFocused: {
    borderColor: colors.hal.primary,
    ...shadows.sm,
  },
  input: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontSize: typography.size.md,
    color: colors.text.primary,
  },
  errorContainer: {
    backgroundColor: colors.hal.dark,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.accent.error,
  },
  errorText: {
    color: colors.accent.error,
    fontSize: typography.size.sm,
    textAlign: 'center',
    fontWeight: typography.weight.medium,
  },
  button: {
    backgroundColor: colors.accent.primary,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.lg,
    alignItems: 'center',
    ...shadows.glow,
  },
  buttonConnecting: {
    backgroundColor: colors.hal.subtle,
    shadowOpacity: 0,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  buttonText: {
    color: colors.text.primary,
    fontSize: typography.size.lg,
    fontWeight: typography.weight.semibold,
    marginLeft: spacing.sm,
  },
  hint: {
    fontSize: typography.size.sm,
    color: colors.text.tertiary,
    textAlign: 'center',
    marginTop: spacing.xxl,
    paddingHorizontal: spacing.lg,
  },
});
