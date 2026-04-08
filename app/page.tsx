'use client';

import { useCallback, useState } from 'react';
import dynamic from 'next/dynamic';
import ChatPanel from '@/components/ChatPanel';
import type { SelectionContext } from '@/lib/captureSelection';
import { useChatState } from '@/lib/useChatState';

const WhiteboardCanvas = dynamic(() => import('@/components/WhiteboardCanvas'), {
  ssr: false,
});

export default function Home() {
  const [selectionContext, setSelectionContext] =
    useState<SelectionContext | null>(null);

  const { messages, isLoading, error, sendMessage, clearMessages } =
    useChatState();

  const handleSelectionCapture = useCallback(
    (context: SelectionContext | null) => {
      setSelectionContext(context);
    },
    []
  );

  const handleClearSelection = useCallback(() => {
    setSelectionContext(null);
  }, []);

  return (
    <main className="relative h-screen w-screen overflow-hidden bg-zinc-950">
      <WhiteboardCanvas onSelectionCapture={handleSelectionCapture} />
      <ChatPanel
        selectionContext={selectionContext}
        onClearSelection={handleClearSelection}
        messages={messages}
        isLoading={isLoading}
        error={error}
        onSendMessage={sendMessage}
        onClearMessages={clearMessages}
      />
    </main>
  );
}
