import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IMedia extends Document {
  name: string;
  mediaPath: string;
  type: string;
  description?: string;
  creatorId?: Types.ObjectId | string;
  projectId?: Types.ObjectId | string;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const MediaSchema: Schema = new Schema<IMedia>(
  {
    name: { type: String, required: true },
    mediaPath: { type: String, required: true },
    type: { type: String, required: true, default: 'image/png' },
    description: { type: String },
    creatorId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', index: true },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const Media = mongoose.model<IMedia>('Media', MediaSchema);
