const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const config = require('../config');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');

class AuthService {
  generateTokens(userId) {
    const accessToken = jwt.sign({ id: userId }, config.jwt.secret, {
      expiresIn: config.jwt.expire,
    });
    const refreshToken = jwt.sign({ id: userId }, config.jwt.refreshSecret, {
      expiresIn: config.jwt.refreshExpire,
    });
    return { accessToken, refreshToken };
  }

  async register({ email, password, firstName, lastName, role, phone, institution }) {
    const existing = await User.findOne({ email });
    if (existing) throw new ApiError(409, 'Email already registered');

    const user = await User.create({
      email,
      password,
      firstName,
      lastName,
      role,
      phone,
      institution,
    });

    const tokens = this.generateTokens(user._id);
    await this.saveRefreshToken(user._id, tokens.refreshToken);

    return { user, ...tokens };
  }

  async login(email, password, ip) {
    const user = await User.findOne({ email }).select('+password');
    if (!user || !user.isActive) {
      throw new ApiError(401, 'Invalid credentials');
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) throw new ApiError(401, 'Invalid credentials');

    user.lastLogin = new Date();
    user.lastLoginIp = ip;
    await user.save();

    const tokens = this.generateTokens(user._id);
    await this.saveRefreshToken(user._id, tokens.refreshToken, ip);

    const userObj = user.toObject();
    delete userObj.password;
    return { user: userObj, ...tokens };
  }

  async saveRefreshToken(userId, token, ip) {
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await User.findByIdAndUpdate(userId, {
      $push: {
        refreshTokens: { token, expiresAt, ip },
      },
    });
  }

  async refreshToken(token) {
    const decoded = jwt.verify(token, config.jwt.refreshSecret);
    const user = await User.findById(decoded.id);
    if (!user?.isActive) throw new ApiError(401, 'Invalid refresh token');

    const stored = user.refreshTokens.find((rt) => rt.token === token);
    if (!stored || stored.expiresAt < new Date()) {
      throw new ApiError(401, 'Refresh token expired');
    }

    const tokens = this.generateTokens(user._id);
    await User.findByIdAndUpdate(user._id, {
      $pull: { refreshTokens: { token } },
    });
    await this.saveRefreshToken(user._id, tokens.refreshToken);

    return tokens;
  }

  async logout(userId, refreshToken) {
    await User.findByIdAndUpdate(userId, {
      $pull: { refreshTokens: { token: refreshToken } },
    });
  }

  generateResetToken() {
    const token = crypto.randomBytes(32).toString('hex');
    const hashed = crypto.createHash('sha256').update(token).digest('hex');
    return { token, hashed };
  }
}

module.exports = new AuthService();
