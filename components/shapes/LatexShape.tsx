'use client';

import { useRef, useEffect, useCallback } from 'react';
import {
  BaseBoxShapeUtil,
  Rectangle2d,
  TLBaseShape,
  TLResizeInfo,
  HTMLContainer,
  resizeBox,
} from '@tldraw/editor';
import type { Editor, RecordProps } from '@tldraw/editor';
import { T } from '@tldraw/validate';
import katex from 'katex';

// --- Shape type definition ---

export interface LatexShapeProps {
  w: number;
  h: number;
  latex: string;
  color: string;
  fontSize: number;
}

export type LatexShape = TLBaseShape<'latex', LatexShapeProps>;

export const latexShapeProps: RecordProps<LatexShape> = {
  w: T.nonZeroNumber,
  h: T.nonZeroNumber,
  latex: T.string,
  color: T.string,
  fontSize: T.positiveNumber,
};

// Register the shape type globally
declare module '@tldraw/tlschema' {
  interface TLGlobalShapePropsMap {
    latex: LatexShapeProps;
  }
}

// --- Shape util ---

export class LatexShapeUtil extends BaseBoxShapeUtil<LatexShape> {
  static override type = 'latex' as const;
  static override props = latexShapeProps;

  override getDefaultProps(): LatexShape['props'] {
    return {
      w: 200,
      h: 80,
      latex: 'E = mc^2',
      color: '#ffffff',
      fontSize: 24,
    };
  }

  override getGeometry(shape: LatexShape) {
    return new Rectangle2d({
      width: shape.props.w,
      height: shape.props.h,
      isFilled: false,
    });
  }

  override canEdit() {
    return true;
  }

  override canResize() {
    return true;
  }

  override onResize(shape: LatexShape, info: TLResizeInfo<LatexShape>) {
    const prevW = info.initialBounds.width;
    const newW = Math.max(1, prevW * info.scaleX);
    const newFontSize = shape.props.fontSize * (newW / prevW);
    return {
      ...resizeBox(shape, info),
      props: {
        ...shape.props,
        w: newW,
        h: Math.max(1, info.initialBounds.height * info.scaleY),
        fontSize: Math.max(8, newFontSize),
      },
    };
  }

  override component(shape: LatexShape) {
    const isEditing = this.editor.getEditingShapeId() === shape.id;

    if (isEditing) {
      return (
        <HTMLContainer>
          <LatexEditorInline
            latex={shape.props.latex}
            color={shape.props.color}
            fontSize={shape.props.fontSize}
            onChange={(newLatex) => {
              this.editor.updateShape<LatexShape>({
                id: shape.id,
                type: 'latex',
                props: { latex: newLatex },
              });
            }}
          />
        </HTMLContainer>
      );
    }

    return (
      <HTMLContainer>
        <LatexDisplay
          latex={shape.props.latex}
          color={shape.props.color}
          fontSize={shape.props.fontSize}
          shapeId={shape.id}
          editor={this.editor}
        />
      </HTMLContainer>
    );
  }

  override indicator(shape: LatexShape) {
    return (
      <rect
        width={shape.props.w}
        height={shape.props.h}
        rx={4}
        ry={4}
      />
    );
  }
}

// --- Render components ---

function LatexDisplay({
  latex,
  color,
  fontSize,
  shapeId,
  editor,
}: {
  latex: string;
  color: string;
  fontSize: number;
  shapeId: LatexShape['id'];
  editor: Editor;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const lastLatex = useRef(latex);
  const lastFontSize = useRef(fontSize);

  const measureAndResize = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    // Measure the actual rendered content size
    const contentW = el.scrollWidth;
    const contentH = el.scrollHeight;
    if (contentW <= 0 || contentH <= 0) return;

    const padding = 16;
    const newW = contentW + padding;
    const newH = contentH + padding;

    const shape = editor.getShape(shapeId);
    if (!shape) return;
    const props = (shape as LatexShape).props;
    // Only update if size differs meaningfully to avoid loops
    if (Math.abs(props.w - newW) > 3 || Math.abs(props.h - newH) > 3) {
      editor.updateShape({
        id: shapeId,
        type: 'latex',
        props: { w: newW, h: newH },
      });
    }
  }, [editor, shapeId]);

  useEffect(() => {
    // Measure after render when latex or fontSize changes
    lastLatex.current = latex;
    lastFontSize.current = fontSize;
    requestAnimationFrame(measureAndResize);
  }, [latex, fontSize, measureAndResize]);

  let html: string;
  let isError = false;

  try {
    html = katex.renderToString(latex, {
      throwOnError: false,
      displayMode: true,
    });
  } catch {
    html = latex;
    isError = true;
  }

  return (
    <div
      ref={containerRef}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        color,
        fontSize,
        pointerEvents: 'all',
        whiteSpace: 'nowrap',
      }}
    >
      {isError ? (
        <span style={{ fontFamily: 'monospace', opacity: 0.6 }}>{html}</span>
      ) : (
        <span dangerouslySetInnerHTML={{ __html: html }} />
      )}
    </div>
  );
}

function LatexEditorInline({
  latex,
  color,
  fontSize,
  onChange,
}: {
  latex: string;
  color: string;
  fontSize: number;
  onChange: (latex: string) => void;
}) {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
        padding: 8,
      }}
    >
      <textarea
        autoFocus
        defaultValue={latex}
        onChange={(e) => onChange(e.target.value)}
        onPointerDown={(e) => e.stopPropagation()}
        onPointerUp={(e) => e.stopPropagation()}
        onPointerMove={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
        style={{
          flex: 1,
          background: 'rgba(0,0,0,0.6)',
          border: '1px solid rgba(255,255,255,0.2)',
          borderRadius: 4,
          color,
          fontSize: Math.max(14, fontSize * 0.6),
          fontFamily: 'monospace',
          padding: 8,
          resize: 'none',
          outline: 'none',
        }}
        placeholder="Enter LaTeX..."
      />
    </div>
  );
}
