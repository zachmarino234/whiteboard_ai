import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import katex from 'katex';
import { LatexShapeUtil, latexShapeProps } from '@/components/shapes/LatexShape';

describe('LatexShapeUtil', () => {
  it('has the correct static type', () => {
    expect(LatexShapeUtil.type).toBe('latex');
  });

  it('has props validators defined', () => {
    expect(latexShapeProps).toBeDefined();
    expect(latexShapeProps).toHaveProperty('w');
    expect(latexShapeProps).toHaveProperty('h');
    expect(latexShapeProps).toHaveProperty('latex');
    expect(latexShapeProps).toHaveProperty('color');
    expect(latexShapeProps).toHaveProperty('fontSize');
  });

  it('getDefaultProps returns expected defaults', () => {
    const util = new LatexShapeUtil({} as any);
    const defaults = util.getDefaultProps();
    expect(defaults.latex).toBe('E = mc^2');
    expect(defaults.w).toBe(200);
    expect(defaults.h).toBe(80);
    expect(defaults.color).toBe('#ffffff');
    expect(defaults.fontSize).toBe(24);
  });

  it('canEdit returns true', () => {
    const util = new LatexShapeUtil({} as any);
    expect(util.canEdit()).toBe(true);
  });

  it('canResize returns true', () => {
    const util = new LatexShapeUtil({} as any);
    expect(util.canResize()).toBe(true);
  });
});

describe('KaTeX rendering', () => {
  it('renders valid LaTeX to HTML string', () => {
    const html = katex.renderToString('x^2 + y^2 = z^2', {
      throwOnError: false,
      displayMode: true,
    });
    expect(html).toContain('katex');
    expect(html).toContain('x');
  });

  it('handles invalid LaTeX without throwing', () => {
    const html = katex.renderToString('\\invalid{command}', {
      throwOnError: false,
      displayMode: true,
    });
    // With throwOnError: false, KaTeX renders an error message in the output
    expect(typeof html).toBe('string');
    expect(html.length).toBeGreaterThan(0);
  });

  it('renders common math expressions', () => {
    const expressions = [
      '\\frac{a}{b}',
      '\\int_0^1 x\\,dx',
      '\\sum_{i=1}^{n} i',
      '\\sqrt{x^2 + y^2}',
      '\\lim_{x \\to \\infty} f(x)',
    ];

    for (const expr of expressions) {
      const html = katex.renderToString(expr, {
        throwOnError: false,
        displayMode: true,
      });
      expect(html).toContain('katex');
    }
  });
});
