import type { AIResponse, AIAction } from './types';

/**
 * Parses and validates the AI's JSON response into a typed AIResponse.
 * Falls back gracefully if the response is malformed.
 */
export function parseAIResponse(raw: string): AIResponse {
  // Try to extract JSON from the response — the model might wrap it in markdown code fences
  const jsonStr = extractJSON(raw);

  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonStr);
  } catch {
    // If JSON parsing fails entirely, treat the raw text as the message
    return { message: raw.trim(), actions: [] };
  }

  if (typeof parsed !== 'object' || parsed === null) {
    return { message: raw.trim(), actions: [] };
  }

  const obj = parsed as Record<string, unknown>;

  const message =
    typeof obj.message === 'string' ? obj.message : raw.trim();

  const actions = Array.isArray(obj.actions)
    ? obj.actions.filter(isValidAction)
    : [];

  return { message, actions };
}

function extractJSON(text: string): string {
  // Strip markdown code fences if present
  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) return fenceMatch[1].trim();

  // Try to find a JSON object in the text
  const braceStart = text.indexOf('{');
  const braceEnd = text.lastIndexOf('}');
  if (braceStart !== -1 && braceEnd > braceStart) {
    return text.slice(braceStart, braceEnd + 1);
  }

  return text;
}

function isValidAction(action: unknown): action is AIAction {
  if (typeof action !== 'object' || action === null) return false;
  const a = action as Record<string, unknown>;

  switch (a.type) {
    case 'place_latex':
      return typeof a.latex === 'string' && isPosition(a.position);
    case 'draw_arrow':
      return isPosition(a.from) && isPosition(a.to);
    case 'highlight_region':
      return isBounds(a.bounds);
    case 'place_text':
      return typeof a.text === 'string' && isPosition(a.position);
    default:
      return false;
  }
}

function isPosition(val: unknown): val is { x: number; y: number } {
  if (typeof val !== 'object' || val === null) return false;
  const p = val as Record<string, unknown>;
  return typeof p.x === 'number' && typeof p.y === 'number';
}

function isBounds(
  val: unknown
): val is { x: number; y: number; w: number; h: number } {
  if (typeof val !== 'object' || val === null) return false;
  const b = val as Record<string, unknown>;
  return (
    typeof b.x === 'number' &&
    typeof b.y === 'number' &&
    typeof b.w === 'number' &&
    typeof b.h === 'number'
  );
}
