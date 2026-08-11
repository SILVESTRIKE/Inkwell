import { IProject, ICharacterOutput } from '../../projects/project.model';
import { GeminiClient } from '../../../shared/gemini/gemini.client';
import { saveProjectFile } from '../../../shared/storage/file.storage';
import { BadRequestError } from '../../../shared/errors';

import { runCharactersStep } from './characters.step';

export async function runPortraitsStep(
  project: IProject,
  geminiClient: GeminiClient
): Promise<ICharacterOutput[]> {
  let characters = project.outputs.characters || [];
  if (characters.length === 0) {
    characters = await runCharactersStep(project, geminiClient);
    project.outputs.characters = characters;
    project.markModified('outputs.characters');
    await project.save();
  }

  const artStyle = project.outputs.style?.styleName || 'Classic Storybook';
  const updatedCharacters: ICharacterOutput[] = [];

  for (const char of characters) {
    const filename = `portrait_${char.id}.jpg`;
    const imageBuffer = await geminiClient.generateImage({
      prompt: char.imagePrompt,
      artStyle,
    });

    const savedPath = await saveProjectFile(project._id.toString(), filename, imageBuffer);

    updatedCharacters.push({
      ...char,
      portraitFilename: savedPath,
    });
  }

  return updatedCharacters;
}
