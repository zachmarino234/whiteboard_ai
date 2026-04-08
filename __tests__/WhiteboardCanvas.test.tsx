import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

// Mock tldraw since it requires browser canvas APIs not available in jsdom
const mockUpdateInstanceState = vi.fn();
vi.mock('tldraw', () => ({
  Tldraw: ({ onMount, shapeUtils, tools, overrides, children }: any) => {
    // Simulate mount callback so we can verify grid mode is enabled
    if (onMount) {
      onMount({ updateInstanceState: mockUpdateInstanceState });
    }
    return (
      <div
        data-testid="tldraw-canvas"
        data-shape-utils={shapeUtils?.length ?? 0}
        data-tools={tools?.length ?? 0}
        data-has-overrides={!!overrides}
        data-has-children={!!children}
      >
        tldraw mock
        {children}
      </div>
    );
  },
  useEditor: vi.fn(),
  useReactor: vi.fn(),
}));
vi.mock('tldraw/tldraw.css', () => ({}));
vi.mock('katex/dist/katex.min.css', () => ({}));

import WhiteboardCanvas from '@/components/WhiteboardCanvas';

describe('WhiteboardCanvas', () => {
  it('renders the tldraw canvas', () => {
    render(<WhiteboardCanvas />);
    expect(screen.getByTestId('tldraw-canvas')).toBeInTheDocument();
  });

  it('enables grid mode on mount', () => {
    render(<WhiteboardCanvas />);
    expect(mockUpdateInstanceState).toHaveBeenCalledWith({ isGridMode: true });
  });

  it('registers custom shape utils', () => {
    render(<WhiteboardCanvas />);
    const canvas = screen.getByTestId('tldraw-canvas');
    expect(canvas.getAttribute('data-shape-utils')).toBe('1');
  });

  it('registers custom tools', () => {
    render(<WhiteboardCanvas />);
    const canvas = screen.getByTestId('tldraw-canvas');
    expect(canvas.getAttribute('data-tools')).toBe('1');
  });

  it('passes UI overrides', () => {
    render(<WhiteboardCanvas />);
    const canvas = screen.getByTestId('tldraw-canvas');
    expect(canvas.getAttribute('data-has-overrides')).toBe('true');
  });

  it('renders SelectionWatcher when onSelectionCapture is provided', () => {
    const onCapture = vi.fn();
    render(<WhiteboardCanvas onSelectionCapture={onCapture} />);
    const canvas = screen.getByTestId('tldraw-canvas');
    expect(canvas.getAttribute('data-has-children')).toBe('true');
  });

  it('does not render SelectionWatcher without onSelectionCapture', () => {
    render(<WhiteboardCanvas />);
    const canvas = screen.getByTestId('tldraw-canvas');
    expect(canvas.getAttribute('data-has-children')).toBe('false');
  });

  it('calls onEditorReady with the editor on mount', () => {
    const onEditorReady = vi.fn();
    render(<WhiteboardCanvas onEditorReady={onEditorReady} />);
    expect(onEditorReady).toHaveBeenCalledWith(
      expect.objectContaining({ updateInstanceState: expect.any(Function) })
    );
  });
});
