import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { ChatMessage } from '../types';
import { colors, typography, spacing, borderRadius, shadows } from '../theme';
import { HalAvatar } from './HalAvatar';

interface Props {
  message: ChatMessage;
  isLatest?: boolean;
  showTimestamp?: boolean;
}

export function MessageBubble({ message, isLatest, showTimestamp }: Props) {
  const isUser = message.role === 'user';
  const isSystem = message.role === 'system';
  const isAssistant = message.role === 'assistant';
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(isUser ? 20 : -20)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;

  useEffect(() => {
    // Entrance animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 250,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        damping: 15,
        stiffness: 200,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        damping: 15,
        stiffness: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <Animated.View
      style={[
        styles.container,
        isUser && styles.userContainer,
        isSystem && styles.systemContainer,
        {
          opacity: fadeAnim,
          transform: [
            { translateX: slideAnim },
            { scale: scaleAnim },
          ],
        },
      ]}
    >
      {/* Avatar for assistant messages */}
      {isAssistant && (
        <View style={styles.avatarContainer}>
          <HalAvatar size={28} isActive isProcessing={message.streaming} />
        </View>
      )}

      <View style={styles.bubbleWrapper}>
        <View
          style={[
            styles.bubble,
            isUser && styles.userBubble,
            isSystem && styles.systemBubble,
            isAssistant && styles.assistantBubble,
            message.streaming && styles.streamingBubble,
          ]}
        >
          <Text
            style={[
              styles.messageText,
              isUser && styles.userText,
              isSystem && styles.systemText,
              isAssistant && styles.assistantText,
            ]}
          >
            {message.content}
            {message.streaming && (
              <Text style={styles.cursor}>▊</Text>
            )}
          </Text>
        </View>

        {/* Timestamp */}
        {showTimestamp && (
          <Text
            style={[
              styles.timestamp,
              isUser && styles.timestampRight,
            ]}
          >
            {formatTime(message.timestamp)}
          </Text>
        )}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.lg,
    alignItems: 'flex-end',
  },
  userContainer: {
    justifyContent: 'flex-end',
  },
  systemContainer: {
    justifyContent: 'center',
  },
  avatarContainer: {
    marginRight: spacing.sm,
    marginBottom: spacing.xs,
  },
  bubbleWrapper: {
    maxWidth: '78%',
  },
  bubble: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.xl,
  },
  userBubble: {
    backgroundColor: colors.bubble.user,
    borderBottomRightRadius: borderRadius.xs,
    ...shadows.md,
  },
  assistantBubble: {
    backgroundColor: colors.bubble.assistant,
    borderBottomLeftRadius: borderRadius.xs,
    borderWidth: 1,
    borderColor: colors.border.primary,
  },
  systemBubble: {
    backgroundColor: colors.bubble.system,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.hal.subtle,
  },
  streamingBubble: {
    borderColor: colors.hal.primary,
    borderWidth: 1,
  },
  messageText: {
    fontSize: typography.size.md,
    lineHeight: typography.size.md * typography.lineHeight.relaxed,
  },
  userText: {
    color: colors.text.primary,
  },
  assistantText: {
    color: colors.text.primary,
  },
  systemText: {
    color: colors.accent.error,
    fontStyle: 'italic',
    fontSize: typography.size.sm,
  },
  cursor: {
    color: colors.hal.glow,
    fontWeight: typography.weight.bold,
  },
  timestamp: {
    fontSize: typography.size.xs,
    color: colors.text.tertiary,
    marginTop: spacing.xs,
    marginLeft: spacing.sm,
  },
  timestampRight: {
    textAlign: 'right',
    marginRight: spacing.sm,
    marginLeft: 0,
  },
});
