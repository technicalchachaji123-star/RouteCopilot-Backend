import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  email: string;
  password?: string;
  googleId?: string;
  firstName: string;
  lastName: string;
  role: 'driver' | 'fleet_manager' | 'admin';
  refreshTokenHash?: string;
  failedLoginAttempts: number;
  lockedUntil?: Date;
  isDeleted: boolean;
  deletedAt?: Date;
}

const UserSchema: Schema = new Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, select: false },
    googleId: { type: String, sparse: true, unique: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    role: { type: String, enum: ['driver', 'fleet_manager', 'admin'], default: 'driver' },
    refreshTokenHash: { type: String, select: false },
    failedLoginAttempts: { type: Number, default: 0 },
    lockedUntil: { type: Date },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date }
  },
  { timestamps: true }
);

// Full-text search index
UserSchema.index({ firstName: 'text', lastName: 'text', email: 'text' });

export const User = mongoose.model<IUser>('User', UserSchema);
