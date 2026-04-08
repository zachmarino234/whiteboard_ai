'use client';

import { useState, useCallback } from 'react';
import type { ChatMessage, AIAction } from './types';
import type { SelectionContext } from './captureSelection';
import { parseAIResponse } from './parseAIResponse';

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

      const assistantId = nextId();

      setMessages((prev) => [...prev, userMessage]);
      setIsLoading(true);
      setError(null);

      try {
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
          throw new Error(errData?.error || `API error: ${res.status}`);
        }

        // Read the SSE stream silently — only show thinking dots during this phase
        const reader = res.body?.getReader();
        if (!reader) throw new Error('No response stream');

        const decoder = new TextDecoder();
        let fullText = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            const json = line.slice(6);

            let event: { type: string; text?: string; error?: string };
            try {
              event = JSON.parse(json);
            } catch {
              continue;
            }

            if (event.type === 'delta' && event.text) {
              fullText += event.text;
            } else if (event.type === 'error') {
              throw new Error(event.error || 'Stream error');
            }
          }
        }

        // Parse the complete response for actions
        const parsed = parseAIResponse(fullText);

        // Add the assistant message with typing animation
        setMessages((prev) => [
          ...prev,
          {
            id: assistantId,
            role: 'assistant',
            content: parsed.message,
            timestamp: Date.now(),
            animate: true,
          },
        ]);

        return parsed.actions;
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
