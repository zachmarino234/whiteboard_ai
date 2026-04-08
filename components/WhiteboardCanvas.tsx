'use client';

import { Tldraw, type TLUiOverrides } from 'tldraw';
import 'tldraw/tldraw.css';
import 'katex/dist/katex.min.css';
import { LatexShapeUtil } from './shapes/LatexShape';
import { LatexShapeTool } from './shapes/LatexShapeTool';
import SelectionWatcher from './SelectionWatcher';
import type { SelectionContext } from '@/lib/captureSelection';

const customShapeUtils = [LatexShapeUtil];
const customTools = [LatexShapeTool];

const uiOverrides: TLUiOverrides = {
  tools(editor, tools) {
    tools.latex = {
      id: 'latex',
      icon: 'text' as const,
      label: 'LaTeX' as any,
      kbd: 'l',
      onSelect() {
        editor.setCurrentTool('latex');
      },
    };
    return tools;
  },
};

interface WhiteboardCanvasProps {
  onSelectionCapture?: (context: SelectionContext | null) => void;
}

export default function WhiteboardCanvas({
  onSelectionCapture,
}: WhiteboardCanvasProps) {
  return (
    <div className="absolute inset-0">
      <Tldraw
        inferDarkMode
        shapeUtils={customShapeUtils}
        tools={customTools}
        overrides={uiOverrides}
        onMount={(editor) => {
          editor.updateInstanceState({ isGridMode: true });
        }}
      >
        {onSelectionCapture && (
          <SelectionWatcher onSelectionCapture={onSelectionCapture} />
        )}
      </Tldraw>
    </div>
  );
}
