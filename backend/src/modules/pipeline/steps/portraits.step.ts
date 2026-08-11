import { IProject, ICharacterOutput } from '../../projects/project.model';
import { GeminiClient } from '../../../shared/gemini/gemini.client';
import { saveProjectFile } from '../../../shared/storage/file.storage';
import { BadRequestError } from '../../../shared/errors';

export async function runPortraitsStep(
  project: IProject,
  geminiClient: GeminiClient
): Promise<ICharacterOutput[]> {
  const characters = project.outputs.characters || [];
  if (characters.length === 0) {
    throw new BadRequestError('Characters step must be completed before generating portraits');
  }

  const artStyle = project.outputs.style?.styleName || 'Classic Storybook';
  const updatedCharacters: ICharacterOutput[] = [];

  for (const char of characters) {
    const filename = `portrait_${char.id}.jpg`;
    const imageBuffer = await geminiClient.generateImage({
      prompt: char.imagePrompt,
      artStyle,
    });

    await saveProjectFile(project._id.toString(), filename, imageBuffer);

    updatedCharacters.push({
      ...char,
      portraitFilename: filename,
    });
  }

  return updatedCharacters;
}
