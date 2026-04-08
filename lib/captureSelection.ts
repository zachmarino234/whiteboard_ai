import type { Editor } from '@tldraw/editor';

export interface SelectionContext {
  imageDataUrl: string;
  boundingBox: { x: number; y: number; w: number; h: number };
  shapeIds: string[];
}

/**
 * Captures the currently selected shapes as a PNG data URL
 * along with their bounding box in page coordinates.
 */
export async function captureSelection(
  editor: Editor
): Promise<SelectionContext | null> {
  const selectedIds = editor.getSelectedShapeIds();
  if (selectedIds.length === 0) return null;

  const bounds = editor.getSelectionPageBounds();
  if (!bounds) return null;

  try {
    const { url } = await editor.toImageDataUrl(selectedIds, {
      format: 'png',
      padding: 16,
      background: true,
    });

    return {
      imageDataUrl: url,
      boundingBox: {
        x: bounds.x,
        y: bounds.y,
        w: bounds.w,
        h: bounds.h,
      },
      shapeIds: selectedIds.map(String),
    };
  } catch {
    return null;
  }
}
