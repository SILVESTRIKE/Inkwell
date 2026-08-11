import { IProject, IChapterOutput } from '../../projects/project.model';
import { GeminiClient } from '../../../shared/gemini/gemini.client';
import { AppError } from '../../../shared/middleware/error.middleware';

export async function runChaptersStep(
  project: IProject,
  geminiClient: GeminiClient
): Promise<IChapterOutput[]> {
  const characters = project.outputs.characters || [];
  if (characters.length === 0) {
    throw new AppError(400, 'Characters step must be completed before chapters step');
  }

  const artStyle = project.outputs.style?.styleName || 'Classic Storybook';
  const charNames = characters.map(c => `${c.name} (${c.description})`).join(', ');

  const prompt = `Propose 1 main chapter illustration prompt for the book text. The illustration should feature the characters: ${charNames}. Ensure the prompt specifies their appearance and the setting in detail.\n\nArt style constraint: ${artStyle}.\n\nReturn a JSON array containing exactly 1 object with keys: "chapterTitle", "description", "illustrationPrompt".`;

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
    const parsed = JSON.parse(responseText);
    rawList = Array.isArray(parsed) ? parsed : (parsed.chapters || Object.values(parsed)[0] || []);
    if (!Array.isArray(rawList)) {
      rawList = [];
    }
  } catch {
    rawList = [
      {
        chapterTitle: 'Chapter 1 Illustration',
        description: 'Key scene featuring the main characters.',
        illustrationPrompt: `A vibrant scene featuring ${charNames} in ${artStyle} art style.`,
      },
    ];
  }

  // HARD CONSTRAINT: Max 1 chapter enforced server-side
  const maxOneChapter = rawList.slice(0, 1);

  return maxOneChapter.map((ch: any, idx: number) => ({
    id: `chap_${idx + 1}_${Date.now()}`,
    chapterTitle: ch.chapterTitle || 'Chapter 1',
    description: ch.description || 'Chapter scene description',
    illustrationPrompt: ch.illustrationPrompt || `Key chapter scene in ${artStyle} style`,
  }));
}
