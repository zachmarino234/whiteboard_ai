import { describe, it, expect } from 'vitest';
import { parseAIResponse } from '@/lib/parseAIResponse';

describe('parseAIResponse', () => {
  it('parses valid JSON with message and actions', () => {
    const input = JSON.stringify({
      message: 'Good work!',
      actions: [
        { type: 'place_latex', latex: 'x^2', position: { x: 10, y: 20 } },
      ],
    });
    const result = parseAIResponse(input);
    expect(result.message).toBe('Good work!');
    expect(result.actions).toHaveLength(1);
    expect(result.actions[0]).toEqual({
      type: 'place_latex',
      latex: 'x^2',
      position: { x: 10, y: 20 },
    });
  });

  it('parses response with empty actions array', () => {
    const input = JSON.stringify({ message: 'Think about it.', actions: [] });
    const result = parseAIResponse(input);
    expect(result.message).toBe('Think about it.');
    expect(result.actions).toEqual([]);
  });

  it('parses response with no actions field', () => {
    const input = JSON.stringify({ message: 'Keep going!' });
    const result = parseAIResponse(input);
    expect(result.message).toBe('Keep going!');
    expect(result.actions).toEqual([]);
  });

  it('falls back to raw text when JSON is invalid', () => {
    const result = parseAIResponse('This is not JSON at all');
    expect(result.message).toBe('This is not JSON at all');
    expect(result.actions).toEqual([]);
  });

  it('extracts JSON from markdown code fences', () => {
    const input = '```json\n{"message": "Fenced!", "actions": []}\n```';
    const result = parseAIResponse(input);
    expect(result.message).toBe('Fenced!');
  });

  it('extracts JSON object embedded in text', () => {
    const input =
      'Here is my response: {"message": "Embedded", "actions": []} some trailing text';
    const result = parseAIResponse(input);
    expect(result.message).toBe('Embedded');
  });

  it('validates place_latex action', () => {
    const input = JSON.stringify({
      message: 'ok',
      actions: [
        { type: 'place_latex', latex: 'y=mx+b', position: { x: 0, y: 0 } },
        { type: 'place_latex', latex: 'bad', position: 'not-valid' }, // invalid
      ],
    });
    const result = parseAIResponse(input);
    expect(result.actions).toHaveLength(1);
  });

  it('validates draw_arrow action', () => {
    const input = JSON.stringify({
      message: 'ok',
      actions: [
        {
          type: 'draw_arrow',
          from: { x: 0, y: 0 },
          to: { x: 100, y: 100 },
          color: '#00ff00',
        },
      ],
    });
    const result = parseAIResponse(input);
    expect(result.actions).toHaveLength(1);
  });

  it('validates highlight_region action', () => {
    const input = JSON.stringify({
      message: 'ok',
      actions: [
        {
          type: 'highlight_region',
          bounds: { x: 10, y: 20, w: 100, h: 50 },
        },
      ],
    });
    const result = parseAIResponse(input);
    expect(result.actions).toHaveLength(1);
  });

  it('validates place_text action', () => {
    const input = JSON.stringify({
      message: 'ok',
      actions: [
        { type: 'place_text', text: 'hint', position: { x: 5, y: 5 } },
      ],
    });
    const result = parseAIResponse(input);
    expect(result.actions).toHaveLength(1);
  });

  it('filters out unknown action types', () => {
    const input = JSON.stringify({
      message: 'ok',
      actions: [{ type: 'unknown_thing', data: 123 }],
    });
    const result = parseAIResponse(input);
    expect(result.actions).toEqual([]);
  });

  it('filters out actions with missing required fields', () => {
    const input = JSON.stringify({
      message: 'ok',
      actions: [
        { type: 'place_latex' }, // missing latex and position
        { type: 'draw_arrow', from: { x: 0, y: 0 } }, // missing to
        { type: 'highlight_region' }, // missing bounds
        { type: 'place_text', position: { x: 0, y: 0 } }, // missing text
      ],
    });
    const result = parseAIResponse(input);
    expect(result.actions).toEqual([]);
  });
});
