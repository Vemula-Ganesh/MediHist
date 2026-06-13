const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../config/db');
const redis = require('../config/redis').getClient();
const mailService = require('../services/mailService');
const auditService = require('../services/auditService');

const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'medihist-default-access-secret-key-199';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'medihist-default-refresh-secret-key-991';

// Helpers
const generateAccessToken = (userId, email, role) => {
  return jwt.sign({ userId, email, role }, JWT_ACCESS_SECRET, { expiresIn: '15m' });
};

const generateRefreshToken = (userId) => {
  return jwt.sign({ userId }, JWT_REFRESH_SECRET, { expiresIn: '7d' });
};

const generateRandomOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit numeric
};

/**
 * Direct Registration — creates account immediately and returns JWT tokens.
 * OTP email verification has been removed for streamlined onboarding.
 */
const register = async (req, res) => {
  const { email, password, role } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const normalizedEmail = email.toLowerCase().trim();
    const assignedRole = role || 'PATIENT';

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail }
    });

    if (existingUser) {
      return res.status(400).json({ error: 'An account with this email already exists' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    // Create the User directly
    const user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        passwordHash,
        role: assignedRole
      }
    });

    // Assign role relationship
    const roleObj = await prisma.roleModel.findUnique({ where: { name: assignedRole } });
    if (roleObj) {
      await prisma.userRole.create({
        data: { userId: user.id, roleId: roleObj.id }
      });
    }

    // If role is DOCTOR, create doctor entry
    if (assignedRole === 'DOCTOR') {
      await prisma.doctor.create({
        data: {
          userId: user.id,
          licenseNumber: `LIC-${Date.now()}`,
          specialization: 'General Medicine',
          facilityName: 'City General Clinic'
        }
      });
    }

    // Issue JWT tokens immediately
    const accessToken = generateAccessToken(user.id, user.email, user.role);
    const refreshToken = generateRefreshToken(user.id);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await prisma.session.create({
      data: {
        userId: user.id,
        refreshToken,
        expiresAt,
        deviceDetails: req.headers['user-agent']
      }
    });

    await auditService.logEvent(user.id, 'REGISTER', `Account created with role: ${assignedRole}`, req.ip);

    res.status(201).json({
      message: 'Account created successfully!',
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        fullName: null
      }
    });
  } catch (error) {
    console.error('❌ Registration error:', error.message);
    res.status(500).json({ error: 'Failed to create account' });
  }
};

/**
 * Stage 2: OTP Verification & final account creation
 */
const verifyRegisterOTP = async (req, res) => {
  const { email, code } = req.body;

  if (!email || !code) {
    return res.status(400).json({ error: 'Email and OTP code are required' });
  }

  try {
    const normalizedEmail = email.toLowerCase().trim();
    const savedOTP = await redis.get(`otp:${normalizedEmail}`);

    if (!savedOTP || savedOTP !== code) {
      return res.status(400).json({ error: 'Invalid or expired OTP code' });
    }

    // Retrieve temporary details
    const rawData = await redis.get(`register:${normalizedEmail}`);
    if (!rawData) {
      return res.status(400).json({ error: 'Registration session expired. Please register again.' });
    }

    const { passwordHash, role } = JSON.parse(rawData);

    // Create the User
    const user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        passwordHash,
        role: role
      }
    });

    // Assign Role Relationship
    const roleObj = await prisma.roleModel.findUnique({ where: { name: role } });
    if (roleObj) {
      await prisma.userRole.create({
        data: {
          userId: user.id,
          roleId: roleObj.id
        }
      });
    }

    // If role is DOCTOR, register a doctor entry
    if (role === 'DOCTOR') {
      await prisma.doctor.create({
        data: {
          userId: user.id,
          licenseNumber: `LIC-${Date.now()}`,
          specialization: 'General Medicine',
          facilityName: 'City General Clinic'
        }
      });
    }

    // Clean up temporary cache
    await redis.del(`register:${normalizedEmail}`);
    await redis.del(`otp:${normalizedEmail}`);

    // Update OTP status in DB
    await prisma.oTPVerification.updateMany({
      where: { email: normalizedEmail, code, purpose: 'REGISTER' },
      data: { verifiedAt: new Date() }
    });

    // Write audit record
    await auditService.logEvent(user.id, 'REGISTER', `Account created with role: ${role}`, req.ip);

    res.status(201).json({ message: 'Email verified and account created successfully!' });
  } catch (error) {
    console.error('❌ OTP Verification error:', error.message);
    res.status(500).json({ error: 'Failed to verify OTP' });
  }
};

/**
 * Handles standard login checks
 */
