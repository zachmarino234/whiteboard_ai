import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useChatState } from '@/lib/useChatState';

const mockFetch = vi.fn();
globalThis.fetch = mockFetch;

beforeEach(() => {
  mockFetch.mockReset();
});

/** Helper to create an SSE ReadableStream from an array of events */
function createSSEStream(events: Array<{ type: string; text?: string; error?: string }>) {
  const encoder = new TextEncoder();
  const chunks = events.map(
    (e) => encoder.encode(`data: ${JSON.stringify(e)}\n\n`)
  );
  let index = 0;
  return new ReadableStream({
    pull(controller) {
      if (index < chunks.length) {
        controller.enqueue(chunks[index++]);
      } else {
        controller.close();
      }
    },
  });
}

function mockSSEResponse(events: Array<{ type: string; text?: string; error?: string }>) {
  mockFetch.mockResolvedValueOnce({
    ok: true,
    body: createSSEStream(events),
  });
}

describe('useChatState', () => {
  it('starts with empty state', () => {
    const { result } = renderHook(() => useChatState());
    expect(result.current.messages).toEqual([]);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('adds user message and streams assistant response', async () => {
    mockSSEResponse([
      { type: 'delta', text: '{"message": "Think ' },
      { type: 'delta', text: 'about it!", "actions": []}' },
      { type: 'done' },
    ]);

    const { result } = renderHook(() => useChatState());

    await act(async () => {
      await result.current.sendMessage('What is 2+2?');
    });

    expect(result.current.messages).toHaveLength(2);
    expect(result.current.messages[0].role).toBe('user');
    expect(result.current.messages[0].content).toBe('What is 2+2?');
    expect(result.current.messages[1].role).toBe('assistant');
    expect(result.current.messages[1].content).toBe('Think about it!');
  });

  it('sets isLoading during API call', async () => {
    let resolveStream!: () => void;
    const stream = new ReadableStream({
      start(controller) {
        const encoder = new TextEncoder();
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type: 'delta', text: '{"message":"ok","actions":[]}' })}\n\n`)
        );
        resolveStream = () => {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: 'done' })}\n\n`)
          );
          controller.close();
        };
      },
    });

    mockFetch.mockResolvedValueOnce({ ok: true, body: stream });

    const { result } = renderHook(() => useChatState());

    let sendPromise: Promise<unknown>;
    act(() => {
      sendPromise = result.current.sendMessage('test');
    });

    expect(result.current.isLoading).toBe(true);

    await act(async () => {
      resolveStream();
      await sendPromise;
    });

    expect(result.current.isLoading).toBe(false);
  });

  it('sets error on API failure', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({ error: 'Server error' }),
    });

    const { result } = renderHook(() => useChatState());

    await act(async () => {
      await result.current.sendMessage('test');
    });

    expect(result.current.error).toBe('Server error');
    expect(result.current.messages).toHaveLength(1);
    expect(result.current.messages[0].role).toBe('user');
  });

  it('sets error on network failure', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    const { result } = renderHook(() => useChatState());

    await act(async () => {
      await result.current.sendMessage('test');
    });

    expect(result.current.error).toBe('Network error');
  });

  it('sets error on stream error event', async () => {
    mockSSEResponse([
      { type: 'delta', text: 'partial' },
      { type: 'error', error: 'Rate limited' },
    ]);

    const { result } = renderHook(() => useChatState());

    await act(async () => {
      await result.current.sendMessage('test');
    });

    expect(result.current.error).toBe('Rate limited');
  });

  it('returns AI actions from sendMessage', async () => {
    mockSSEResponse([
      { type: 'delta', text: '{"message":"Here","actions":[{"type":"place_latex","latex":"x^2","position":{"x":0,"y":0}}]}' },
      { type: 'done' },
    ]);

    const { result } = renderHook(() => useChatState());

    let returned: unknown;
    await act(async () => {
      returned = await result.current.sendMessage('test');
    });

    expect(returned).toEqual([
      { type: 'place_latex', latex: 'x^2', position: { x: 0, y: 0 } },
    ]);
  });

  it('sends lasso context in the request body', async () => {
    mockSSEResponse([
      { type: 'delta', text: '{"message":"ok","actions":[]}' },
      { type: 'done' },
    ]);

    const selection = {
      imageDataUrl: 'data:image/png;base64,abc',
      boundingBox: { x: 10, y: 20, w: 100, h: 50 },
      shapeIds: ['shape:1'],
    };

    const { result } = renderHook(() => useChatState());

    await act(async () => {
      await result.current.sendMessage('What is this?', selection);
    });

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.lassoImage).toBe('data:image/png;base64,abc');
    expect(body.boundingBox).toEqual({ x: 10, y: 20, w: 100, h: 50 });
  });

  it('attaches lasso context to user message', async () => {
    mockSSEResponse([
      { type: 'delta', text: '{"message":"ok","actions":[]}' },
      { type: 'done' },
    ]);

    const selection = {
      imageDataUrl: 'data:image/png;base64,abc',
      boundingBox: { x: 10, y: 20, w: 100, h: 50 },
      shapeIds: ['shape:1'],
    };

    const { result } = renderHook(() => useChatState());

    await act(async () => {
      await result.current.sendMessage('What is this?', selection);
    });

    expect(result.current.messages[0].lassoContext).toEqual({
      imageDataUrl: 'data:image/png;base64,abc',
      boundingBox: { x: 10, y: 20, w: 100, h: 50 },
    });
  });

  it('clears messages', async () => {
    mockSSEResponse([
      { type: 'delta', text: '{"message":"ok","actions":[]}' },
      { type: 'done' },
    ]);

    const { result } = renderHook(() => useChatState());

    await act(async () => {
      await result.current.sendMessage('test');
    });
    expect(result.current.messages).toHaveLength(2);

    act(() => {
      result.current.clearMessages();
    });
    expect(result.current.messages).toEqual([]);
  });
});
