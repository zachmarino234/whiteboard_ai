export interface WhiteboardObject {
  id: string;
  type: 'freehand' | 'text' | 'latex' | 'arrow' | 'highlight' | 'svg-token';
  owner: 'user' | 'ai';
  position: { x: number; y: number };
  content: string;
  meta?: Record<string, unknown>;
  createdAt: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  lassoContext?: {
    imageDataUrl: string;
    extractedText?: string;
    boundingBox: { x: number; y: number; w: number; h: number };
  };
  timestamp: number;
  animate?: boolean;
}

export type AIAction =
  | { type: 'place_latex'; latex: string; position: { x: number; y: number }; color?: string }
  | { type: 'draw_arrow'; from: { x: number; y: number }; to: { x: number; y: number }; color?: string }
  | { type: 'highlight_region'; bounds: { x: number; y: number; w: number; h: number }; color?: string }
  | { type: 'place_text'; text: string; position: { x: number; y: number }; color?: string };

export interface AIResponse {
  message: string;
  actions: AIAction[];
}
