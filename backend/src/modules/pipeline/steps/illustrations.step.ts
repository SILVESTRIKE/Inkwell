import { IProject, IChapterOutput } from '../../projects/project.model';
import { GeminiClient } from '../../../shared/gemini/gemini.client';
import { saveProjectFile } from '../../../shared/storage/file.storage';
import { BadRequestError } from '../../../shared/errors';

import { runChaptersStep } from './chapters.step';

export async function runIllustrationsStep(
  project: IProject,
  geminiClient: GeminiClient
): Promise<IChapterOutput[]> {
  let chapters = project.outputs.chapters || [];
  if (chapters.length === 0) {
    chapters = await runChaptersStep(project, geminiClient);
    project.outputs.chapters = chapters;
    project.markModified('outputs.chapters');
    await project.save();
  }

  const artStyle = project.outputs.style?.styleName || 'Classic Storybook';
  const charDescs = (project.outputs.characters || []).map(c => `${c.name}: ${c.description}`);

  const updatedChapters: IChapterOutput[] = [];

  for (const ch of chapters) {
    const filename = `illustration_${ch.id}.jpg`;
    const imageBuffer = await geminiClient.generateImage({
      prompt: ch.illustrationPrompt,
      artStyle,
      characterDescriptions: charDescs,
    });

    const savedPath = await saveProjectFile(project._id.toString(), filename, imageBuffer);

    updatedChapters.push({
      ...ch,
      illustrationFilename: savedPath,
    });
  }

  return updatedChapters;
}
