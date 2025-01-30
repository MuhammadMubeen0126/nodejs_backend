const express = require('express');
const nodemailer = require('nodemailer');
const dotenv = require('dotenv');
const User = require('../models/User');
const passport = require('../models/passport');
const jwt = require('jsonwebtoken');
const session = require('express-session');
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const { OAuth2Client } = require('google-auth-library');

dotenv.config();

const app = express();
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Nodemailer Transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  }
});

// Send Email Function
function sendEmail(mailData) {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: mailData.to,
    subject: mailData.subject,
    text: mailData.message
  };

  return new Promise((resolve, reject) => {
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        return reject(error);
      }
      resolve(info);
    });
  });
}

// Get all users
const index = async (req, res) => {
  const users = await User.find();
  return res.json(users);
};

// Get user by ID
const getbyId = async (req, res) => {
  const user = await User.findById(req.params.id);
  return res.json(user);
};

// Update user
const update = async (req, res) => {
  const user = await User.findByIdAndUpdate(req.params.id, {
    name: req.body.name,
    email: req.body.email,
    age: req.body.age
  }, { new: true }); // Return updated user
  return res.json(user);
};

// Delete user
const destroy = async (req, res) => {
  await User.findByIdAndDelete(req.params.id);
  return res.json({ message: "Deleted successfully" });
};

// Store new user
const store = async (req, res) => {
  try {
    const newUser = new User({
      name: req.body.name,
      email: req.body.email,
      age: parseInt(req.body.age),
      password: req.body.password,
    });

    const savedUser = await newUser.save();
    res.json({ message: 'User Saved Successfully', user: savedUser });
  } catch (err) {
    res.status(500).json({ message: 'Error saving User', error: err });
  }
};

// Login user
const login = (req, res, next) => {
  passport.authenticate('local', (err, user, info) => {
    if (err) return next(err);
    if (!user) return res.status(401).json({ message: info.message || 'Authentication failed' });

    // Generate JWT Token
    const token = jwt.sign({ id: user._id, email: user.email }, JWT_SECRET, { expiresIn: '1h' });

    return res.status(200).json({ message: 'Login successful', token });
  })(req, res, next);
};

// Token Blacklist
const tokenBlacklist = new Set();

const logout = (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(400).json({ message: 'Token is required for logout' });

  tokenBlacklist.add(token);
  return res.status(200).json({ message: 'Logout successful' });
};

// Middleware to check token blacklist
const isTokenBlacklisted = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (tokenBlacklist.has(token)) {
    return res.status(401).json({ message: 'Token has been invalidated. Please log in again.' });
  }
  next();
};

// Forgot Password
const forgotPassword = async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });

  if (!user) {
    return res.status(404).json({ message: 'User with this email does not exist' });
  }

  // Generate a reset token
  const resetToken = crypto.randomBytes(32).toString('hex');
  const resetTokenExpiry = Date.now() + 3600000; // Token valid for 1 hour

  // Save token to user
  user.resetPasswordToken = resetToken;
  user.resetPasswordExpires = resetTokenExpiry;
  await user.save();

  // Send reset email
  const resetLink = `http://localhost:3000/resetpassword/${resetToken}`;
  const mailData = {
    to: user.email,
    subject: 'Password Reset Request',
    message: `Click the link below to reset your password:\n\n${resetLink}\n\nThis link is valid for 1 hour.`,
  };

  try {
    await sendEmail(mailData);
    return res.status(200).json({ message: 'Password reset email sent successfully.' });
  } catch (error) {
    return res.status(500).json({ message: 'Error sending email', error: error.message });
  }
};

// Reset Password
const resetPassword = async (req, res) => {
  try {
    const { token } = req.body;
    const { password } = req.body;

    // Find user by reset token
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired token' });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 10);
    await User.findByIdAndUpdate(user._id, {
      password: hashedPassword,
      resetPasswordToken: undefined,
      resetPasswordExpires: undefined
    });

    return res.json({ message: 'Password updated successfully' });
  } catch (err) {
    return res.status(500).json({ message: 'Error updating password', error: err });
  }
};

// Send General Email
const sendMail = async (req, res) => {
  const mailData = {
    to: req.body.to,
    subject: req.body.subject,
    message: req.body.message,
  };

  try {
    const info = await sendEmail(mailData);
    return res.json({ message: `Message sent: ${info.messageId}`, info });
  } catch (error) {
    return res.status(500).json({ message: 'Error sending email', error: error.message });
  }
};

// Google Authentication
app.post('/auth/google', async (req, res) => {
  const { token } = req.body;
  const ticket = await client.verifyIdToken({ idToken: token, audience: process.env.GOOGLE_CLIENT_ID });
  const { name, email } = ticket.getPayload();

  // Check if user exists in DB, else create a new user
  let user = await User.findOne({ email });
  if (!user) {
    user = new User({ name, email });
    await user.save();
  }

  // Generate JWT Token
  const jwtToken = jwt.sign({ id: user._id, email: user.email }, JWT_SECRET, { expiresIn: '1h' });

  return res.status(200).json({ message: 'Google authentication successful', token: jwtToken });
});

// Exporting functions
module.exports = {
  index,
  getbyId,
  update,
  destroy,
  store,
  login,
  logout,
  isTokenBlacklisted,
  forgotPassword,
  resetPassword,
  sendMail
};