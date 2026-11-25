import mongoose, { Schema } from 'mongoose';

export type TaskStatus = 'pending' | 'approved' | 'running' | 'completed' | 'partial' | 'failed' | 'cancelled' | 'expired';
export type OperationStatus = 'pending' | 'running' | 'completed' | 'verified' | 'failed' | 'conflict' | 'uncertain';

const operationSchema = new Schema({
  id: { type: String, required: true }, action: { type: String, required: true }, resourceId: String,
  parameters: { type: Schema.Types.Mixed, required: true }, previousValues: Schema.Types.Mixed,
  expectedValues: Schema.Types.Mixed, status: { type: String, required: true, default: 'pending' },
  result: Schema.Types.Mixed, error: String, startedAt: Date, completedAt: Date,
}, { _id: false });

const taskSchema = new Schema({
  userId: { type: String, required: true, index: true }, objective: { type: String, required: true },
  status: { type: String, required: true, index: true }, operations: { type: [operationSchema], required: true },
  approvedAt: Date, completedAt: Date, expiresAt: { type: Date, required: true, index: true },
}, { timestamps: true });

export const AssistantTask = mongoose.model('AssistantTask', taskSchema);
