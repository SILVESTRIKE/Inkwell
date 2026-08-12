import { env, getGeminiApiKeys } from '../config/env';
import { logger } from '../logger/logger';

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
  characterPortraits?: Buffer[];
}

export class GeminiClient {
  private apiKeys: string[] = [];
  private currentKeyIndex: number = 0;
  private textModel: string = 'gemini-3.6-flash';
  private imageModel: string = 'gemini-3.1-flash-image';

  constructor(apiKeys?: string | string[]) {
    if (Array.isArray(apiKeys)) {
      this.apiKeys = apiKeys.filter((k) => k && k.trim());
    } else if (typeof apiKeys === 'string' && apiKeys.trim()) {
      this.apiKeys = [apiKeys.trim()];
    } else {
      this.apiKeys = getGeminiApiKeys();
    }
  }

  // Round-robin API key selector
  private getNextApiKey(): string {
    if (this.apiKeys.length === 0) return '';
    const key = this.apiKeys[this.currentKeyIndex];
    this.currentKeyIndex = (this.currentKeyIndex + 1) % this.apiKeys.length;
    return key;
  }

  // Upload or retrieve cached context for book text
  async uploadOrCacheBookText(bookText: string): Promise<string | undefined> {
    if (this.apiKeys.length === 0) {
      return undefined;
    }

    const apiKey = this.getNextApiKey();
    const url = `https://generativelanguage.googleapis.com/v1beta/cachedContents?key=${apiKey}`;

    const requestBody = {
      model: `models/${this.textModel}`,
      contents: [
        {
          role: 'user',
          parts: [{ text: `Book Text:\n${bookText}` }],
        },
      ],
      ttl: '3600s',
    };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errText = await response.text();
        logger.warn(`Gemini CachedContent creation failed, falling back to direct context string: ${errText}`);
        return undefined;
      }

      const data = await response.json();
      return data.name;
    } catch (err: any) {
      logger.warn(`Failed to create Gemini cached content (${err.message}). Falling back to full prompt injection.`);
      return undefined;
    }
  }

  // Generate text or structured JSON with multi-key failover and explicit error propagation
  async generateText(options: GeminiTextOptions): Promise<string> {
    if (this.apiKeys.length === 0) {
      return this.getMockTextResponse(options.prompt);
    }

    const maxAttempts = Math.max(1, this.apiKeys.length);
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const apiKey = this.getNextApiKey();
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.textModel}:generateContent?key=${apiKey}`;

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

      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
          const errText = await response.text();
          if (response.status === 429 && maxAttempts > 1) {
            logger.warn(`[GeminiClient] Key rate-limited (429). Failing over to next key in pool...`);
            lastError = new Error(`Gemini API rate-limited (429): ${errText}`);
            continue; // Retry with next API key in pool
          }
          throw new Error(`Gemini Text API returned HTTP ${response.status}: ${errText}`);
        }

        const data = await response.json();
        const candidateText = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!candidateText) {
          throw new Error('Gemini Text API returned empty candidate text.');
        }

        return candidateText;
      } catch (err: any) {
        lastError = err;
        if (attempt < maxAttempts - 1 && err.message?.includes('429')) {
          continue;
        }
        throw err;
      }
    }

    throw lastError || new Error('All Gemini API keys exhausted without success.');
  }

  // Generate Image using gemini-3.1-flash-image generateContent with responseModalities: ['IMAGE']
  async generateImage(options: GeminiImageOptions): Promise<Buffer> {
    if (this.apiKeys.length === 0) {
      return this.getMockImageBuffer();
    }

    let fullPrompt = options.artStyle
      ? `Art style: ${options.artStyle}. ${options.prompt}`
      : options.prompt;

    if (options.characterDescriptions && options.characterDescriptions.length > 0) {
      fullPrompt += `\nCharacters present: ${options.characterDescriptions.join('; ')}`;
    }

    const parts: any[] = [{ text: fullPrompt }];

    // Multimodal character consistency: pass saved character portrait image buffers as inlineData parts
    if (options.characterPortraits && options.characterPortraits.length > 0) {
      for (const portraitBuf of options.characterPortraits) {
        if (portraitBuf && portraitBuf.length > 0) {
          parts.push({
            inlineData: {
              mimeType: 'image/jpeg',
              data: portraitBuf.toString('base64'),
            },
          });
        }
      }
    }

    const requestBody = {
      contents: [
        {
          role: 'user',
          parts,
        },
      ],
      generationConfig: {
        responseModalities: ['IMAGE'],
      },
    };

    const maxAttempts = Math.max(1, this.apiKeys.length);
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const apiKey = this.getNextApiKey();
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.imageModel}:generateContent?key=${apiKey}`;

      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
          const errText = await response.text();
          if (response.status === 429 && maxAttempts > 1) {
            logger.warn(`[GeminiClient] Image API rate-limited (429). Failing over to next key...`);
            lastError = new Error(`Gemini Image API rate-limited (429): ${errText}`);
            continue;
          }
          throw new Error(`Gemini Image API returned HTTP ${response.status}: ${errText}`);
        }

        const data = await response.json();
        const candidateParts = data.candidates?.[0]?.content?.parts || [];

        for (const part of candidateParts) {
          if (part.inlineData?.data) {
            return Buffer.from(part.inlineData.data, 'base64');
          }
        }

        throw new Error('Gemini Image API returned invalid response payload structure (no inlineData image bytes found).');
      } catch (err: any) {
        lastError = err;
        if (attempt < maxAttempts - 1 && err.message?.includes('429')) {
          continue;
        }
        throw err;
      }
    }

    throw lastError || new Error('All Gemini image API keys exhausted without success.');
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
