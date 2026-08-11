import { IProject } from '../../projects/project.model';
import { GeminiClient } from '../../../shared/gemini/gemini.client';

export async function runStyleStep(
  project: IProject,
  geminiClient: GeminiClient,
  options?: { userStyle?: string }
): Promise<{ styleName: string; description: string; userStyle?: string }> {
  if (options?.userStyle && options.userStyle.trim().length > 0) {
    const customStyle = options.userStyle.trim();
    return {
      styleName: customStyle,
      description: `User-provided art style: ${customStyle}`,
      userStyle: customStyle,
    };
  }

  const prompt = `Analyze the tone, atmosphere, and era of the following book text and propose a fitting art style for storybook illustrations.\n\nBook Title: ${project.title}\n\nReturn a JSON object with keys "styleName" and "description".`;
  
  const schema = {
    type: 'OBJECT',
    properties: {
      styleName: { type: 'STRING' },
      description: { type: 'STRING' },
    },
    required: ['styleName', 'description'],
  };

  const responseText = await geminiClient.generateText({
    prompt,
    responseSchema: schema,
    cachedContentName: project.cachedContentName,
  });

  try {
    const parsed = JSON.parse(responseText);
    return {
      styleName: parsed.styleName || 'Fairytale Storybook',
      description: parsed.description || 'Vibrant, classic storybook illustration style.',
    };
  } catch {
    return {
      styleName: 'Classic Storybook',
      description: 'Charming traditional illustration style matching the book.',
    };
  }
}
