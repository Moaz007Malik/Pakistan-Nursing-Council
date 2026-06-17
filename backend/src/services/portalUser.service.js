const { User } = require('../models');
const ApiError = require('../utils/ApiError');

const splitName = (fullName) => {
  const parts = (fullName || 'User').trim().split(/\s+/);
  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(' ') || parts[0],
  };
};

const createPortalUser = async ({ email, password, fullName, role, institution, phone }) => {
  if (!email || !password) {
    throw new ApiError(400, 'Login email and password are required');
  }
  if (password.length < 8) {
    throw new ApiError(400, 'Password must be at least 8 characters');
  }

  const normalizedEmail = email.toLowerCase().trim();
  const existing = await User.findOne({ email: normalizedEmail });
  if (existing) throw new ApiError(409, 'Email already registered');

  const { firstName, lastName } = splitName(fullName);
  return User.create({
    email: normalizedEmail,
    password,
    firstName,
    lastName,
    role,
    institution,
    phone,
  });
};

const updatePortalUser = async (userId, { email, password, fullName, phone }) => {
  const user = await User.findById(userId).select('+password');
  if (!user) throw new ApiError(404, 'Portal user not found');

  if (email) {
    const normalizedEmail = email.toLowerCase().trim();
    if (normalizedEmail !== user.email) {
      const taken = await User.findOne({ email: normalizedEmail });
      if (taken) throw new ApiError(409, 'Email already registered');
      user.email = normalizedEmail;
    }
  }

  if (password) {
    if (password.length < 8) throw new ApiError(400, 'Password must be at least 8 characters');
    user.password = password;
  }

  if (fullName) {
    const { firstName, lastName } = splitName(fullName);
    user.firstName = firstName;
    user.lastName = lastName;
  }

  if (phone) user.phone = phone;
  await user.save();
  return user;
};

const deletePortalUser = async (userId) => {
  if (userId) await User.findByIdAndDelete(userId);
};

module.exports = { createPortalUser, updatePortalUser, deletePortalUser, splitName };
