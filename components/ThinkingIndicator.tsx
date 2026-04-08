'use client';

export default function ThinkingIndicator() {
  return (
    <div className="flex justify-start" data-testid="thinking-indicator">
      <div className="flex gap-1 rounded-lg bg-zinc-700 px-3 py-2">
        <span className="h-2 w-2 animate-bounce rounded-full bg-zinc-400 [animation-delay:0ms]" />
        <span className="h-2 w-2 animate-bounce rounded-full bg-zinc-400 [animation-delay:150ms]" />
        <span className="h-2 w-2 animate-bounce rounded-full bg-zinc-400 [animation-delay:300ms]" />
      </div>
    </div>
  );
}
