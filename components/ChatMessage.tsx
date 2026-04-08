'use client';

import { useState, useEffect, useRef } from 'react';
import type { ChatMessage as ChatMessageType } from '@/lib/types';

interface ChatMessageProps {
  message: ChatMessageType;
}

const CHARS_PER_TICK = 3;
const TICK_MS = 16;

export default function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user';
  const [displayedLength, setDisplayedLength] = useState(
    message.animate ? 0 : message.content.length
  );
  const animatingId = useRef(message.id);

  useEffect(() => {
    if (!message.animate) {
      setDisplayedLength(message.content.length);
      return;
    }

    // Reset if this is a new message
    if (animatingId.current !== message.id) {
      animatingId.current = message.id;
      setDisplayedLength(0);
    }

    if (displayedLength >= message.content.length) return;

    const timer = setTimeout(() => {
      setDisplayedLength((prev) =>
        Math.min(prev + CHARS_PER_TICK, message.content.length)
      );
    }, TICK_MS);

    return () => clearTimeout(timer);
  }, [message.animate, message.id, message.content.length, displayedLength]);

  const visibleText = message.content.slice(0, displayedLength);
  const isTyping = message.animate && displayedLength < message.content.length;

  return (
    <div
      className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
      data-testid={`chat-message-${message.role}`}
    >
      <div
        className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
          isUser
            ? 'bg-blue-600 text-white'
            : 'bg-zinc-700 text-zinc-100'
        }`}
      >
        {message.lassoContext && (
          <img
            src={message.lassoContext.imageDataUrl}
            alt="Selection context"
            className="mb-2 max-h-24 rounded border border-zinc-500 object-contain"
          />
        )}
        <p className="whitespace-pre-wrap">
          {visibleText}
          {isTyping && (
            <span className="inline-block w-[2px] h-[1em] bg-zinc-300 align-text-bottom animate-pulse ml-0.5" />
          )}
        </p>
      </div>
    </div>
  );
}
