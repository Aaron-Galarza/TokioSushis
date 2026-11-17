import mongoose, { Schema, Document } from 'mongoose'

export interface iUser extends Document {
  email: string
  passwordHash: string
  role: 'admin' | 'encargado' | 'owner'
  branchId?: mongoose.Types.ObjectId
  active: boolean
  inviteTokenHash?: string
  inviteExpiresAt?: Date
}

const UserSchema = new Schema<iUser>({
  email: {
    type: String,
    required: [true, 'El email es obligatorio'],
    unique: true,
    trim: true,
    lowercase: true
  },
  passwordHash: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['admin', 'encargado', 'owner'],
    required: true
  },
  branchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Branch',
    required: function (this: iUser) { return this.role !== 'owner' },
    index: true
  },
  active: { type: Boolean, required: true, default: true },
  inviteTokenHash: { type: String, select: false },
  inviteExpiresAt: { type: Date, select: false },
}, { timestamps: true })

UserSchema.index({ inviteTokenHash: 1 }, { unique: true, sparse: true })

export const UserModel = mongoose.model<iUser>('User', UserSchema)
