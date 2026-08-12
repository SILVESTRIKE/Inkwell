import { IProject, IChapterOutput } from '../../projects/project.model';
import { GeminiClient } from '../../../shared/gemini/gemini.client';
import { saveProjectFile, readProjectFile } from '../../../shared/storage/file.storage';
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
  const characters = project.outputs.characters || [];
  const charDescs = characters.map(c => `${c.name}: ${c.description}`);

  // Collect character portrait image buffers for multimodal character consistency
  const portraitBuffers: Buffer[] = [];
  for (const char of characters) {
    if (char.portraitFilename) {
      try {
        const buf = await readProjectFile(project._id.toString(), char.portraitFilename);
        if (buf && buf.length > 0) {
          portraitBuffers.push(buf);
        }
      } catch {
        // Skip missing portrait files gracefully
      }
    }
  }

  for (let i = 0; i < chapters.length; i++) {
    const ch = chapters[i];

    // Skip generating if illustration is already generated (preserves API quota on retries)
    if (ch.illustrationFilename) {
      continue;
    }

    const filename = `illustration_${ch.id}.jpg`;
    
    const imageBuffer = await geminiClient.generateImage({
      prompt: ch.illustrationPrompt,
      artStyle,
      characterDescriptions: charDescs,
      characterPortraits: portraitBuffers,
    });

    const savedPath = await saveProjectFile(project._id.toString(), filename, imageBuffer);

    // Update chapter illustration filename and save incrementally to MongoDB
    chapters[i].illustrationFilename = savedPath;
    project.outputs.chapters = chapters;
    project.markModified('outputs.chapters');
    await project.save();
  }

  return project.outputs.chapters || [];
}
