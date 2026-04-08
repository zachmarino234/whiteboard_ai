'use client';

import { useState, useCallback } from 'react';
import type { ChatMessage, AIAction, AIResponse } from './types';
import type { SelectionContext } from './captureSelection';

interface UseChatStateReturn {
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
  sendMessage: (
    text: string,
    selectionContext?: SelectionContext | null
  ) => Promise<AIAction[]>;
  clearMessages: () => void;
  clearError: () => void;
}

let messageCounter = 0;
function nextId(): string {
  return `msg-${Date.now()}-${++messageCounter}`;
}

export function useChatState(): UseChatStateReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = useCallback(
    async (
      text: string,
      selectionContext?: SelectionContext | null
    ): Promise<AIAction[]> => {
      const userMessage: ChatMessage = {
        id: nextId(),
        role: 'user',
        content: text,
        lassoContext: selectionContext
          ? {
              imageDataUrl: selectionContext.imageDataUrl,
              boundingBox: selectionContext.boundingBox,
            }
          : undefined,
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setIsLoading(true);
      setError(null);

      try {
        // Build the messages array for the API (all history + new message)
        const apiMessages = [...messages, userMessage].map((m) => ({
          role: m.role,
          content: m.content,
        }));

        const body: Record<string, unknown> = { messages: apiMessages };

        if (selectionContext) {
          body.lassoImage = selectionContext.imageDataUrl;
          body.boundingBox = selectionContext.boundingBox;
        }

        const res = await fetch('/api/tutor', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => null);
          throw new Error(
            errData?.error || `API error: ${res.status}`
          );
        }

        const data: AIResponse = await res.json();

        const assistantMessage: ChatMessage = {
          id: nextId(),
          role: 'assistant',
          content: data.message,
          timestamp: Date.now(),
        };

        setMessages((prev) => [...prev, assistantMessage]);
        return data.actions;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Something went wrong';
        setError(message);
        return [];
      } finally {
        setIsLoading(false);
      }
    },
    [messages]
  );

  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return { messages, isLoading, error, sendMessage, clearMessages, clearError };
}
