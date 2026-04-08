import { describe, it, expect, vi } from 'vitest';
import { captureSelection } from '@/lib/captureSelection';

function createMockEditor(
  selectedIds: string[] = [],
  bounds: { x: number; y: number; w: number; h: number } | null = null,
  imageUrl: string = 'data:image/png;base64,mock'
) {
  return {
    getSelectedShapeIds: vi.fn(() => selectedIds),
    getSelectionPageBounds: vi.fn(() => bounds),
    toImageDataUrl: vi.fn(async () => ({ url: imageUrl, width: 100, height: 50 })),
  } as any;
}

describe('captureSelection', () => {
  it('returns null when no shapes are selected', async () => {
    const editor = createMockEditor([]);
    const result = await captureSelection(editor);
    expect(result).toBeNull();
  });

  it('returns null when bounds are null', async () => {
    const editor = createMockEditor(['shape:1'], null);
    const result = await captureSelection(editor);
    expect(result).toBeNull();
  });

  it('captures selection with image and bounding box', async () => {
    const editor = createMockEditor(
      ['shape:1', 'shape:2'],
      { x: 10, y: 20, w: 200, h: 100 },
      'data:image/png;base64,captured'
    );
    const result = await captureSelection(editor);

    expect(result).not.toBeNull();
    expect(result!.imageDataUrl).toBe('data:image/png;base64,captured');
    expect(result!.boundingBox).toEqual({ x: 10, y: 20, w: 200, h: 100 });
    expect(result!.shapeIds).toEqual(['shape:1', 'shape:2']);
  });

  it('calls toImageDataUrl with correct options', async () => {
    const editor = createMockEditor(
      ['shape:1'],
      { x: 0, y: 0, w: 50, h: 50 }
    );
    await captureSelection(editor);

    expect(editor.toImageDataUrl).toHaveBeenCalledWith(['shape:1'], {
      format: 'png',
      padding: 16,
      background: true,
    });
  });

  it('returns null if toImageDataUrl throws', async () => {
    const editor = {
      getSelectedShapeIds: vi.fn(() => ['shape:1']),
      getSelectionPageBounds: vi.fn(() => ({ x: 0, y: 0, w: 50, h: 50 })),
      toImageDataUrl: vi.fn(async () => {
        throw new Error('Export failed');
      }),
    } as any;

    const result = await captureSelection(editor);
    expect(result).toBeNull();
  });
});
