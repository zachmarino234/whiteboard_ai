import { describe, it, expect } from 'vitest';
import { LatexShapeTool } from '@/components/shapes/LatexShapeTool';

describe('LatexShapeTool', () => {
  it('has the correct static id', () => {
    expect(LatexShapeTool.id).toBe('latex');
  });
});
