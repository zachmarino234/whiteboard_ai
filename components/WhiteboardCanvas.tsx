'use client';

import { Tldraw, DefaultStylePanel, type TLUiOverrides, type TLComponents } from 'tldraw';
import type { Editor } from '@tldraw/editor';
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

function RepositionedStylePanel() {
  return (
    <div className="absolute top-14 left-2 z-40">
      <DefaultStylePanel />
    </div>
  );
}

const components: TLComponents = {
  StylePanel: RepositionedStylePanel,
};

interface WhiteboardCanvasProps {
  onSelectionCapture?: (context: SelectionContext | null) => void;
  onEditorReady?: (editor: Editor) => void;
}

export default function WhiteboardCanvas({
  onSelectionCapture,
  onEditorReady,
}: WhiteboardCanvasProps) {
  return (
    <div className="absolute inset-0">
      <Tldraw
        inferDarkMode
        shapeUtils={customShapeUtils}
        tools={customTools}
        overrides={uiOverrides}
        components={components}
        onMount={(editor) => {
          editor.updateInstanceState({ isGridMode: true });
          onEditorReady?.(editor);
        }}
      >
        {onSelectionCapture && (
          <SelectionWatcher onSelectionCapture={onSelectionCapture} />
        )}
      </Tldraw>
    </div>
  );
}
