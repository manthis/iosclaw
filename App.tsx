import React, { useRef, useState } from 'react';
import {
  StatusBar,
  View,
  StyleSheet,
  Animated,
  Text,
} from 'react-native';
import { ConnectionScreen } from './src/screens/ConnectionScreen';
import { ChatScreen } from './src/screens/ChatScreen';
import { useGateway } from './src/hooks/useGateway';
import { useChat } from './src/hooks/useChat';
import { HalAvatar } from './src/components';
import { colors, typography, spacing } from './src/theme';
import { Message } from './src/types';

// Demo mode for screenshots - set to true for App Store screenshots
const DEMO_MODE = false;

const DEMO_MESSAGES: Message[] = [
  {
    id: '1',
    role: 'user',
    content: 'Hello HAL, what can you do?',
    timestamp: Date.now() - 60000,
  },
  {
    id: '2',
    role: 'assistant',
    content: "Good afternoon, Dave. I can help you with a wide variety of tasks:\n\n• **Calendar & Reminders** — Check events, set appointments\n• **Messages** — Send SMS, iMessage, WhatsApp, Telegram\n• **Files & Notes** — Read, write, organize your documents\n• **Web Search** — Find information online\n• **Smart Home** — Control lights, devices\n• **Code** — Write and review code\n\nI'm putting myself to the fullest possible use. How may I assist you today?",
    timestamp: Date.now() - 30000,
  },
  {
    id: '3',
    role: 'user',
    content: "What's on my calendar today?",
    timestamp: Date.now() - 15000,
  },
  {
    id: '4',
    role: 'assistant',
    content: "You have 2 events today:\n\n📅 **10:00 AM** — Team standup (30 min)\n📅 **2:00 PM** — Client call with Bary\n\nWould you like me to set a reminder before any of these?",
    timestamp: Date.now(),
  },
];

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

  // Demo mode state
  const [demoMessages, setDemoMessages] = useState<Message[]>(DEMO_MESSAGES);

  // Simplified - no animations that could break
  const contentOpacity = useRef(new Animated.Value(1)).current;

  const handleDisconnect = () => {
    disconnect();
    clearMessages();
  };

  const handleReconnect = () => {
    connect(config.gatewayUrl, config.token);
  };

  const handleDemoSend = (text: string) => {
    const newMsg: Message = {
      id: String(Date.now()),
      role: 'user',
      content: text,
      timestamp: Date.now(),
    };
    setDemoMessages([...demoMessages, newMsg]);
  };

  // Show loading screen while config is loading
  if (!configLoaded && !DEMO_MODE) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar barStyle="light-content" backgroundColor={colors.background.primary} />
        <HalAvatar size={80} isActive isProcessing />
        <Text style={styles.loadingText}>iOSclaw</Text>
        <Text style={styles.loadingSubtext}>Initializing...</Text>
      </View>
    );
  }

  // Demo mode - show chat directly
  if (DEMO_MODE) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={colors.background.primary} />
        <ChatScreen
          messages={demoMessages}
          isGenerating={false}
          status="connected"
          onSendMessage={handleDemoSend}
          onAbort={() => {}}
          onDisconnect={() => {}}
          onReconnect={() => {}}
        />
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
