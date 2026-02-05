import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { ConnectionConfig, ConnectionStatus } from '../types';

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

  const isConnecting = status === 'connecting';

  const handleConnect = async () => {
    if (!url.trim() || !token.trim()) {
      setLocalError('URL and token are required');
      return;
    }

    setLocalError(null);
    try {
      await onConnect(url.trim(), token.trim());
    } catch {
      // Error handled by parent
    }
  };

  const displayError = localError || error;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        <Text style={styles.title}>🦞 iOSclaw</Text>
        <Text style={styles.subtitle}>OpenClaw Gateway Client</Text>

        <View style={styles.form}>
          <Text style={styles.label}>Gateway URL</Text>
          <TextInput
            style={styles.input}
            value={url}
            onChangeText={setUrl}
            placeholder="wss://hal9000.local:18789"
            placeholderTextColor="#666"
            autoCapitalize="none"
            autoCorrect={false}
            editable={!isConnecting}
          />

          <Text style={styles.label}>Token</Text>
          <TextInput
            style={styles.input}
            value={token}
            onChangeText={setToken}
            placeholder="Enter your gateway token"
            placeholderTextColor="#666"
            autoCapitalize="none"
            autoCorrect={false}
            secureTextEntry
            editable={!isConnecting}
          />

          {displayError && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{displayError}</Text>
            </View>
          )}

          <TouchableOpacity
            style={[styles.button, isConnecting && styles.buttonDisabled]}
            onPress={handleConnect}
            disabled={isConnecting}
          >
            {isConnecting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Connect</Text>
            )}
          </TouchableOpacity>
        </View>

        <Text style={styles.hint}>
          Make sure the Gateway is running and accessible on your local network.
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
    marginBottom: 40,
  },
  form: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 20,
  },
  label: {
    fontSize: 14,
    color: '#aaa',
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    padding: 14,
    fontSize: 16,
    color: '#fff',
    borderWidth: 1,
    borderColor: '#333',
  },
  errorContainer: {
    backgroundColor: '#ff4444',
    borderRadius: 8,
    padding: 12,
    marginTop: 16,
  },
  errorText: {
    color: '#fff',
    fontSize: 14,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#e65100',
    borderRadius: 8,
    padding: 16,
    marginTop: 24,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#663300',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  hint: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginTop: 24,
    paddingHorizontal: 20,
  },
});
