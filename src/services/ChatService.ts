import { v4 as uuidv4 } from 'uuid';
import { gateway } from './GatewayService';
import { ChatMessage, WsEvent } from '../types';

type StreamCallback = (id: string, chunk: string, done: boolean) => void;

export class ChatService {
  private streamCallbacks: StreamCallback[] = [];
  private currentSessionKey: string = 'agent:main:main';
  private currentRunId: string | null = null;
  private unsubscribe: (() => void) | null = null;
  private lastMessageCount: number = 0;

  constructor() {
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    // Listen for chat events to know when agent is done
    this.unsubscribe = gateway.on('*', (event: WsEvent) => {
      this.handleGatewayEvent(event);
    });
  }

  private handleGatewayEvent(event: WsEvent): void {
    const payload = event.payload as Record<string, unknown>;

    // Listen for chat completion event
    if (event.event === 'chat' && payload.state === 'final') {
      const runId = payload.runId as string;
      if (runId === this.currentRunId) {
        console.log('[Chat] Agent completed, fetching response...');
        this.fetchAndEmitResponse();
      }
    }
  }

  private async fetchAndEmitResponse(): Promise<void> {
    try {
      const history = await this.fetchRawHistory(10);
      
      // Find the latest assistant message
      for (let i = history.length - 1; i >= 0; i--) {
        const msg = history[i];
        if (msg.role === 'assistant') {
          // Extract text content from the message
          const text = this.extractTextContent(msg.content);
          if (text) {
            console.log('[Chat] Got response:', text.slice(0, 100));
            console.log('[Chat] Callback count:', this.streamCallbacks.length);
            const responseId = uuidv4();
            // Emit the full response at once
            this.streamCallbacks.forEach((cb, i) => {
              console.log('[Chat] Calling callback', i, 'with text length:', text.length);
              cb(responseId, text, false);
              cb(responseId, '', true);
            });
            break;
          }
        }
      }
    } catch (e) {
      console.error('[Chat] Failed to fetch response:', e);
    }
    this.currentRunId = null;
  }

  private extractTextContent(content: unknown): string {
    if (typeof content === 'string') {
      return content;
    }
    if (Array.isArray(content)) {
      // Find text blocks in the content array
      const textParts: string[] = [];
      for (const block of content) {
        if (block && typeof block === 'object') {
          if ('type' in block && block.type === 'text' && 'text' in block) {
            textParts.push(block.text as string);
          }
        }
      }
      return textParts.join('\n');
    }
    return '';
  }

  private async fetchRawHistory(limit: number): Promise<Array<{
    role: string;
    content: unknown;
    timestamp?: number;
  }>> {
    const response = await gateway.request('chat.history', {
      sessionKey: this.currentSessionKey,
      limit,
    });

    if (!response.ok) {
      throw new Error(response.error?.message || 'Failed to get history');
    }

    return (response.payload?.messages as Array<{
      role: string;
      content: unknown;
      timestamp?: number;
    }>) || [];
  }

  async sendMessage(content: string, sessionKey?: string): Promise<string> {
    if (!gateway.isConnected()) {
      throw new Error('Not connected to gateway');
    }

    const idempotencyKey = uuidv4();
    this.currentRunId = idempotencyKey;
    this.currentSessionKey = sessionKey || this.currentSessionKey;

    try {
      console.log('[Chat] Sending message...');
      const response = await gateway.request('chat.send', {
        message: content,
        sessionKey: this.currentSessionKey,
        idempotencyKey,
      });

      if (!response.ok) {
        throw new Error(response.error?.message || 'Failed to send message');
      }

      // The runId from response should match our idempotencyKey
      const runId = (response.payload as Record<string, unknown>)?.runId as string;
      if (runId) {
        this.currentRunId = runId;
      }

      console.log('[Chat] Message sent, waiting for response... runId:', this.currentRunId);
      return idempotencyKey;
    } catch (e) {
      this.currentRunId = null;
      throw e;
    }
  }

  async abort(): Promise<void> {
    if (!this.currentRunId) return;

    try {
      await gateway.request('chat.abort', {
        runId: this.currentRunId,
      });
    } catch (e) {
      console.error('[Chat] Abort failed:', e);
    }
    this.currentRunId = null;
  }

  async getHistory(sessionKey?: string, limit = 50): Promise<ChatMessage[]> {
    if (!gateway.isConnected()) {
      throw new Error('Not connected to gateway');
    }

    const history = await this.fetchRawHistory(limit);

    // Convert to ChatMessage format, extracting text from content
    return history
      .filter((m) => m.role === 'user' || m.role === 'assistant')
      .map((m) => ({
        id: uuidv4(),
        role: m.role as 'user' | 'assistant',
        content: this.extractTextContent(m.content) || '[No text content]',
        timestamp: m.timestamp || Date.now(),
      }))
      .filter((m) => m.content && m.content !== '[No text content]');
  }

  onStream(callback: StreamCallback): () => void {
    this.streamCallbacks.push(callback);
    return () => {
      const index = this.streamCallbacks.indexOf(callback);
      if (index > -1) this.streamCallbacks.splice(index, 1);
    };
  }

  setSessionKey(sessionKey: string): void {
    this.currentSessionKey = sessionKey;
  }

  getSessionKey(): string {
    return this.currentSessionKey;
  }

  isGenerating(): boolean {
    return this.currentRunId !== null;
  }

  destroy(): void {
    if (this.unsubscribe) {
      this.unsubscribe();
    }
    this.streamCallbacks = [];
  }
}

// Singleton instance
export const chat = new ChatService();
