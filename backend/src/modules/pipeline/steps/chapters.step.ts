import { IProject, IChapterOutput } from '../../projects/project.model';
import { GeminiClient } from '../../../shared/gemini/gemini.client';
import { BadRequestError } from '../../../shared/errors';
import { env } from '../../../shared/config/env';

export async function runChaptersStep(
  project: IProject,
  geminiClient: GeminiClient
): Promise<IChapterOutput[]> {
  const characters = project.outputs.characters || [];
  if (characters.length === 0) {
    throw new BadRequestError('Characters step must be completed before chapters step');
  }

  const artStyle = project.outputs.style?.styleName || 'Classic Storybook';
  const charNames = characters.map(c => `${c.name} (${c.description})`).join(', ');
  const maxCap = env.MAX_CHAPTERS;

  const prompt = `Propose ${maxCap} main chapter illustration prompt(s) for the book text. The illustration should feature the characters: ${charNames}. Ensure the prompt specifies their appearance and the setting in detail.\n\nArt style constraint: ${artStyle}.\n\nReturn a JSON array containing ${maxCap} object(s) with keys: "chapterTitle", "description", "illustrationPrompt".`;

  const schema = {
    type: 'ARRAY',
    items: {
      type: 'OBJECT',
      properties: {
        chapterTitle: { type: 'STRING' },
        description: { type: 'STRING' },
        illustrationPrompt: { type: 'STRING' },
      },
      required: ['chapterTitle', 'description', 'illustrationPrompt'],
    },
  };

  const responseText = await geminiClient.generateText({
    prompt,
    responseSchema: schema,
    cachedContentName: project.cachedContentName,
  });

  let rawList: any[] = [];
  try {
    const cleanJson = responseText.replace(/```json/gi, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleanJson);
    rawList = Array.isArray(parsed) ? parsed : (parsed.chapters || parsed.items || Object.values(parsed)[0] || []);
    if (!Array.isArray(rawList)) {
      rawList = [];
    }
  } catch {
    rawList = [];
  }

  // GUARANTEE: Never return empty array. Fallback if Gemini returned empty array or non-JSON.
  if (rawList.length === 0) {
    rawList = [
      {
        chapterTitle: 'Chapter 1 Illustration',
        description: 'Key scene featuring the main characters.',
        illustrationPrompt: `A vibrant scene featuring ${charNames} in ${artStyle} art style.`,
      },
    ];
  }

  // HARD CONSTRAINT: Max chapters cap enforced server-side
  const cappedChapters = rawList.slice(0, env.MAX_CHAPTERS);

  return cappedChapters.map((ch: any, idx: number) => ({
    id: `chap_${idx + 1}_${Date.now()}`,
    chapterTitle: ch.chapterTitle || 'Chapter 1',
    description: ch.description || 'Chapter scene description',
    illustrationPrompt: ch.illustrationPrompt || `Key chapter scene in ${artStyle} style`,
  }));
}
