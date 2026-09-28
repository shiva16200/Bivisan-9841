/**
 * Client service for real-time word-by-word streaming responses
 * using Server-Sent Events (SSE) / Fetch ReadableStream.
 * Includes graceful retry and fallback on temporary network drops.
 */

export interface AiStreamOptions {
  prompt: string;
  channelContext?: string;
  onChunk: (chunk: string) => void;
  onDone?: () => void;
  onError?: (err: Error) => void;
  signal?: AbortSignal;
}

export async function streamAiResponse({
  prompt,
  channelContext,
  onChunk,
  onDone,
  onError,
  signal,
}: AiStreamOptions): Promise<void> {
  let attempts = 0;
  const maxAttempts = 2;

  while (attempts < maxAttempts) {
    attempts++;
    try {
      const response = await fetch('/api/ai/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream',
        },
        body: JSON.stringify({ prompt, channelContext }),
        signal,
      });

      if (!response.ok) {
        throw new Error(`AI service responded with HTTP status ${response.status}`);
      }

      if (!response.body) {
        throw new Error('Response body is not readable');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith('data: ')) {
            const dataStr = trimmed.slice(6).trim();
            if (dataStr === '[DONE]') {
              onDone?.();
              return;
            }
            try {
              const parsed = JSON.parse(dataStr);
              if (parsed.text) {
                onChunk(parsed.text);
              }
            } catch {
              // Plain text chunk fallback
              if (dataStr) onChunk(dataStr);
            }
          }
        }
      }

      onDone?.();
      return;
    } catch (err: unknown) {
      if (signal?.aborted) return;

      if (attempts >= maxAttempts) {
        console.warn('[AI Stream] Network fallback activated:', err);
        // Fallback message streamed smoothly
        onChunk('खेलकुद तथा प्रत्यक्ष प्रसारण सम्बन्धी सहायता उपलब्ध छ।');
        onDone?.();
        onError?.(err instanceof Error ? err : new Error(String(err)));
        return;
      }

      // Small backoff before single retry
      await new Promise((resolve) => setTimeout(resolve, 600));
    }
  }
}
