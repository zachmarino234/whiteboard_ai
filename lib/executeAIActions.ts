import type { Editor } from '@tldraw/editor';
import { createShapeId } from '@tldraw/editor';
import { toRichText } from '@tldraw/tlschema';
import type { AIAction } from './types';

type TldrawColor =
  | 'black' | 'grey' | 'light-violet' | 'violet' | 'blue' | 'light-blue'
  | 'yellow' | 'orange' | 'green' | 'light-green' | 'light-red' | 'red' | 'white';

// tldraw uses named colors, not hex. Map common hex values to the closest tldraw color.
const HEX_TO_TLDRAW_COLOR: Record<string, TldrawColor> = {
  '#00ff00': 'green',
  '#0f0': 'green',
  '#008000': 'green',
  '#00ff7f': 'light-green',
  '#90ee90': 'light-green',
  '#0000ff': 'blue',
  '#00f': 'blue',
  '#add8e6': 'light-blue',
  '#87ceeb': 'light-blue',
  '#ff0000': 'red',
  '#f00': 'red',
  '#ff6b6b': 'light-red',
  '#ffff00': 'yellow',
  '#ff0': 'yellow',
  '#ffa500': 'orange',
  '#ff8c00': 'orange',
  '#800080': 'violet',
  '#8b5cf6': 'violet',
  '#a78bfa': 'light-violet',
  '#ffffff': 'white',
  '#fff': 'white',
  '#000000': 'black',
  '#000': 'black',
  '#808080': 'grey',
  '#888': 'grey',
};

const TLDRAW_COLOR_NAMES: Set<string> = new Set([
  'black', 'grey', 'light-violet', 'violet', 'blue', 'light-blue',
  'yellow', 'orange', 'green', 'light-green', 'light-red', 'red', 'white',
]);

function toTldrawColor(color?: string): TldrawColor {
  if (!color) return 'green';
  // If it's already a valid tldraw color name, use it directly
  if (TLDRAW_COLOR_NAMES.has(color)) return color as TldrawColor;
  // Try hex lookup
  const mapped = HEX_TO_TLDRAW_COLOR[color.toLowerCase()];
  if (mapped) return mapped;
  // Default AI annotation color
  return 'green';
}

/**
 * Executes an array of AI actions on the tldraw canvas.
 * All AI-created shapes are tagged with `meta.owner: 'ai'` for identification.
 */
export function executeAIActions(editor: Editor, actions: AIAction[]): void {
  if (actions.length === 0) return;

  for (const action of actions) {
    switch (action.type) {
      case 'place_latex':
        placeLaTeX(editor, action);
        break;
      case 'draw_arrow':
        drawArrow(editor, action);
        break;
      case 'highlight_region':
        highlightRegion(editor, action);
        break;
      case 'place_text':
        placeText(editor, action);
        break;
    }
  }
}

function placeLaTeX(
  editor: Editor,
  action: Extract<AIAction, { type: 'place_latex' }>
) {
  const id = createShapeId();
  editor.createShape({
    id,
    type: 'latex',
    x: action.position.x,
    y: action.position.y,
    meta: { owner: 'ai' },
    props: {
      w: 250,
      h: 80,
      latex: action.latex,
      color: action.color || '#22c55e',
      fontSize: 24,
    },
  });
}

function drawArrow(
  editor: Editor,
  action: Extract<AIAction, { type: 'draw_arrow' }>
) {
  const id = createShapeId();
  const color = toTldrawColor(action.color);
  editor.createShape({
    id,
    type: 'arrow',
    x: action.from.x,
    y: action.from.y,
    meta: { owner: 'ai' },
    props: {
      start: { x: 0, y: 0 },
      end: { x: action.to.x - action.from.x, y: action.to.y - action.from.y },
      color,
      arrowheadStart: 'none',
      arrowheadEnd: 'arrow',
      size: 'm',
    },
  });
}

function highlightRegion(
  editor: Editor,
  action: Extract<AIAction, { type: 'highlight_region' }>
) {
  const id = createShapeId();
  const color = toTldrawColor(action.color);
  editor.createShape({
    id,
    type: 'geo',
    x: action.bounds.x,
    y: action.bounds.y,
    meta: { owner: 'ai' },
    props: {
      geo: 'rectangle',
      w: action.bounds.w,
      h: action.bounds.h,
      color,
      fill: 'solid',
      dash: 'dashed',
      size: 's',
      richText: toRichText(''),
      labelColor: color,
      url: '',
      growY: 0,
      scale: 1,
    },
    opacity: 0.3,
  });
}

function placeText(
  editor: Editor,
  action: Extract<AIAction, { type: 'place_text' }>
) {
  const id = createShapeId();
  const color = toTldrawColor(action.color);
  editor.createShape({
    id,
    type: 'text',
    x: action.position.x,
    y: action.position.y,
    meta: { owner: 'ai' },
    props: {
      richText: toRichText(action.text),
      color,
      size: 'm',
      font: 'sans',
      textAlign: 'start',
      scale: 1,
      autoSize: true,
    },
  });
}

/**
 * Removes all AI-created shapes from the canvas.
 */
export function clearAIAnnotations(editor: Editor): void {
  const allShapes = editor.getCurrentPageShapes();
  const aiShapeIds = allShapes
    .filter((s) => (s.meta as Record<string, unknown>)?.owner === 'ai')
    .map((s) => s.id);

  if (aiShapeIds.length > 0) {
    editor.deleteShapes(aiShapeIds);
  }
}
