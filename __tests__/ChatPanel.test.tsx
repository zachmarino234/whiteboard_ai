import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ChatPanel from '@/components/ChatPanel';
import type { SelectionContext } from '@/lib/captureSelection';
import type { ChatMessage } from '@/lib/types';

const mockSelection: SelectionContext = {
  imageDataUrl: 'data:image/png;base64,abc123',
  boundingBox: { x: 10, y: 20, w: 200, h: 100 },
  shapeIds: ['shape:1', 'shape:2'],
};

const defaultProps = {
  messages: [] as ChatMessage[],
  isLoading: false,
  error: null,
  onSendMessage: vi.fn(async () => []),
  onClearMessages: vi.fn(),
};

const sampleMessages: ChatMessage[] = [
  { id: 'msg-1', role: 'user', content: 'What is 2+2?', timestamp: 1000 },
  {
    id: 'msg-2',
    role: 'assistant',
    content: 'What do you think it is?',
    timestamp: 2000,
  },
];

describe('ChatPanel', () => {
  it('renders the chat panel with header', () => {
    render(<ChatPanel {...defaultProps} />);
    expect(screen.getByText('AI Tutor')).toBeInTheDocument();
  });

  it('shows placeholder text when no messages', () => {
    render(<ChatPanel {...defaultProps} />);
    expect(
      screen.getByText('Select something on the canvas and ask a question.')
    ).toBeInTheDocument();
  });

  it('collapses when close button is clicked', () => {
    render(<ChatPanel {...defaultProps} />);
    fireEvent.click(screen.getByText('×'));
    expect(screen.queryByText('AI Tutor')).not.toBeInTheDocument();
    expect(screen.getByText('Chat')).toBeInTheDocument();
  });

  it('reopens when the Chat button is clicked', () => {
    render(<ChatPanel {...defaultProps} />);
    fireEvent.click(screen.getByText('×'));
    fireEvent.click(screen.getByText('Chat'));
    expect(screen.getByText('AI Tutor')).toBeInTheDocument();
  });

  it('shows selection preview when selection context is provided', () => {
    render(
      <ChatPanel {...defaultProps} selectionContext={mockSelection} />
    );
    expect(screen.getByTestId('selection-preview')).toBeInTheDocument();
    expect(screen.getByText('2 shapes selected')).toBeInTheDocument();
  });

  it('calls onClearSelection when clear button is clicked', () => {
    const onClear = vi.fn();
    render(
      <ChatPanel
        {...defaultProps}
        selectionContext={mockSelection}
        onClearSelection={onClear}
      />
    );
    fireEvent.click(screen.getByTestId('clear-selection'));
    expect(onClear).toHaveBeenCalledOnce();
  });

  it('renders messages in the list', () => {
    render(<ChatPanel {...defaultProps} messages={sampleMessages} />);
    expect(screen.getByText('What is 2+2?')).toBeInTheDocument();
    expect(screen.getByText('What do you think it is?')).toBeInTheDocument();
  });

  it('shows thinking indicator when loading', () => {
    render(
      <ChatPanel {...defaultProps} messages={sampleMessages} isLoading={true} />
    );
    expect(screen.getByTestId('thinking-indicator')).toBeInTheDocument();
  });

  it('does not show thinking indicator when not loading', () => {
    render(<ChatPanel {...defaultProps} messages={sampleMessages} />);
    expect(screen.queryByTestId('thinking-indicator')).not.toBeInTheDocument();
  });

  it('shows error message', () => {
    render(
      <ChatPanel {...defaultProps} error="Something went wrong" />
    );
    expect(screen.getByTestId('chat-error')).toHaveTextContent(
      'Something went wrong'
    );
  });

  it('calls onSendMessage when send is clicked with input text', () => {
    const onSend = vi.fn(async () => []);
    render(<ChatPanel {...defaultProps} onSendMessage={onSend} />);
    const input = screen.getByPlaceholderText('Ask a question...');
    fireEvent.change(input, { target: { value: 'Hello' } });
    fireEvent.click(screen.getByText('Send'));
    expect(onSend).toHaveBeenCalledWith('Hello', undefined);
  });

  it('calls onSendMessage with selection context when available', () => {
    const onSend = vi.fn(async () => []);
    render(
      <ChatPanel
        {...defaultProps}
        selectionContext={mockSelection}
        onSendMessage={onSend}
      />
    );
    const input = screen.getByPlaceholderText('Ask about this selection...');
    fireEvent.change(input, { target: { value: 'What is this?' } });
    fireEvent.click(screen.getByText('Send'));
    expect(onSend).toHaveBeenCalledWith('What is this?', mockSelection);
  });

  it('submits on Enter key', () => {
    const onSend = vi.fn(async () => []);
    render(<ChatPanel {...defaultProps} onSendMessage={onSend} />);
    const input = screen.getByPlaceholderText('Ask a question...');
    fireEvent.change(input, { target: { value: 'test' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onSend).toHaveBeenCalledWith('test', undefined);
  });

  it('does not submit on Shift+Enter', () => {
    const onSend = vi.fn(async () => []);
    render(<ChatPanel {...defaultProps} onSendMessage={onSend} />);
    const input = screen.getByPlaceholderText('Ask a question...');
    fireEvent.change(input, { target: { value: 'test' } });
    fireEvent.keyDown(input, { key: 'Enter', shiftKey: true });
    expect(onSend).not.toHaveBeenCalled();
  });

  it('disables send button when input is empty', () => {
    render(<ChatPanel {...defaultProps} />);
    expect(screen.getByText('Send')).toBeDisabled();
  });

  it('disables input when loading', () => {
    render(<ChatPanel {...defaultProps} isLoading={true} />);
    expect(screen.getByPlaceholderText('Ask a question...')).toBeDisabled();
  });

  it('clears input after sending', () => {
    const onSend = vi.fn(async () => []);
    render(<ChatPanel {...defaultProps} onSendMessage={onSend} />);
    const input = screen.getByPlaceholderText('Ask a question...') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'Hello' } });
    fireEvent.click(screen.getByText('Send'));
    expect(input.value).toBe('');
  });

  it('shows clear button when messages exist', () => {
    render(<ChatPanel {...defaultProps} messages={sampleMessages} />);
    expect(screen.getByText('Clear')).toBeInTheDocument();
  });

  it('does not show clear button when no messages', () => {
    render(<ChatPanel {...defaultProps} />);
    expect(screen.queryByText('Clear')).not.toBeInTheDocument();
  });

  it('calls onClearMessages when clear is clicked', () => {
    const onClear = vi.fn();
    render(
      <ChatPanel
        {...defaultProps}
        messages={sampleMessages}
        onClearMessages={onClear}
      />
    );
    fireEvent.click(screen.getByText('Clear'));
    expect(onClear).toHaveBeenCalledOnce();
  });
});
