import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    email: { type: String, unique: true, sparse: true, lowercase: true, trim: true },
    passwordHash: { type: String, select: false },
    googleId: { type: String, unique: true, sparse: true },
    appleId: { type: String, unique: true, sparse: true },
    phone: { type: String, unique: true, sparse: true },
    phoneVerified: { type: Boolean, default: false },
    
    displayName: { type: String, required: true, trim: true, maxlength: 30 },
    username: { type: String, unique: true, sparse: true, lowercase: true, trim: true },
    avatarUrl: { type: String, default: null },
    bio: { type: String, maxlength: 200, default: '' },
    age: { type: Number, min: 18, max: 120 },
    gender: { type: String, enum: ['male', 'female', 'non-binary', 'other', 'undisclosed'], default: 'undisclosed' },
    interests: [{ type: String, lowercase: true, trim: true }],
    location: {
      country: String,
      city: String,
      timezone: String
    },

    isOnline: { type: Boolean, default: false },
    lastActive: { type: Date, default: Date.now },
    accountStatus: { type: String, enum: ['active', 'suspended', 'banned', 'deactivated'], default: 'active' },
    role: { type: String, enum: ['user', 'moderator', 'admin'], default: 'user' },

    xp: { type: Number, default: 0 },
    level: { type: Number, default: 1 },
    reputationScore: { type: Number, default: 0 },

    subscription: {
      plan: { type: String, enum: ['free', 'pro', 'premium'], default: 'free' },
      status: { type: String, enum: ['active', 'past_due', 'canceled', 'incomplete', 'trialing', 'ended'], default: null },
      currentPeriodEnd: Date,
      stripeCustomerId: String,
      stripeSubscriptionId: String
    },
    tokenBalance: { type: Number, default: 0, min: 0 },

    isVerified: { type: Boolean, default: false },
    verifiedAt: Date,
    isAgeVerified: { type: Boolean, default: false },

    warningCount: { type: Number, default: 0 },
    lastWarningDate: Date,
    reportCount: { type: Number, default: 0 },
    blockList: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

    referralCode: { type: String, unique: true, sparse: true },
    referredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
    deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    restoredAt: { type: Date, default: null },
    restoredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
);

// Indexes
userSchema.index({ interests: 1 });
userSchema.index({ isOnline: 1, lastActive: -1 });
userSchema.index({ 'subscription.plan': 1 });
userSchema.index({ role: 1 });
userSchema.index({ isDeleted: 1, deletedAt: -1 });

// Password hashing method (for email signup)
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

// Pre-save hook to hash password (only if modified)
userSchema.pre('save', async function () {
  if (!this.isModified('passwordHash')) return;
  this.passwordHash = await bcrypt.hash(this.passwordHash, 12);
});

const User = mongoose.model('User', userSchema);
export default User;