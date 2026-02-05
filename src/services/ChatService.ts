import { v4 as uuidv4 } from 'uuid';
import { gateway } from './GatewayService';
import { ChatMessage, WsEvent } from '../types';

type MessageCallback = (message: ChatMessage) => void;
type StreamCallback = (id: string, chunk: string, done: boolean) => void;

export class ChatService {
  private messageCallbacks: MessageCallback[] = [];
  private streamCallbacks: StreamCallback[] = [];
  private currentSessionId: string | null = null;
  private currentRequestId: string | null = null;
  private unsubscribe: (() => void) | null = null;

  constructor() {
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    // Listen for all events with wildcard
    this.unsubscribe = gateway.on('*', (event: WsEvent) => {
      this.handleGatewayEvent(event);
    });
  }

  private handleGatewayEvent(event: WsEvent): void {
    const payload = event.payload as Record<string, unknown>;

    switch (event.event) {
      case 'chat.chunk':
        // Streaming response chunk
        if (payload.text) {
          this.streamCallbacks.forEach((cb) => {
            cb(
              payload.requestId as string || this.currentRequestId || '',
              payload.text as string,
              false
            );
          });
        }
        break;

      case 'chat.done':
        // Response completed
        this.streamCallbacks.forEach((cb) => {
          cb(
            payload.requestId as string || this.currentRequestId || '',
            '',
            true
          );
        });
        this.currentRequestId = null;
        break;

      case 'chat.error':
        console.error('[Chat] Error:', payload.error);
        this.streamCallbacks.forEach((cb) => {
          cb(
            payload.requestId as string || this.currentRequestId || '',
            `Error: ${payload.error || 'Unknown error'}`,
            true
          );
        });
        this.currentRequestId = null;
        break;

      case 'agent.text':
        // Agent text output (streaming)
        if (payload.text) {
          this.streamCallbacks.forEach((cb) => {
            cb(
              payload.requestId as string || this.currentRequestId || '',
              payload.text as string,
              false
            );
          });
        }
        break;

      case 'agent.done':
        // Agent completed
        this.streamCallbacks.forEach((cb) => {
          cb(
            payload.requestId as string || this.currentRequestId || '',
            '',
            true
          );
        });
        this.currentRequestId = null;
        break;

      default:
        // Log other events for debugging
        if (event.event.startsWith('chat.') || event.event.startsWith('agent.')) {
          console.log('[Chat] Event:', event.event, payload);
        }
        break;
    }
  }

  async sendMessage(content: string, sessionId?: string): Promise<string> {
    if (!gateway.isConnected()) {
      throw new Error('Not connected to gateway');
    }

    const requestId = uuidv4();
    this.currentRequestId = requestId;
    this.currentSessionId = sessionId || this.currentSessionId || 'default';

    try {
      const response = await gateway.request('chat.send', {
        message: content,
        sessionId: this.currentSessionId,
        requestId,
        stream: true,
      });

      if (!response.ok) {
        throw new Error(response.error?.message || 'Failed to send message');
      }

      return requestId;
    } catch (e) {
      this.currentRequestId = null;
      throw e;
    }
  }

  async abort(): Promise<void> {
    if (!this.currentRequestId) return;

    try {
      await gateway.request('chat.abort', {
        requestId: this.currentRequestId,
      });
    } catch (e) {
      console.error('[Chat] Abort failed:', e);
    }
    this.currentRequestId = null;
  }

  async getHistory(sessionId?: string, limit = 50): Promise<ChatMessage[]> {
    if (!gateway.isConnected()) {
      throw new Error('Not connected to gateway');
    }

    const response = await gateway.request('chat.history', {
      sessionId: sessionId || this.currentSessionId || 'default',
      limit,
    });

    if (!response.ok) {
      throw new Error(response.error?.message || 'Failed to get history');
    }

    const messages = (response.payload?.messages as Array<{
      id: string;
      role: 'user' | 'assistant' | 'system';
      content: string;
      timestamp?: number;
    }>) || [];

    return messages.map((m) => ({
      id: m.id || uuidv4(),
      role: m.role,
      content: m.content,
      timestamp: m.timestamp || Date.now(),
    }));
  }

  onMessage(callback: MessageCallback): () => void {
    this.messageCallbacks.push(callback);
    return () => {
      const index = this.messageCallbacks.indexOf(callback);
      if (index > -1) this.messageCallbacks.splice(index, 1);
    };
  }

  onStream(callback: StreamCallback): () => void {
    this.streamCallbacks.push(callback);
    return () => {
      const index = this.streamCallbacks.indexOf(callback);
      if (index > -1) this.streamCallbacks.splice(index, 1);
    };
  }

  setSessionId(sessionId: string): void {
    this.currentSessionId = sessionId;
  }

  getSessionId(): string | null {
    return this.currentSessionId;
  }

  isGenerating(): boolean {
    return this.currentRequestId !== null;
  }

  destroy(): void {
    if (this.unsubscribe) {
      this.unsubscribe();
    }
    this.messageCallbacks = [];
    this.streamCallbacks = [];
  }
}

// Singleton instance
export const chat = new ChatService();
