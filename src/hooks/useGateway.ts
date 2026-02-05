import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { gateway } from '../services/GatewayService';
import { ConnectionStatus, ConnectionConfig } from '../types';

const STORAGE_KEY = 'iosclaw_config';

const DEFAULT_CONFIG: ConnectionConfig = {
  gatewayUrl: 'wss://hal9000.local:18789',
  token: 'fc7215d9aaa1dbd1b1cacd1a28b09165b110878d1c2a8cfd',
};

export function useGateway() {
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');
  const [config, setConfig] = useState<ConnectionConfig>(DEFAULT_CONFIG);
  const [error, setError] = useState<string | null>(null);
  const [configLoaded, setConfigLoaded] = useState(false);

  // Load saved config on mount
  useEffect(() => {
    const loadConfig = async () => {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved) as ConnectionConfig;
          setConfig(parsed);
        }
      } catch (e) {
        console.error('[useGateway] Failed to load config:', e);
      }
      setConfigLoaded(true);
    };
    loadConfig();
  }, []);

  // Subscribe to status changes
  useEffect(() => {
    const unsubscribe = gateway.onStatusChange(setStatus);
    return unsubscribe;
  }, []);

  // Save config when it changes
  const saveConfig = useCallback(async (newConfig: ConnectionConfig) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newConfig));
      setConfig(newConfig);
    } catch (e) {
      console.error('[useGateway] Failed to save config:', e);
    }
  }, []);

  const connect = useCallback(async (url?: string, token?: string) => {
    const connectUrl = url || config.gatewayUrl;
    const connectToken = token || config.token;

    setError(null);

    try {
      await gateway.connect(connectUrl, connectToken);
      // Save on successful connect
      await saveConfig({ gatewayUrl: connectUrl, token: connectToken });
    } catch (e) {
      const errorMsg = e instanceof Error ? e.message : 'Connection failed';
      setError(errorMsg);
      throw e;
    }
  }, [config, saveConfig]);

  const disconnect = useCallback(() => {
    gateway.disconnect();
    setError(null);
  }, []);

  return {
    status,
    config,
    error,
    configLoaded,
    connect,
    disconnect,
    saveConfig,
    isConnected: status === 'connected',
    isConnecting: status === 'connecting',
  };
}
