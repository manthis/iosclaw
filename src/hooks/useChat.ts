import { useState, useEffect, useCallback, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { chat } from '../services/ChatService';
import { ChatMessage } from '../types';

export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const streamingMessageRef = useRef<{ id: string; content: string } | null>(null);
  const generatingStartTime = useRef<number>(0);
  const MIN_TYPING_INDICATOR_MS = 800; // Show typing indicator for at least 800ms

  // Set up stream listener FIRST - before anything else
  useEffect(() => {
    console.log('[useChat] Setting up stream listener');
    const unsubscribe = chat.onStream((requestId, chunk, done) => {
      console.log('[useChat] Stream callback:', { requestId, chunkLen: chunk?.length, done });
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
        // Ensure typing indicator shows for minimum time
        const elapsed = Date.now() - generatingStartTime.current;
        const remainingTime = Math.max(0, MIN_TYPING_INDICATOR_MS - elapsed);
        setTimeout(() => setIsGenerating(false), remainingTime);
      } else if (chunk) {
        // Handle streaming chunk
        if (!streamingMessageRef.current) {
          // Create new assistant message
          const newId = uuidv4();
          console.log('[useChat] Creating new assistant message:', { newId, chunkPreview: chunk.slice(0, 50) });
          streamingMessageRef.current = { id: newId, content: chunk };
          setMessages((prev) => {
            console.log('[useChat] Adding message, prev count:', prev.length);
            return [
              ...prev,
              {
                id: newId,
                role: 'assistant',
                content: chunk,
                timestamp: Date.now(),
                streaming: true,
              },
            ];
          });
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

  // Poll for missed responses every few seconds while generating
  useEffect(() => {
    if (!isGenerating) return;

    const pollInterval = setInterval(async () => {
      console.log('[useChat] Polling for response...');
      try {
        const history = await chat.getHistory(undefined, 5);
        // Check if we got a new assistant message
        const lastAssistant = history.filter(m => m.role === 'assistant').pop();
        if (lastAssistant && !messages.find(m => m.content === lastAssistant.content)) {
          console.log('[useChat] Found new response via polling:', lastAssistant.content.slice(0, 50));
          setMessages(prev => [...prev, lastAssistant]);
          setIsGenerating(false);
        }
      } catch (e) {
        console.error('[useChat] Poll failed:', e);
      }
    }, 2000);

    return () => clearInterval(pollInterval);
  }, [isGenerating, messages]);

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
      generatingStartTime.current = Date.now();
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
