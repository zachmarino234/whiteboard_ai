'use client';

import type { SelectionContext } from '@/lib/captureSelection';

interface SelectionPreviewProps {
  selection: SelectionContext;
  onClear: () => void;
}

export default function SelectionPreview({
  selection,
  onClear,
}: SelectionPreviewProps) {
  return (
    <div
      data-testid="selection-preview"
      className="flex items-center gap-2 rounded-lg border border-zinc-600 bg-zinc-800 p-2"
    >
      <img
        src={selection.imageDataUrl}
        alt="Selected region"
        className="h-12 max-w-[120px] rounded border border-zinc-600 object-contain"
      />
      <span className="flex-1 text-xs text-zinc-400">
        {selection.shapeIds.length} shape{selection.shapeIds.length !== 1 ? 's' : ''} selected
      </span>
      <button
        onClick={onClear}
        className="text-zinc-400 hover:text-white"
        aria-label="Clear selection"
        data-testid="clear-selection"
      >
        &times;
      </button>
    </div>
  );
}
