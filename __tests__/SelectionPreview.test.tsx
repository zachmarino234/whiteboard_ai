import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import SelectionPreview from '@/components/SelectionPreview';
import type { SelectionContext } from '@/lib/captureSelection';

const mockSelection: SelectionContext = {
  imageDataUrl: 'data:image/png;base64,test123',
  boundingBox: { x: 0, y: 0, w: 100, h: 50 },
  shapeIds: ['shape:a', 'shape:b', 'shape:c'],
};

describe('SelectionPreview', () => {
  it('renders the preview image', () => {
    render(<SelectionPreview selection={mockSelection} onClear={() => {}} />);
    const img = screen.getByAltText('Selected region');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', 'data:image/png;base64,test123');
  });

  it('shows the shape count', () => {
    render(<SelectionPreview selection={mockSelection} onClear={() => {}} />);
    expect(screen.getByText('3 shapes selected')).toBeInTheDocument();
  });

  it('shows singular for one shape', () => {
    const single = { ...mockSelection, shapeIds: ['shape:a'] };
    render(<SelectionPreview selection={single} onClear={() => {}} />);
    expect(screen.getByText('1 shape selected')).toBeInTheDocument();
  });

  it('calls onClear when clear button is clicked', () => {
    const onClear = vi.fn();
    render(<SelectionPreview selection={mockSelection} onClear={onClear} />);
    fireEvent.click(screen.getByTestId('clear-selection'));
    expect(onClear).toHaveBeenCalledOnce();
  });
});
