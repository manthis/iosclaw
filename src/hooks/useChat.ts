import { useState, useEffect, useCallback, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { chat } from '../services/ChatService';
import { ChatMessage } from '../types';

export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const streamingMessageRef = useRef<{ id: string; content: string } | null>(null);

  // Set up stream listener
  useEffect(() => {
    const unsubscribe = chat.onStream((requestId, chunk, done) => {
      if (done) {
        // Finalize the streaming message
        if (streamingMessageRef.current) {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === streamingMessageRef.current?.id
                ? { ...m, streaming: false }
                : m
            )
          );
          streamingMessageRef.current = null;
        }
        setIsGenerating(false);
      } else if (chunk) {
        // Handle streaming chunk
        if (!streamingMessageRef.current) {
          // Create new assistant message
          const newId = uuidv4();
          streamingMessageRef.current = { id: newId, content: chunk };
          setMessages((prev) => [
            ...prev,
            {
              id: newId,
              role: 'assistant',
              content: chunk,
              timestamp: Date.now(),
              streaming: true,
            },
          ]);
        } else {
          // Append to existing message
          streamingMessageRef.current.content += chunk;
          const content = streamingMessageRef.current.content;
          const id = streamingMessageRef.current.id;
          setMessages((prev) =>
            prev.map((m) => (m.id === id ? { ...m, content } : m))
          );
        }
      }
    });

    return unsubscribe;
  }, []);

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim()) return;

    setError(null);

    // Add user message immediately
    const userMessage: ChatMessage = {
      id: uuidv4(),
      role: 'user',
      content: content.trim(),
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, userMessage]);

    try {
      setIsGenerating(true);
      await chat.sendMessage(content.trim());
    } catch (e) {
      const errorMsg = e instanceof Error ? e.message : 'Failed to send message';
      setError(errorMsg);
      setIsGenerating(false);

      // Add error as system message
      setMessages((prev) => [
        ...prev,
        {
          id: uuidv4(),
          role: 'system',
          content: `Error: ${errorMsg}`,
          timestamp: Date.now(),
        },
      ]);
    }
  }, []);

  const abort = useCallback(async () => {
    try {
      await chat.abort();
      setIsGenerating(false);
      // Mark streaming message as done
      if (streamingMessageRef.current) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === streamingMessageRef.current?.id
              ? { ...m, streaming: false, content: m.content + ' [aborted]' }
              : m
          )
        );
        streamingMessageRef.current = null;
      }
    } catch (e) {
      console.error('[useChat] Abort failed:', e);
    }
  }, []);

  const loadHistory = useCallback(async () => {
    try {
      const history = await chat.getHistory();
      setMessages(history);
    } catch (e) {
      console.error('[useChat] Failed to load history:', e);
    }
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
    streamingMessageRef.current = null;
  }, []);

  return {
    messages,
    isGenerating,
    error,
    sendMessage,
    abort,
    loadHistory,
    clearMessages,
  };
}
