import { describe, it, expect, vi } from 'vitest';
import { executeAIActions, clearAIAnnotations } from '@/lib/executeAIActions';
import type { AIAction } from '@/lib/types';

vi.mock('@tldraw/editor', () => ({
  createShapeId: vi.fn(() => `shape:${Math.random().toString(36).slice(2)}`),
}));

vi.mock('@tldraw/tlschema', () => ({
  toRichText: vi.fn((text: string) => ({ type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text }] }] })),
}));

function createMockEditor() {
  return {
    createShape: vi.fn(),
    getCurrentPageShapes: vi.fn(() => []),
    deleteShapes: vi.fn(),
  } as any;
}

describe('executeAIActions', () => {
  it('does nothing for empty actions array', () => {
    const editor = createMockEditor();
    executeAIActions(editor, []);
    expect(editor.createShape).not.toHaveBeenCalled();
  });

  it('creates a latex shape for place_latex action', () => {
    const editor = createMockEditor();
    const actions: AIAction[] = [
      { type: 'place_latex', latex: 'x^2', position: { x: 100, y: 200 }, color: '#00ff00' },
    ];
    executeAIActions(editor, actions);
    expect(editor.createShape).toHaveBeenCalledOnce();
    const call = editor.createShape.mock.calls[0][0];
    expect(call.type).toBe('latex');
    expect(call.x).toBe(100);
    expect(call.y).toBe(200);
    expect(call.props.latex).toBe('x^2');
    expect(call.meta.owner).toBe('ai');
  });

  it('creates an arrow shape for draw_arrow action', () => {
    const editor = createMockEditor();
    const actions: AIAction[] = [
      { type: 'draw_arrow', from: { x: 10, y: 20 }, to: { x: 110, y: 120 }, color: 'blue' },
    ];
    executeAIActions(editor, actions);
    expect(editor.createShape).toHaveBeenCalledOnce();
    const call = editor.createShape.mock.calls[0][0];
    expect(call.type).toBe('arrow');
    expect(call.x).toBe(10);
    expect(call.y).toBe(20);
    expect(call.props.start).toEqual({ x: 0, y: 0 });
    expect(call.props.end).toEqual({ x: 100, y: 100 });
    expect(call.props.color).toBe('blue');
    expect(call.meta.owner).toBe('ai');
  });

  it('creates a geo shape for highlight_region action', () => {
    const editor = createMockEditor();
    const actions: AIAction[] = [
      { type: 'highlight_region', bounds: { x: 50, y: 60, w: 200, h: 100 }, color: '#ffff00' },
    ];
    executeAIActions(editor, actions);
    expect(editor.createShape).toHaveBeenCalledOnce();
    const call = editor.createShape.mock.calls[0][0];
    expect(call.type).toBe('geo');
    expect(call.x).toBe(50);
    expect(call.y).toBe(60);
    expect(call.props.w).toBe(200);
    expect(call.props.h).toBe(100);
    expect(call.props.geo).toBe('rectangle');
    expect(call.props.fill).toBe('solid');
    expect(call.props.color).toBe('yellow');
    expect(call.opacity).toBe(0.3);
    expect(call.meta.owner).toBe('ai');
  });

  it('creates a text shape for place_text action', () => {
    const editor = createMockEditor();
    const actions: AIAction[] = [
      { type: 'place_text', text: 'Check this', position: { x: 30, y: 40 }, color: 'violet' },
    ];
    executeAIActions(editor, actions);
    expect(editor.createShape).toHaveBeenCalledOnce();
    const call = editor.createShape.mock.calls[0][0];
    expect(call.type).toBe('text');
    expect(call.x).toBe(30);
    expect(call.y).toBe(40);
    expect(call.props.color).toBe('violet');
    expect(call.meta.owner).toBe('ai');
  });

  it('handles multiple actions', () => {
    const editor = createMockEditor();
    const actions: AIAction[] = [
      { type: 'place_latex', latex: 'y=mx+b', position: { x: 0, y: 0 } },
      { type: 'place_text', text: 'Note', position: { x: 100, y: 100 } },
      { type: 'draw_arrow', from: { x: 0, y: 0 }, to: { x: 50, y: 50 } },
    ];
    executeAIActions(editor, actions);
    expect(editor.createShape).toHaveBeenCalledTimes(3);
  });

  it('defaults to green for unknown hex colors', () => {
    const editor = createMockEditor();
    const actions: AIAction[] = [
      { type: 'place_text', text: 'hi', position: { x: 0, y: 0 }, color: '#123456' },
    ];
    executeAIActions(editor, actions);
    expect(editor.createShape.mock.calls[0][0].props.color).toBe('green');
  });

  it('defaults to green when no color provided for arrow', () => {
    const editor = createMockEditor();
    const actions: AIAction[] = [
      { type: 'draw_arrow', from: { x: 0, y: 0 }, to: { x: 50, y: 50 } },
    ];
    executeAIActions(editor, actions);
    expect(editor.createShape.mock.calls[0][0].props.color).toBe('green');
  });
});

describe('clearAIAnnotations', () => {
  it('deletes shapes with meta.owner === ai', () => {
    const editor = {
      getCurrentPageShapes: vi.fn(() => [
        { id: 'shape:1', meta: { owner: 'ai' } },
        { id: 'shape:2', meta: { owner: 'user' } },
        { id: 'shape:3', meta: { owner: 'ai' } },
        { id: 'shape:4', meta: {} },
      ]),
      deleteShapes: vi.fn(),
    } as any;

    clearAIAnnotations(editor);
    expect(editor.deleteShapes).toHaveBeenCalledWith(['shape:1', 'shape:3']);
  });

  it('does nothing when no AI shapes exist', () => {
    const editor = {
      getCurrentPageShapes: vi.fn(() => [
        { id: 'shape:1', meta: {} },
      ]),
      deleteShapes: vi.fn(),
    } as any;

    clearAIAnnotations(editor);
    expect(editor.deleteShapes).not.toHaveBeenCalled();
  });
});
