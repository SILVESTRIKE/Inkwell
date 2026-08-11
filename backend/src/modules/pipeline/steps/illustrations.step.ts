import { IProject, IChapterOutput } from '../../projects/project.model';
import { GeminiClient } from '../../../shared/gemini/gemini.client';
import { saveProjectFile } from '../../../shared/storage/file.storage';
import { AppError } from '../../../shared/middleware/error.middleware';

export async function runIllustrationsStep(
  project: IProject,
  geminiClient: GeminiClient
): Promise<IChapterOutput[]> {
  const chapters = project.outputs.chapters;
  if (!chapters || chapters.length === 0) {
    throw new AppError(400, 'Chapters step must be completed before generating illustrations');
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

    await saveProjectFile(project._id.toString(), filename, imageBuffer);

    updatedChapters.push({
      ...ch,
      illustrationFilename: filename,
    });
  }

  return updatedChapters;
}
