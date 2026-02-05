import React from 'react';
import { StatusBar, View, ActivityIndicator, StyleSheet } from 'react-native';
import { ConnectionScreen } from './src/screens/ConnectionScreen';
import { ChatScreen } from './src/screens/ChatScreen';
import { useGateway } from './src/hooks/useGateway';
import { useChat } from './src/hooks/useChat';

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

  const handleDisconnect = () => {
    disconnect();
    clearMessages();
  };

  // Show loading while config is being loaded
  if (!configLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar barStyle="light-content" />
        <ActivityIndicator size="large" color="#e65100" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      {isConnected ? (
        <ChatScreen
          messages={messages}
          isGenerating={isGenerating}
          status={status}
          onSendMessage={sendMessage}
          onAbort={abort}
          onDisconnect={handleDisconnect}
        />
      ) : (
        <ConnectionScreen
          config={config}
          status={status}
          error={error}
          onConnect={connect}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
