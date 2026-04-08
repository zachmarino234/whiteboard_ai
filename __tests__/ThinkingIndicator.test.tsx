import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import ThinkingIndicator from '@/components/ThinkingIndicator';

describe('ThinkingIndicator', () => {
  it('renders the thinking indicator', () => {
    render(<ThinkingIndicator />);
    expect(screen.getByTestId('thinking-indicator')).toBeInTheDocument();
  });

  it('contains three animated dots', () => {
    const { container } = render(<ThinkingIndicator />);
    const dots = container.querySelectorAll('.animate-bounce');
    expect(dots).toHaveLength(3);
  });
});
