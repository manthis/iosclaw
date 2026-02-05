import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  TouchableOpacity,
  Animated,
  Keyboard,
  RefreshControl,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { ChatMessage, ConnectionStatus } from '../types';
import { colors, typography, spacing, borderRadius, shadows } from '../theme';
import { MessageBubble, TypingIndicator, SendButton, HalAvatar } from '../components';

interface Props {
  messages: ChatMessage[];
  isGenerating: boolean;
  status: ConnectionStatus;
  onSendMessage: (content: string) => Promise<void>;
  onAbort: () => Promise<void>;
  onDisconnect: () => void;
  onReconnect?: () => void;
}

export function ChatScreen({
  messages,
  isGenerating,
  status,
  onSendMessage,
  onAbort,
  onDisconnect,
  onReconnect,
}: Props) {
  const [input, setInput] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const inputRef = useRef<TextInput>(null);
  const headerOpacity = useRef(new Animated.Value(1)).current;

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  const handleSend = useCallback(async () => {
    if (!input.trim() || isGenerating) return;
    
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const message = input.trim();
    setInput('');
    await onSendMessage(message);
  }, [input, isGenerating, onSendMessage]);

  const handleAbort = useCallback(async () => {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    await onAbort();
  }, [onAbort]);

  const handleRefresh = useCallback(async () => {
    if (!onReconnect) return;
    
    setRefreshing(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onReconnect();
    setTimeout(() => setRefreshing(false), 1000);
  }, [onReconnect]);

  const handleDisconnect = useCallback(async () => {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    onDisconnect();
  }, [onDisconnect]);

  const getStatusColor = () => {
    switch (status) {
      case 'connected':
        return colors.accent.success;
      case 'connecting':
        return colors.accent.warning;
      case 'error':
        return colors.accent.error;
      default:
        return colors.text.tertiary;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'connected':
        return 'Connected';
      case 'connecting':
        return 'Connecting...';
      case 'error':
        return 'Error';
      default:
        return 'Disconnected';
    }
  };

  const renderMessage = useCallback(({ item, index }: { item: ChatMessage; index: number }) => {
    const isLatest = index === messages.length - 1;
    const showTimestamp = index === 0 || 
      (messages[index - 1] && 
       item.timestamp - messages[index - 1].timestamp > 60000);

    return (
      <MessageBubble
        message={item}
        isLatest={isLatest}
        showTimestamp={showTimestamp}
      />
    );
  }, [messages]);

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <HalAvatar size={80} isActive={status === 'connected'} />
      <Text style={styles.emptyTitle}>Hello, Dave.</Text>
      <Text style={styles.emptySubtitle}>
        I'm completely operational, and all my circuits are functioning perfectly.
      </Text>
      <Text style={styles.emptyHint}>Send a message to begin</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Gradient background */}
      <LinearGradient
        colors={[colors.background.primary, colors.hal.dark, colors.background.primary]}
        locations={[0, 0.5, 1]}
        style={StyleSheet.absoluteFill}
      />

      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <Animated.View style={[styles.header, { opacity: headerOpacity }]}>
          <View style={styles.headerLeft}>
            <HalAvatar size={32} isActive={status === 'connected'} isProcessing={isGenerating} />
            <View style={styles.headerTitleContainer}>
              <Text style={styles.headerTitle}>iOSclaw</Text>
              <View style={styles.statusContainer}>
                <View style={[styles.statusDot, { backgroundColor: getStatusColor() }]} />
                <Text style={[styles.statusText, { color: getStatusColor() }]}>
                  {getStatusText()}
                </Text>
              </View>
            </View>
          </View>
          <TouchableOpacity 
            onPress={handleDisconnect} 
            style={styles.disconnectButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={styles.disconnectText}>Disconnect</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Chat area */}
        <KeyboardAvoidingView
          style={styles.chatContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={0}
        >
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessage}
            keyExtractor={(item) => item.id}
            style={styles.messageList}
            contentContainerStyle={[
              styles.messageListContent,
              messages.length === 0 && styles.emptyListContent,
            ]}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={renderEmptyState}
            ListFooterComponent={
              <TypingIndicator visible={isGenerating && !messages.some(m => m.streaming)} />
            }
            refreshControl={
              onReconnect ? (
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={handleRefresh}
                  tintColor={colors.hal.glow}
                  colors={[colors.hal.glow]}
                />
              ) : undefined
            }
            keyboardDismissMode="interactive"
            keyboardShouldPersistTaps="handled"
          />

          {/* Input area */}
          <View style={styles.inputWrapper}>
            <View style={styles.inputContainer}>
              <TextInput
                ref={inputRef}
                style={styles.input}
                value={input}
                onChangeText={setInput}
                placeholder="Message..."
                placeholderTextColor={colors.text.tertiary}
                multiline
                maxLength={4000}
                editable={!isGenerating}
                onSubmitEditing={handleSend}
                returnKeyType="send"
                blurOnSubmit={false}
              />
              <SendButton
                onPress={handleSend}
                onAbort={handleAbort}
                disabled={!input.trim()}
                isGenerating={isGenerating}
              />
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border.subtle,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitleContainer: {
    marginLeft: spacing.md,
  },
  headerTitle: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.semibold,
    color: colors.text.primary,
    letterSpacing: typography.letterSpacing.tight,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: spacing.xs,
  },
  statusText: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.medium,
  },
  disconnectButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.background.elevated,
  },
  disconnectText: {
    color: colors.accent.error,
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
  },
  chatContainer: {
    flex: 1,
  },
  messageList: {
    flex: 1,
  },
  messageListContent: {
    paddingVertical: spacing.lg,
  },
  emptyListContent: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xxxl,
    paddingBottom: 100,
  },
  emptyTitle: {
    fontSize: typography.size.xxl,
    fontWeight: typography.weight.bold,
    color: colors.text.primary,
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
  },
  emptySubtitle: {
    fontSize: typography.size.md,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: typography.size.md * typography.lineHeight.relaxed,
    marginBottom: spacing.xl,
  },
  emptyHint: {
    fontSize: typography.size.sm,
    color: colors.text.tertiary,
    fontStyle: 'italic',
  },
  inputWrapper: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border.subtle,
    backgroundColor: colors.background.primary,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: colors.background.tertiary,
    borderRadius: borderRadius.xl,
    paddingLeft: spacing.lg,
    paddingRight: spacing.sm,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border.primary,
  },
  input: {
    flex: 1,
    fontSize: typography.size.md,
    color: colors.text.primary,
    maxHeight: 120,
    paddingTop: Platform.OS === 'ios' ? spacing.sm : 0,
    paddingBottom: Platform.OS === 'ios' ? spacing.sm : 0,
    marginRight: spacing.sm,
    lineHeight: typography.size.md * typography.lineHeight.normal,
  },
});