const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const normalizedEmail = email.toLowerCase().trim();

    // Check user in DB (fetch by email, then check soft-delete manually)
    const user = await prisma.user.findFirst({
      where: { email: normalizedEmail },
      include: {
        profile: true
      }
    });

    if (!user || user.deletedAt) {
      await auditService.logEvent(null, 'LOGIN_FAILED', `Invalid email attempt: ${normalizedEmail}`, req.ip);
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Compare passwords
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      await auditService.logEvent(user.id, 'LOGIN_FAILED', 'Invalid password login attempt', req.ip);
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Issue tokens
    const accessToken = generateAccessToken(user.id, user.email, user.role);
    const refreshToken = generateRefreshToken(user.id);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    // Store refresh token session in Database
    await prisma.session.create({
      data: {
        userId: user.id,
        refreshToken,
        expiresAt,
        deviceDetails: req.headers['user-agent']
      }
    });

    await auditService.logEvent(user.id, 'LOGIN', 'Successful account login', req.ip);

    res.status(200).json({
      message: 'Login successful',
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        fullName: user.profile ? user.profile.fullName : null
      }
    });
  } catch (error) {
    console.error('❌ Login error:', error.message);
    res.status(500).json({ error: 'Failed to sign in' });
  }
};

/**
 * Renews access tokens using valid refresh token sessions
 */
const refreshToken = async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(400).json({ error: 'Refresh token is required' });
  }

  try {
    // Check if token exists and is valid in DB
    const session = await prisma.session.findUnique({
      where: { refreshToken, isValid: true }
    });

    if (!session || new Date() > session.expiresAt) {
      return res.status(403).json({ error: 'Invalid or expired session' });
    }

    // Verify refresh token signature
    jwt.verify(refreshToken, JWT_REFRESH_SECRET, async (err, decoded) => {
      if (err) {
        return res.status(403).json({ error: 'Invalid token verification signature' });
      }

      // Fetch user data
      const user = await prisma.user.findFirst({
        where: { id: decoded.userId }
      });

      if (!user || user.deletedAt) {
        return res.status(403).json({ error: 'User does not exist' });
      }

      const newAccessToken = generateAccessToken(user.id, user.email, user.role);
      res.status(200).json({ accessToken: newAccessToken });
    });
  } catch (error) {
    console.error('❌ Refresh token error:', error.message);
    res.status(500).json({ error: 'Failed to refresh access token' });
  }
};

/**
 * Sign out - invalidates refresh token
 */
const logout = async (req, res) => {
  const { refreshToken } = req.body;

  try {
    if (refreshToken) {
      // Invalidate the session
      await prisma.session.updateMany({
        where: { refreshToken },
        data: { isValid: false }
      });
    }

    if (req.user) {
      await auditService.logEvent(req.user.id, 'LOGOUT', 'Successful sign out', req.ip);
    }

    res.status(200).json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('❌ Logout error:', error.message);
    res.status(500).json({ error: 'Failed to sign out' });
  }
};

/**
 * Triggers request for password recovery (OTP based)
 */
const requestPasswordReset = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  try {
    const normalizedEmail = email.toLowerCase().trim();
    const user = await prisma.user.findFirst({
      where: { email: normalizedEmail }
    });

    if (!user || user.deletedAt) {
      // Security defense-in-depth: do not disclose email presence
      return res.status(200).json({ message: 'If the email exists, a password reset OTP has been sent.' });
    }

    const otpCode = generateRandomOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

    await redis.set(`reset:${normalizedEmail}`, otpCode, { EX: 600 });
    
    await prisma.oTPVerification.create({
      data: {
        userId: user.id,
        email: normalizedEmail,
        code: otpCode,
        purpose: 'RESET',
        expiresAt
      }
    });

    await mailService.sendOTPEmail(normalizedEmail, otpCode, 'Password Reset');
    await auditService.logEvent(user.id, 'OTP_REQUEST', 'Password reset OTP requested', req.ip);

    res.status(200).json({ message: 'If the email exists, a password reset OTP has been sent.' });
  } catch (error) {
    console.error('❌ Password reset request error:', error.message);
    res.status(500).json({ error: 'Failed to request password reset' });
  }
};

/**
 * Validates reset OTP and updates password hashes
 */
const resetPassword = async (req, res) => {
  const { email, code, newPassword } = req.body;

  if (!email || !code || !newPassword) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  try {
    const normalizedEmail = email.toLowerCase().trim();
    const savedOTP = await redis.get(`reset:${normalizedEmail}`);

    if (!savedOTP || savedOTP !== code) {
      return res.status(400).json({ error: 'Invalid or expired OTP code' });
    }

    // Verify user exists
    const user = await prisma.user.findFirst({
      where: { email: normalizedEmail }
    });

    if (!user || user.deletedAt) {
      return res.status(404).json({ error: 'User account not found' });
    }

    // Update password hash
    const newPasswordHash = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: newPasswordHash }
    });

    // Invalidate sessions
    await prisma.session.updateMany({
      where: { userId: user.id },
      data: { isValid: false }
    });

    await redis.del(`reset:${normalizedEmail}`);

    await prisma.oTPVerification.updateMany({
      where: { email: normalizedEmail, code, purpose: 'RESET' },
      data: { verifiedAt: new Date() }
    });

    await auditService.logEvent(user.id, 'PASSWORD_RESET', 'Password successfully reset', req.ip);

    res.status(200).json({ message: 'Password has been reset successfully. You can now log in.' });
  } catch (error) {
    console.error('❌ Reset password verification error:', error.message);
    res.status(500).json({ error: 'Failed to reset password' });
  }
};

module.exports = {
  register,
  verifyRegisterOTP,
  login,
  refreshToken,
  logout,
  requestPasswordReset,
  resetPassword
};
