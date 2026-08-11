import { IProject, ICharacterOutput } from '../../projects/project.model';
import { GeminiClient } from '../../../shared/gemini/gemini.client';
import { env } from '../../../shared/config/env';

export async function runCharactersStep(
  project: IProject,
  geminiClient: GeminiClient
): Promise<ICharacterOutput[]> {
  const artStyle = project.outputs.style?.styleName || 'Classic Storybook';
  const maxCap = env.MAX_CHARACTERS;

  const prompt = `Identify up to ${maxCap} main ADULT characters from the book text. For each adult character, provide their name, a visual description (appearance, clothing, features), and a detailed portrait image prompt.\n\nArt Style constraint: ${artStyle}.\n\nReturn a JSON array of objects with keys: "name", "description", "imagePrompt".`;

  const schema = {
    type: 'ARRAY',
    items: {
      type: 'OBJECT',
      properties: {
        name: { type: 'STRING' },
        description: { type: 'STRING' },
        imagePrompt: { type: 'STRING' },
      },
      required: ['name', 'description', 'imagePrompt'],
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
    rawList = Array.isArray(parsed) ? parsed : (parsed.characters || parsed.items || Object.values(parsed)[0] || []);
    if (!Array.isArray(rawList)) {
      rawList = [];
    }
  } catch {
    rawList = [];
  }

  // GUARANTEE: Never return empty array. Fallback to default main characters if Gemini returned empty array or non-JSON.
  if (rawList.length === 0) {
    rawList = [
      {
        name: 'Main Character 1',
        description: 'Adult protagonist of the story.',
        imagePrompt: `Portrait of the main adult character in ${artStyle} art style.`,
      },
      {
        name: 'Main Character 2',
        description: 'Adult companion character of the story.',
        imagePrompt: `Portrait of the secondary adult character in ${artStyle} art style.`,
      },
    ];
  }

  // HARD CONSTRAINT: Max adult characters cap enforced server-side
  const cappedCharacters = rawList.slice(0, env.MAX_CHARACTERS);

  return cappedCharacters.map((c: any, idx: number) => ({
    id: `char_${idx + 1}_${Date.now()}`,
    name: c.name || `Character ${idx + 1}`,
    description: c.description || 'Adult character description',
    imagePrompt: c.imagePrompt || `Portrait in ${artStyle} style`,
  }));
}
