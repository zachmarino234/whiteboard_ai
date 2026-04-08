import Anthropic from '@anthropic-ai/sdk';
import { TUTOR_SYSTEM_PROMPT } from '@/lib/systemPrompt';
import { parseAIResponse } from '@/lib/parseAIResponse';

const anthropic = new Anthropic();

interface TutorRequestBody {
  messages: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
  lassoImage?: string; // base64-encoded PNG (no data URL prefix)
  boundingBox?: { x: number; y: number; w: number; h: number };
}

export async function POST(request: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json(
      { error: 'ANTHROPIC_API_KEY is not configured' },
      { status: 500 }
    );
  }

  let body: TutorRequestBody;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (!Array.isArray(body.messages) || body.messages.length === 0) {
    return Response.json(
      { error: 'messages array is required and must not be empty' },
      { status: 400 }
    );
  }

  // Build the Claude messages array
  const claudeMessages: Anthropic.MessageParam[] = [];

  for (let i = 0; i < body.messages.length; i++) {
    const msg = body.messages[i];
    const isLast = i === body.messages.length - 1;

    if (msg.role === 'user' && isLast && body.lassoImage) {
      // Attach the lasso image to the final user message
      const content: Anthropic.ContentBlockParam[] = [
        {
          type: 'image',
          source: {
            type: 'base64',
            media_type: 'image/png',
            data: stripDataUrlPrefix(body.lassoImage),
          },
        },
      ];

      if (body.boundingBox) {
        content.push({
          type: 'text',
          text: `The student's selected region bounding box: x=${body.boundingBox.x}, y=${body.boundingBox.y}, w=${body.boundingBox.w}, h=${body.boundingBox.h}. Position any annotations relative to these coordinates.`,
        });
      }

      content.push({
        type: 'text',
        text: msg.content,
      });

      claudeMessages.push({ role: 'user', content });
    } else {
      claudeMessages.push({ role: msg.role, content: msg.content });
    }
  }

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: TUTOR_SYSTEM_PROMPT,
      messages: claudeMessages,
    });

    // Extract text from the response
    const rawText = response.content
      .filter((block): block is Anthropic.TextBlock => block.type === 'text')
      .map((block) => block.text)
      .join('');

    const parsed = parseAIResponse(rawText);

    return Response.json(parsed);
  } catch (err) {
    console.error('Anthropic API error:', err);
    const message =
      err instanceof Error ? err.message : 'Unknown API error';
    return Response.json({ error: message }, { status: 502 });
  }
}

function stripDataUrlPrefix(data: string): string {
  const commaIdx = data.indexOf(',');
  if (commaIdx !== -1 && data.startsWith('data:')) {
    return data.slice(commaIdx + 1);
  }
  return data;
}
