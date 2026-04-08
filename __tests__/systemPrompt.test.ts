import { describe, it, expect } from 'vitest';
import { TUTOR_SYSTEM_PROMPT } from '@/lib/systemPrompt';

describe('TUTOR_SYSTEM_PROMPT', () => {
  it('is a non-empty string', () => {
    expect(typeof TUTOR_SYSTEM_PROMPT).toBe('string');
    expect(TUTOR_SYSTEM_PROMPT.length).toBeGreaterThan(100);
  });

  it('instructs Socratic method', () => {
    expect(TUTOR_SYSTEM_PROMPT).toContain('Socratic');
    expect(TUTOR_SYSTEM_PROMPT).toContain('NEVER solve problems');
  });

  it('specifies JSON response format', () => {
    expect(TUTOR_SYSTEM_PROMPT).toContain('"message"');
    expect(TUTOR_SYSTEM_PROMPT).toContain('"actions"');
  });

  it('documents all action types', () => {
    expect(TUTOR_SYSTEM_PROMPT).toContain('place_latex');
    expect(TUTOR_SYSTEM_PROMPT).toContain('draw_arrow');
    expect(TUTOR_SYSTEM_PROMPT).toContain('highlight_region');
    expect(TUTOR_SYSTEM_PROMPT).toContain('place_text');
  });
});
