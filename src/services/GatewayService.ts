import { v4 as uuidv4 } from 'uuid';
import {
  ConnectChallenge,
  WsFrame,
  WsRequest,
  WsResponse,
  WsEvent,
  ConnectionStatus,
} from '../types';

const PROTOCOL_VERSION = 3;

type EventCallback = (event: WsEvent) => void;
type StatusCallback = (status: ConnectionStatus) => void;

interface PendingRequest {
  resolve: (response: WsResponse) => void;
  reject: (error: Error) => void;
}

export class GatewayService {
  private ws: WebSocket | null = null;
  private pendingRequests: Map<string, PendingRequest> = new Map();
  private eventCallbacks: Map<string, EventCallback[]> = new Map();
  private statusCallbacks: StatusCallback[] = [];
  private status: ConnectionStatus = 'disconnected';
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private config: { url: string; token: string } | null = null;
  private challengeNonce: string | null = null;

  async connect(url: string, token: string): Promise<void> {
    this.config = { url, token };
    this.setStatus('connecting');

    return new Promise((resolve, reject) => {
      try {
        // React Native's WebSocket doesn't support custom headers,
        // so we pass the token as a query parameter
        const wsUrl = `${url}?token=${encodeURIComponent(token)}`;
        this.ws = new WebSocket(wsUrl);

        const timeout = setTimeout(() => {
          reject(new Error('Connection timeout'));
          this.disconnect();
        }, 10000);

        this.ws.onopen = () => {
          console.log('[Gateway] WebSocket connected, waiting for challenge...');
        };

        this.ws.onmessage = async (event) => {
          try {
            const frame: WsFrame = JSON.parse(event.data);
            
            // Handle connect challenge
            if (frame.type === 'event' && frame.event === 'connect.challenge') {
              const challenge = frame.payload as unknown as ConnectChallenge;
              this.challengeNonce = challenge.nonce;
              console.log('[Gateway] Received challenge, sending connect...');
              
              // Send connect request
              const connectRequest = this.buildConnectRequest(token);
              this.ws?.send(JSON.stringify(connectRequest));
            }
            // Handle connect response
            else if (frame.type === 'res' && frame.payload?.type === 'hello-ok') {
              clearTimeout(timeout);
              this.setStatus('connected');
              console.log('[Gateway] Connected successfully!');
              resolve();
            }
            // Handle regular responses
            else if (frame.type === 'res') {
              this.handleResponse(frame);
            }
            // Handle events
            else if (frame.type === 'event') {
              this.handleEvent(frame);
            }
          } catch (e) {
            console.error('[Gateway] Failed to parse message:', e);
          }
        };

        this.ws.onerror = (error) => {
          console.error('[Gateway] WebSocket error:', error);
          clearTimeout(timeout);
          this.setStatus('error');
          reject(new Error('WebSocket error'));
        };

        this.ws.onclose = () => {
          console.log('[Gateway] WebSocket closed');
          this.setStatus('disconnected');
          this.scheduleReconnect();
        };
      } catch (e) {
        this.setStatus('error');
        reject(e);
      }
    });
  }

  private buildConnectRequest(token: string): WsRequest {
    return {
      type: 'req',
      id: uuidv4(),
      method: 'connect',
      params: {
        minProtocol: PROTOCOL_VERSION,
        maxProtocol: PROTOCOL_VERSION,
        client: {
          id: 'iosclaw',
          version: '1.0.0',
          platform: 'ios',
          mode: 'operator',
        },
        role: 'operator',
        scopes: ['operator.read', 'operator.write'],
        caps: [],
        commands: [],
        permissions: {},
        auth: { token },
        locale: 'en-US',
        userAgent: 'iosclaw/1.0.0',
      },
    };
  }

  disconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.config = null;
    this.setStatus('disconnected');
  }

  private scheduleReconnect(): void {
    if (!this.config) return;
    
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }
    
    console.log('[Gateway] Scheduling reconnect in 5s...');
    this.reconnectTimer = setTimeout(() => {
      if (this.config) {
        console.log('[Gateway] Attempting reconnect...');
        this.connect(this.config.url, this.config.token).catch(console.error);
      }
    }, 5000);
  }

  async request(method: string, params?: Record<string, unknown>): Promise<WsResponse> {
    if (!this.ws || this.status !== 'connected') {
      throw new Error('Not connected to gateway');
    }

    return new Promise((resolve, reject) => {
      const id = uuidv4();
      const request: WsRequest = {
        type: 'req',
        id,
        method,
        params,
      };

      this.pendingRequests.set(id, { resolve, reject });

      const timeout = setTimeout(() => {
        this.pendingRequests.delete(id);
        reject(new Error(`Request timeout: ${method}`));
      }, 30000);

      // Wrap the resolve to clear timeout
      const originalResolve = this.pendingRequests.get(id)!.resolve;
      this.pendingRequests.set(id, {
        resolve: (response) => {
          clearTimeout(timeout);
          originalResolve(response);
        },
        reject,
      });

      this.ws!.send(JSON.stringify(request));
    });
  }

  private handleResponse(response: WsResponse): void {
    const pending = this.pendingRequests.get(response.id);
    if (pending) {
      this.pendingRequests.delete(response.id);
      pending.resolve(response);
    }
  }

  private handleEvent(event: WsEvent): void {
    const callbacks = this.eventCallbacks.get(event.event) || [];
    const wildcardCallbacks = this.eventCallbacks.get('*') || [];
    
    [...callbacks, ...wildcardCallbacks].forEach((cb) => {
      try {
        cb(event);
      } catch (e) {
        console.error('[Gateway] Event callback error:', e);
      }
    });
  }

  on(event: string, callback: EventCallback): () => void {
    const callbacks = this.eventCallbacks.get(event) || [];
    callbacks.push(callback);
    this.eventCallbacks.set(event, callbacks);

    return () => {
      const cbs = this.eventCallbacks.get(event) || [];
      const index = cbs.indexOf(callback);
      if (index > -1) cbs.splice(index, 1);
    };
  }

  onStatusChange(callback: StatusCallback): () => void {
    this.statusCallbacks.push(callback);
    callback(this.status);
    return () => {
      const index = this.statusCallbacks.indexOf(callback);
      if (index > -1) this.statusCallbacks.splice(index, 1);
    };
  }

  private setStatus(status: ConnectionStatus): void {
    this.status = status;
    this.statusCallbacks.forEach((cb) => cb(status));
  }

  getStatus(): ConnectionStatus {
    return this.status;
  }

  isConnected(): boolean {
    return this.status === 'connected';
  }
}

// Singleton instance
export const gateway = new GatewayService();
