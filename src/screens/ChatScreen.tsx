import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
} from 'react-native';
import { ChatMessage, ConnectionStatus } from '../types';

interface Props {
  messages: ChatMessage[];
  isGenerating: boolean;
  status: ConnectionStatus;
  onSendMessage: (content: string) => Promise<void>;
  onAbort: () => Promise<void>;
  onDisconnect: () => void;
}

export function ChatScreen({
  messages,
  isGenerating,
  status,
  onSendMessage,
  onAbort,
  onDisconnect,
}: Props) {
  const [input, setInput] = useState('');
  const flatListRef = useRef<FlatList>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isGenerating) return;
    
    const message = input.trim();
    setInput('');
    await onSendMessage(message);
  };

  const renderMessage = ({ item }: { item: ChatMessage }) => {
    const isUser = item.role === 'user';
    const isSystem = item.role === 'system';

    return (
      <View
        style={[
          styles.messageContainer,
          isUser && styles.userMessageContainer,
          isSystem && styles.systemMessageContainer,
        ]}
      >
        <View
          style={[
            styles.messageBubble,
            isUser && styles.userBubble,
            isSystem && styles.systemBubble,
            item.streaming && styles.streamingBubble,
          ]}
        >
          <Text
            style={[
              styles.messageText,
              isUser && styles.userText,
              isSystem && styles.systemText,
            ]}
          >
            {item.content}
            {item.streaming && '▊'}
          </Text>
        </View>
      </View>
    );
  };

  const getStatusColor = () => {
    switch (status) {
      case 'connected':
        return '#4caf50';
      case 'connecting':
        return '#ff9800';
      case 'error':
        return '#f44336';
      default:
        return '#9e9e9e';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={[styles.statusDot, { backgroundColor: getStatusColor() }]} />
          <Text style={styles.headerTitle}>iOSclaw</Text>
        </View>
        <TouchableOpacity onPress={onDisconnect} style={styles.disconnectButton}>
          <Text style={styles.disconnectText}>Disconnect</Text>
        </TouchableOpacity>
      </View>

      {/* Messages */}
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
          contentContainerStyle={styles.messageListContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No messages yet</Text>
              <Text style={styles.emptyHint}>Send a message to start chatting</Text>
            </View>
          }
        />

        {/* Input */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder="Type a message..."
            placeholderTextColor="#666"
            multiline
            maxLength={4000}
            editable={!isGenerating}
            onSubmitEditing={handleSend}
            returnKeyType="send"
          />
          {isGenerating ? (
            <TouchableOpacity style={styles.abortButton} onPress={onAbort}>
              <Text style={styles.abortText}>■</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.sendButton, !input.trim() && styles.sendButtonDisabled]}
              onPress={handleSend}
              disabled={!input.trim()}
            >
              <Text style={styles.sendText}>↑</Text>
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  disconnectButton: {
    padding: 8,
  },
  disconnectText: {
    color: '#ff6b6b',
    fontSize: 14,
  },
  chatContainer: {
    flex: 1,
  },
  messageList: {
    flex: 1,
  },
  messageListContent: {
    padding: 16,
    paddingBottom: 8,
  },
  messageContainer: {
    marginBottom: 12,
    flexDirection: 'row',
  },
  userMessageContainer: {
    justifyContent: 'flex-end',
  },
  systemMessageContainer: {
    justifyContent: 'center',
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
    backgroundColor: '#2a2a2a',
  },
  userBubble: {
    backgroundColor: '#e65100',
    borderBottomRightRadius: 4,
  },
  systemBubble: {
    backgroundColor: '#442222',
  },
  streamingBubble: {
    borderColor: '#e65100',
    borderWidth: 1,
  },
  messageText: {
    fontSize: 16,
    color: '#fff',
    lineHeight: 22,
  },
  userText: {
    color: '#fff',
  },
  systemText: {
    color: '#ff8888',
    fontStyle: 'italic',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    marginBottom: 8,
  },
  emptyHint: {
    fontSize: 14,
    color: '#444',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#333',
    backgroundColor: '#1a1a1a',
  },
  input: {
    flex: 1,
    backgroundColor: '#2a2a2a',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    paddingRight: 12,
    fontSize: 16,
    color: '#fff',
    maxHeight: 100,
    marginRight: 8,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e65100',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#444',
  },
  sendText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  abortButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f44336',
    alignItems: 'center',
    justifyContent: 'center',
  },
  abortText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
