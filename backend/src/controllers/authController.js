import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { validationResult } from 'express-validator';
import User from '../models/User.js';
import { asyncHandler } from '../utils/asyncHandler.js';

function issueToken(user) {
  return jwt.sign({ sub: user._id.toString() }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });
}

function validationError(req) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error(errors.array()[0].msg);
    error.status = 400;
    throw error;
  }
}

export const register = asyncHandler(async (req, res) => {
  validationError(req);
  const { name, email, password } = req.body;
  const user = await User.create({
    name: name.trim(),
    email: email.trim().toLowerCase(),
    passwordHash: await bcrypt.hash(password, 12)
  });
  res.status(201).json({ success: true, data: { user: { id: user.id, name: user.name, email: user.email }, token: issueToken(user) } });
});

export const login = asyncHandler(async (req, res) => {
  validationError(req);
  const user = await User.findOne({ email: req.body.email.trim().toLowerCase() }).select('+passwordHash');
  if (!user || !(await bcrypt.compare(req.body.password, user.passwordHash))) {
    return res.status(401).json({ success: false, error: 'Email or password is incorrect.' });
  }
  res.json({ success: true, data: { user: { id: user.id, name: user.name, email: user.email }, token: issueToken(user) } });
});

export const getMe = asyncHandler(async (req, res) => {
  res.json({ success: true, data: { user: { id: req.user.id, name: req.user.name, email: req.user.email } } });
});
