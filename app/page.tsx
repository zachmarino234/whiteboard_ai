'use client';

import { useCallback, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import type { Editor } from '@tldraw/editor';
import ChatPanel from '@/components/ChatPanel';
import type { SelectionContext } from '@/lib/captureSelection';
import { useChatState } from '@/lib/useChatState';
import { executeAIActions, clearAIAnnotations } from '@/lib/executeAIActions';
import type { AIAction } from '@/lib/types';

const WhiteboardCanvas = dynamic(() => import('@/components/WhiteboardCanvas'), {
  ssr: false,
});

export default function Home() {
  const [selectionContext, setSelectionContext] =
    useState<SelectionContext | null>(null);
  const editorRef = useRef<Editor | null>(null);

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

  const handleEditorReady = useCallback((editor: Editor) => {
    editorRef.current = editor;
  }, []);

  const handleSendMessage = useCallback(
    async (
      text: string,
      selection?: SelectionContext | null
    ): Promise<AIAction[]> => {
      const actions = await sendMessage(text, selection);
      if (actions.length > 0 && editorRef.current) {
        executeAIActions(editorRef.current, actions);
      }
      return actions;
    },
    [sendMessage]
  );

  const handleClearMessages = useCallback(() => {
    clearMessages();
  }, [clearMessages]);

  const handleClearAnnotations = useCallback(() => {
    if (editorRef.current) {
      clearAIAnnotations(editorRef.current);
    }
  }, []);

  return (
    <main className="relative h-screen w-screen overflow-hidden bg-zinc-950">
      <WhiteboardCanvas
        onSelectionCapture={handleSelectionCapture}
        onEditorReady={handleEditorReady}
      />
      <ChatPanel
        selectionContext={selectionContext}
        onClearSelection={handleClearSelection}
        messages={messages}
        isLoading={isLoading}
        error={error}
        onSendMessage={handleSendMessage}
        onClearMessages={handleClearMessages}
        onClearAnnotations={handleClearAnnotations}
      />
    </main>
  );
}
