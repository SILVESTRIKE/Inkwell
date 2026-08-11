import { env } from '../config/env';

export interface GeminiTextOptions {
  prompt: string;
  systemInstruction?: string;
  responseSchema?: any;
  cachedContentName?: string;
}

export interface GeminiImageOptions {
  prompt: string;
  artStyle?: string;
  characterDescriptions?: string[];
}

export class GeminiClient {
  private apiKey: string;
  private textModel: string = 'gemini-2.0-flash';
  private imageModel: string = 'imagen-3.0-generate-002';

  constructor(apiKey?: string) {
    this.apiKey = apiKey || env.GEMINI_API_KEY;
  }

  // Upload book text or create Cached Content reference once
  async uploadOrCacheBookText(bookText: string): Promise<string> {
    if (!this.apiKey) {
      return 'mock-cached-content-id';
    }

    try {
      // Use Gemini CachedContents API v1beta to store book text once
      const url = `https://generativelanguage.googleapis.com/v1beta/cachedContents?key=${this.apiKey}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: `models/${this.textModel}`,
          contents: [
            {
              role: 'user',
              parts: [{ text: `Book Text:\n${bookText}` }],
            },
          ],
          ttl: '3600s', // 1 hour TTL
        }),
      });

      if (!response.ok) {
        console.warn('Gemini CachedContent creation failed, falling back to direct context string:', await response.text());
        return '';
      }

      const data = await response.json();
      return data.name || '';
    } catch (err) {
      console.warn('Gemini uploadOrCacheBookText error:', err);
      return '';
    }
  }

  // Generate text or structured JSON
  async generateText(options: GeminiTextOptions): Promise<string> {
    if (!this.apiKey) {
      return this.getMockTextResponse(options.prompt);
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.textModel}:generateContent?key=${this.apiKey}`;
    
    const requestBody: any = {
      contents: [
        {
          role: 'user',
          parts: [{ text: options.prompt }],
        },
      ],
    };

    if (options.systemInstruction) {
      requestBody.systemInstruction = {
        parts: [{ text: options.systemInstruction }],
      };
    }

    if (options.cachedContentName) {
      requestBody.cachedContent = options.cachedContentName;
    }

    if (options.responseSchema) {
      requestBody.generationConfig = {
        responseMimeType: 'application/json',
        responseSchema: options.responseSchema,
      };
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Gemini API text generation error (${response.status}): ${errText}`);
    }

    const data = await response.json();
    const candidateText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!candidateText) {
      throw new Error('Gemini API returned empty response');
    }

    return candidateText;
  }

  // Generate Image (Imagen 3 API)
  async generateImage(options: GeminiImageOptions): Promise<Buffer> {
    if (!this.apiKey) {
      return this.getMockImageBuffer();
    }

    const fullPrompt = options.artStyle
      ? `Art style: ${options.artStyle}. ${options.prompt}`
      : options.prompt;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.imageModel}:predict?key=${this.apiKey}`;
    
    const requestBody = {
      instances: [{ prompt: fullPrompt }],
      parameters: {
        sampleCount: 1,
        aspectRatio: '1:1',
        outputOptions: { mimeType: 'image/jpeg' },
      },
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Gemini Image API error (${response.status}): ${errText}`);
    }

    const data = await response.json();
    const base64Image = data.predictions?.[0]?.bytesBase64Encoded;
    if (!base64Image) {
      throw new Error('Gemini Image API returned empty image payload');
    }

    return Buffer.from(base64Image, 'base64');
  }

  private getMockTextResponse(prompt: string): string {
    const lower = prompt.toLowerCase();
    if (lower.includes('style')) {
      return JSON.stringify({
        styleName: 'Classic Whimsical Watercolor',
        description: 'Soft pastel hues, delicate ink line-art details, and classic fairytale storybook charm.',
      });
    }
    if (lower.includes('character')) {
      return JSON.stringify([
        {
          name: 'Mr. Mole',
          description: 'A gentle, curious adult mole with velvet black fur, round spectacles, and a cozy tweed jacket.',
          imagePrompt: 'Portrait of Mr. Mole, an adult mole wearing small round spectacles and a rustic tweed coat, classic watercolor storybook style.',
        },
        {
          name: 'Mr. Rat',
          description: 'A cheerful, brave adult water rat with slick dark fur, wearing a red neckerchief and blue boating vest.',
          imagePrompt: 'Portrait of Mr. Rat, a friendly adult water rat with bright eyes, wearing a red neckerchief and blue vest, classic watercolor storybook style.',
        },
      ]);
    }
    if (lower.includes('chapter')) {
      return JSON.stringify([
        {
          chapterTitle: 'Chapter 1: The River Bank',
          description: 'Mole and Rat resting together by the gently flowing river under weeping willows.',
          illustrationPrompt: 'Mr. Mole and Mr. Rat picnicking by a sunlit riverbank under green weeping willow branches, detailed fairytale watercolor illustration.',
        },
      ]);
    }
    return 'Default generated text for mock mode.';
  }

  private getMockImageBuffer(): Buffer {
    // 1x1 SVG converted to minimal valid JPEG or SVG buffer for local demo
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400">
      <rect width="400" height="400" fill="#4f46e5" />
      <circle cx="200" cy="160" r="70" fill="#fbbf24" />
      <text x="200" y="290" font-family="sans-serif" font-size="20" fill="#ffffff" text-anchor="middle">Generated Illustration</text>
    </svg>`;
    return Buffer.from(svg, 'utf-8');
  }
}
