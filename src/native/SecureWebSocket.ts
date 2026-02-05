import { NativeModules, NativeEventEmitter, Platform } from 'react-native';

interface SecureWebSocketModule {
  connect(url: string): void;
  send(message: string): void;
  close(): void;
}

const { SecureWebSocket: NativeSecureWebSocket } = NativeModules;

type EventCallback = (data: any) => void;

/**
 * SecureWebSocket - Native WebSocket implementation with custom SSL certificate trust
 * This is used on iOS to connect to servers with self-signed certificates
 */
class SecureWebSocket {
  private eventEmitter: NativeEventEmitter | null = null;
  private subscriptions: any[] = [];
  private onOpenCallback: EventCallback | null = null;
  private onMessageCallback: EventCallback | null = null;
  private onCloseCallback: EventCallback | null = null;
  private onErrorCallback: EventCallback | null = null;

  constructor(url: string) {
    if (Platform.OS === 'ios' && NativeSecureWebSocket) {
      this.eventEmitter = new NativeEventEmitter(NativeSecureWebSocket);
      this.setupEventListeners();
      NativeSecureWebSocket.connect(url);
    } else {
      // Fall back to standard WebSocket on Android or if native module unavailable
      console.warn('[SecureWebSocket] Native module not available, using standard WebSocket');
      const ws = new WebSocket(url);
      this.setupStandardWebSocket(ws);
    }
  }

  private setupEventListeners() {
    if (!this.eventEmitter) return;

    this.subscriptions.push(
      this.eventEmitter.addListener('onOpen', () => {
        console.log('[SecureWebSocket] Connected');
        this.onOpenCallback?.({});
      })
    );

    this.subscriptions.push(
      this.eventEmitter.addListener('onMessage', (event: { data: string }) => {
        this.onMessageCallback?.({ data: event.data });
      })
    );

    this.subscriptions.push(
      this.eventEmitter.addListener('onClose', (event: { code: number; reason: string }) => {
        console.log('[SecureWebSocket] Closed:', event.code, event.reason);
        this.onCloseCallback?.(event);
      })
    );

    this.subscriptions.push(
      this.eventEmitter.addListener('onError', (event: { message: string }) => {
        console.error('[SecureWebSocket] Error:', event.message);
        this.onErrorCallback?.({ message: event.message });
      })
    );
  }

  private setupStandardWebSocket(ws: WebSocket) {
    ws.onopen = () => this.onOpenCallback?.({});
    ws.onmessage = (event) => this.onMessageCallback?.({ data: event.data });
    ws.onclose = (event) => this.onCloseCallback?.({ code: event.code, reason: event.reason });
    ws.onerror = (event) => this.onErrorCallback?.({ message: 'WebSocket error' });
  }

  set onopen(callback: EventCallback | null) {
    this.onOpenCallback = callback;
  }

  set onmessage(callback: EventCallback | null) {
    this.onMessageCallback = callback;
  }

  set onclose(callback: EventCallback | null) {
    this.onCloseCallback = callback;
  }

  set onerror(callback: EventCallback | null) {
    this.onErrorCallback = callback;
  }

  send(data: string) {
    if (Platform.OS === 'ios' && NativeSecureWebSocket) {
      NativeSecureWebSocket.send(data);
    }
  }

  close() {
    if (Platform.OS === 'ios' && NativeSecureWebSocket) {
      NativeSecureWebSocket.close();
    }
    this.subscriptions.forEach((sub) => sub.remove());
    this.subscriptions = [];
  }
}

/**
 * Check if SecureWebSocket native module is available
 */
export function isSecureWebSocketAvailable(): boolean {
  return Platform.OS === 'ios' && !!NativeSecureWebSocket;
}

/**
 * Create a WebSocket connection with SSL trust support
 * Uses native SecureWebSocket on iOS, falls back to standard WebSocket elsewhere
 */
export function createSecureWebSocket(url: string): SecureWebSocket | WebSocket {
  if (isSecureWebSocketAvailable()) {
    console.log('[SecureWebSocket] Using native SecureWebSocket for SSL trust');
    return new SecureWebSocket(url);
  }
  console.log('[SecureWebSocket] Using standard WebSocket');
  return new WebSocket(url);
}

export default SecureWebSocket;
