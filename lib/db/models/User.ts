import mongoose from 'mongoose';
import { Schema } from 'mongoose';

export enum UserRole {
  ADMIN = 'admin',
  OPERATOR = 'operator',
  SAAS_PROVIDER = 'saas_provider'
}

// Base schema fields for all user types
const baseUserFields = {
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { 
    type: String, 
    enum: Object.values(UserRole),
    required: true 
  },
  emailVerified: { type: Boolean, default: false },
  verificationToken: { type: String, default: null },
  verificationExpires: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now },
  resetPasswordToken: { type: String, default: null },
  resetPasswordExpires: { type: Date, default: null }
};

// Admin-specific fields
const adminFields = {
  location: { type: String, default: null },
  centreName: { type: String, default: null },
  creditBalance: { type: Number, default: 0 }
};

// Operator-specific fields
const operatorFields = {
  location: { type: String, default: null },
  centreName: { type: String, default: null }, 
  adminId: { type: Schema.Types.ObjectId, ref: 'User', default: null }
};

// SaaS Provider-specific fields
const saasProviderFields = {
  revenue: { type: Number, default: 0 }
};

// Combining all fields
const userSchema = new Schema({
  ...baseUserFields,
  ...adminFields,
  ...operatorFields,
  ...saasProviderFields
});

// Check if model already exists to prevent OverwriteModelError during hot reloads
const User = mongoose.models.User || mongoose.model('User', userSchema);

export default User;