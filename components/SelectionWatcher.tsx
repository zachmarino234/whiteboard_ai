'use client';

import { useEditor, useReactor } from 'tldraw';
import { captureSelection } from '@/lib/captureSelection';
import type { SelectionContext } from '@/lib/captureSelection';

interface SelectionWatcherProps {
  onSelectionCapture: (context: SelectionContext | null) => void;
}

/**
 * Invisible component that lives inside the tldraw context.
 * Watches for selection changes and captures images of selected shapes.
 */
export default function SelectionWatcher({
  onSelectionCapture,
}: SelectionWatcherProps) {
  const editor = useEditor();

  useReactor(
    'watch-selection',
    () => {
      const selectedIds = editor.getSelectedShapeIds();

      if (selectedIds.length === 0) {
        onSelectionCapture(null);
        return;
      }

      // Capture asynchronously — the reactor tracks the reactive reads
      // (getSelectedShapeIds) and the async work happens outside.
      captureSelection(editor).then((context) => {
        onSelectionCapture(context);
      });
    },
    [editor, onSelectionCapture]
  );

  return null;
}
