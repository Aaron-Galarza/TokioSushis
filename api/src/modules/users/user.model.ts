import mongoose, { Schema, Document } from 'mongoose'

export interface iUser extends Document {
  email: string
  passwordHash: string
  role: 'admin'
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
    enum: ['admin'],
    default: 'admin'
  }
}, { timestamps: true })

export const UserModel = mongoose.model<iUser>('User', UserSchema)
