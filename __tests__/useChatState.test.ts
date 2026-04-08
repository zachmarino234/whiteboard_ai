import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useChatState } from '@/lib/useChatState';

const mockFetch = vi.fn();
globalThis.fetch = mockFetch;

beforeEach(() => {
  mockFetch.mockReset();
});

describe('useChatState', () => {
  it('starts with empty state', () => {
    const { result } = renderHook(() => useChatState());
    expect(result.current.messages).toEqual([]);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('adds user message and assistant response on send', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        message: 'Think about it!',
        actions: [],
      }),
    });

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
    let resolvePromise!: (value: unknown) => void;
    mockFetch.mockReturnValueOnce(
      new Promise((resolve) => {
        resolvePromise = resolve;
      })
    );

    const { result } = renderHook(() => useChatState());

    let sendPromise: Promise<unknown>;
    act(() => {
      sendPromise = result.current.sendMessage('test');
    });

    // Should be loading after send starts
    expect(result.current.isLoading).toBe(true);

    await act(async () => {
      resolvePromise({
        ok: true,
        json: async () => ({ message: 'response', actions: [] }),
      });
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
    // User message should still be added
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

  it('returns AI actions from sendMessage', async () => {
    const actions = [
      { type: 'place_latex', latex: 'x^2', position: { x: 0, y: 0 } },
    ];
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ message: 'Here', actions }),
    });

    const { result } = renderHook(() => useChatState());

    let returned: unknown;
    await act(async () => {
      returned = await result.current.sendMessage('test');
    });

    expect(returned).toEqual(actions);
  });

  it('sends lasso context in the request body', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ message: 'ok', actions: [] }),
    });

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
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ message: 'ok', actions: [] }),
    });

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
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ message: 'ok', actions: [] }),
    });

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
