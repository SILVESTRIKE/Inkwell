import mongoose, { Schema, Document } from 'mongoose';

export type StepStatus = 'pending' | 'running' | 'done' | 'failed';
export type OverallStatus = 'draft' | 'in_progress' | 'done';

export interface ICharacterOutput {
  id: string;
  name: string;
  description: string;
  imagePrompt: string;
  portraitFilename?: string;
}

export interface IChapterOutput {
  id: string;
  chapterTitle: string;
  description: string;
  illustrationPrompt: string;
  illustrationFilename?: string;
}

export interface IStepState {
  stepNumber: number; // 1 to 5
  stepName: 'style' | 'characters' | 'portraits' | 'chapters' | 'illustrations';
  status: StepStatus;
  error?: string;
  startedAt?: Date;
  completedAt?: Date;
}

export interface IPipelineOutputs {
  style?: {
    styleName?: string;
    description?: string;
    userStyle?: string;
  };
  characters?: ICharacterOutput[];
  chapters?: IChapterOutput[];
}

export interface IProject extends Document {
  userId: string;
  title: string;
  bookText: string;
  cachedContentName?: string;
  isDeleted?: boolean;
  createdAt: Date;
  updatedAt: Date;
  overallStatus: OverallStatus;
  currentStepNumber: number;
  stepStates: IStepState[];
  outputs: IPipelineOutputs;
}

const CharacterSchema = new Schema({
  id: { type: String, required: true },
  name: { type: String, required: true },
  description: { type: String, required: true },
  imagePrompt: { type: String, required: true },
  portraitFilename: { type: String },
});

const ChapterSchema = new Schema({
  id: { type: String, required: true },
  chapterTitle: { type: String, required: true },
  description: { type: String, required: true },
  illustrationPrompt: { type: String, required: true },
  illustrationFilename: { type: String },
});

const StepStateSchema = new Schema({
  stepNumber: { type: Number, required: true },
  stepName: { type: String, required: true },
  status: { type: String, enum: ['pending', 'running', 'done', 'failed'], default: 'pending' },
  error: { type: String },
  startedAt: { type: Date },
  completedAt: { type: Date },
});

const ProjectSchema: Schema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    title: { type: String, required: true },
    bookText: { type: String, required: true },
    cachedContentName: { type: String },
    isDeleted: { type: Boolean, default: false },
    overallStatus: { type: String, enum: ['draft', 'in_progress', 'done'], default: 'draft' },
    currentStepNumber: { type: Number, default: 1 },
    stepStates: {
      type: [StepStateSchema],
      default: [
        { stepNumber: 1, stepName: 'style', status: 'pending' },
        { stepNumber: 2, stepName: 'characters', status: 'pending' },
        { stepNumber: 3, stepName: 'portraits', status: 'pending' },
        { stepNumber: 4, stepName: 'chapters', status: 'pending' },
        { stepNumber: 5, stepName: 'illustrations', status: 'pending' },
      ],
    },
    outputs: {
      style: {
        styleName: { type: String },
        description: { type: String },
        userStyle: { type: String },
      },
      characters: [CharacterSchema],
      chapters: [ChapterSchema],
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform(doc: any, ret: any) {
        ret.id = ret._id ? ret._id.toString() : ret.id;
      },
    },
    toObject: {
      virtuals: true,
      transform(doc: any, ret: any) {
        ret.id = ret._id ? ret._id.toString() : ret.id;
      },
    },
  }
);

export const Project = mongoose.model<IProject>('Project', ProjectSchema);
