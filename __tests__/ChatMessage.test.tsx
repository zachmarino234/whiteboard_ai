import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import ChatMessage from '@/components/ChatMessage';
import type { ChatMessage as ChatMessageType } from '@/lib/types';

describe('ChatMessage', () => {
  it('renders user message aligned right', () => {
    const msg: ChatMessageType = {
      id: '1',
      role: 'user',
      content: 'Hello!',
      timestamp: 1000,
    };
    render(<ChatMessage message={msg} />);
    expect(screen.getByText('Hello!')).toBeInTheDocument();
    expect(screen.getByTestId('chat-message-user')).toHaveClass('justify-end');
  });

  it('renders assistant message aligned left', () => {
    const msg: ChatMessageType = {
      id: '2',
      role: 'assistant',
      content: 'Great question!',
      timestamp: 2000,
    };
    render(<ChatMessage message={msg} />);
    expect(screen.getByText('Great question!')).toBeInTheDocument();
    expect(screen.getByTestId('chat-message-assistant')).toHaveClass(
      'justify-start'
    );
  });

  it('renders lasso context image when present', () => {
    const msg: ChatMessageType = {
      id: '3',
      role: 'user',
      content: 'What is this?',
      lassoContext: {
        imageDataUrl: 'data:image/png;base64,test',
        boundingBox: { x: 0, y: 0, w: 100, h: 50 },
      },
      timestamp: 3000,
    };
    render(<ChatMessage message={msg} />);
    const img = screen.getByAltText('Selection context');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', 'data:image/png;base64,test');
  });

  it('does not render image when no lasso context', () => {
    const msg: ChatMessageType = {
      id: '4',
      role: 'user',
      content: 'Just text',
      timestamp: 4000,
    };
    render(<ChatMessage message={msg} />);
    expect(screen.queryByAltText('Selection context')).not.toBeInTheDocument();
  });
});
