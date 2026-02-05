// OpenClaw Gateway Protocol Types

export interface ConnectChallenge {
  nonce: string;
  ts: number;
}

export interface ConnectParams {
  minProtocol: number;
  maxProtocol: number;
  client: {
    id: string;
    version: string;
    platform: string;
    mode: string;
  };
  role: string;
  scopes: string[];
  caps: string[];
  commands: string[];
  permissions: Record<string, boolean>;
  auth: { token: string };
  locale: string;
  userAgent: string;
}

export interface WsRequest {
  type: 'req';
  id: string;
  method: string;
  params?: Record<string, unknown>;
}

export interface WsResponse {
  type: 'res';
  id: string;
  ok: boolean;
  payload?: Record<string, unknown>;
  error?: { code: number; message: string };
}

export interface WsEvent {
  type: 'event';
  event: string;
  payload?: Record<string, unknown>;
  seq?: number;
  stateVersion?: number;
}

export type WsFrame = WsRequest | WsResponse | WsEvent;

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  streaming?: boolean;
}

export interface ConnectionConfig {
  gatewayUrl: string;
  token: string;
}

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';
