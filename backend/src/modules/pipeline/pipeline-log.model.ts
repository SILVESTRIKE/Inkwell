import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IPipelineLog extends Document {
  projectId: Types.ObjectId | string;
  userId: Types.ObjectId | string;
  stepNumber: number;
  stepName: string;
  status: 'running' | 'done' | 'failed';
  promptUsed?: string;
  rawOutput?: any;
  durationMs?: number;
  error?: string;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const PipelineLogSchema: Schema = new Schema<IPipelineLog>(
  {
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    stepNumber: { type: Number, required: true },
    stepName: { type: String, required: true },
    status: { type: String, enum: ['running', 'done', 'failed'], required: true },
    promptUsed: { type: String },
    rawOutput: { type: Schema.Types.Mixed },
    durationMs: { type: Number },
    error: { type: String },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const PipelineLog = mongoose.model<IPipelineLog>('PipelineLog', PipelineLogSchema);
