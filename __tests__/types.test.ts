import { describe, it, expectTypeOf } from 'vitest';
import type { ChatMessage, AIAction, AIResponse, WhiteboardObject } from '@/lib/types';

describe('Type definitions', () => {
  it('ChatMessage has required fields', () => {
    expectTypeOf<ChatMessage>().toHaveProperty('id');
    expectTypeOf<ChatMessage>().toHaveProperty('role');
    expectTypeOf<ChatMessage>().toHaveProperty('content');
    expectTypeOf<ChatMessage>().toHaveProperty('timestamp');
  });

  it('WhiteboardObject has required fields', () => {
    expectTypeOf<WhiteboardObject>().toHaveProperty('id');
    expectTypeOf<WhiteboardObject>().toHaveProperty('type');
    expectTypeOf<WhiteboardObject>().toHaveProperty('owner');
    expectTypeOf<WhiteboardObject>().toHaveProperty('position');
  });

  it('AIResponse contains message and actions', () => {
    expectTypeOf<AIResponse>().toHaveProperty('message');
    expectTypeOf<AIResponse>().toHaveProperty('actions');
  });

  it('AIAction discriminated union covers all types', () => {
    const latexAction: AIAction = {
      type: 'place_latex',
      latex: 'x^2',
      position: { x: 0, y: 0 },
    };
    const arrowAction: AIAction = {
      type: 'draw_arrow',
      from: { x: 0, y: 0 },
      to: { x: 1, y: 1 },
    };
    const highlightAction: AIAction = {
      type: 'highlight_region',
      bounds: { x: 0, y: 0, w: 10, h: 10 },
    };
    const textAction: AIAction = {
      type: 'place_text',
      text: 'hello',
      position: { x: 0, y: 0 },
    };

    // If these compile, the discriminated union is correct
    expectTypeOf(latexAction).toMatchTypeOf<AIAction>();
    expectTypeOf(arrowAction).toMatchTypeOf<AIAction>();
    expectTypeOf(highlightAction).toMatchTypeOf<AIAction>();
    expectTypeOf(textAction).toMatchTypeOf<AIAction>();
  });
});
