'use client';

import { useState, useRef, useEffect } from 'react';
import type { SelectionContext } from '@/lib/captureSelection';
import type { ChatMessage as ChatMessageType, AIAction } from '@/lib/types';
import SelectionPreview from './SelectionPreview';
import ChatMessage from './ChatMessage';
import ThinkingIndicator from './ThinkingIndicator';

interface ChatPanelProps {
  selectionContext?: SelectionContext | null;
  onClearSelection?: () => void;
  messages: ChatMessageType[];
  isLoading: boolean;
  error: string | null;
  onSendMessage: (
    text: string,
    selection?: SelectionContext | null
  ) => Promise<AIAction[]>;
  onClearMessages: () => void;
}

export default function ChatPanel({
  selectionContext,
  onClearSelection,
  messages,
  isLoading,
  error,
  onSendMessage,
  onClearMessages,
}: ChatPanelProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 z-50 rounded-full bg-zinc-800 px-4 py-2 text-sm text-white shadow-lg hover:bg-zinc-700"
      >
        Chat
      </button>
    );
  }

  const hasSelection =
    selectionContext !== null && selectionContext !== undefined;
  const canSend = input.trim().length > 0 && !isLoading;

  const handleSubmit = async () => {
    if (!canSend) return;
    const text = input.trim();
    setInput('');
    await onSendMessage(text, selectionContext);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 flex h-96 w-80 flex-col rounded-xl border border-zinc-700 bg-zinc-900 shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-700 px-4 py-3">
        <span className="text-sm font-medium text-white">AI Tutor</span>
        <div className="flex items-center gap-2">
          {messages.length > 0 && (
            <button
              onClick={onClearMessages}
              className="text-xs text-zinc-500 hover:text-zinc-300"
              title="Clear chat"
            >
              Clear
            </button>
          )}
          <button
            onClick={() => setIsOpen(false)}
            className="text-zinc-400 hover:text-white"
          >
            &times;
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <p className="text-center text-xs text-zinc-500">
            Select something on the canvas and ask a question.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {messages.map((msg) => (
              <ChatMessage key={msg.id} message={msg} />
            ))}
            {isLoading && <ThinkingIndicator />}
            <div ref={messagesEndRef} />
          </div>
        )}
        {error && (
          <p className="mt-2 text-center text-xs text-red-400" data-testid="chat-error">
            {error}
          </p>
        )}
      </div>

      {/* Input */}
      <div className="border-t border-zinc-700 p-3">
        {hasSelection && (
          <div className="mb-2">
            <SelectionPreview
              selection={selectionContext}
              onClear={() => onClearSelection?.()}
            />
          </div>
        )}
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              hasSelection
                ? 'Ask about this selection...'
                : 'Ask a question...'
            }
            className="flex-1 rounded-lg border border-zinc-600 bg-zinc-800 px-3 py-2 text-sm text-white placeholder-zinc-500 outline-none focus:border-zinc-500"
            disabled={isLoading}
          />
          <button
            onClick={handleSubmit}
            className={`rounded-lg bg-blue-600 px-3 py-2 text-sm text-white ${
              canSend ? 'hover:bg-blue-500' : 'opacity-50'
            }`}
            disabled={!canSend}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
