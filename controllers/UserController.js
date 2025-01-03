const User = require('../models/User')
const passport = require('../models/passport');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
require('dotenv').config();



const JWT_SECRET = 'your_jwt_secret';


const index = async (req,res) => {
    const users = await User.find();
    return res.json(users);
}

const getbyId = async (req,res) =>{
    const users = await User.findById(req.params.id);
    return res.json(users);
}

const update = async (req,res) => {
    const users = await User.findByIdAndUpdate(req.params.id,{
        "name":req.body.name,
        "email":req.body.email,
        "age":req.body.age
      });
    return res.json(users);
}

const destroy = async (req,res) => {
    await User.findByIdAndDelete(req.params.id);
  return res.json({
    "message":"deleted successfully"
  });
}

const store = async (req,res) => {
    try{
        const NewUser = new User({
          name: req.body.name,
          email: req.body.email,
          age: parseInt(req.body.age),
          password: req.body.password,
        });
    
        const savedUser = await NewUser.save();
        res.json({
          message: ' User Saved Successfully',
          user: savedUser
        });
        
      }
      catch(err){
        res.status(500).json({
          message: 'Error saving User',
          error: err
        })
    }
}

const login = (req,res,next) => {
  passport.authenticate('local', (err, user, info) => {
    if (err) {
      return next(err);
    }
    if (!user) {
      return res.status(401).json({ message: info.message || 'Authentication failed' });
    }

    // User authenticated successfully, now create JWT
    const token = jwt.sign({ id: user._id, email: user.email }, JWT_SECRET, { expiresIn: '1h' });

    // Respond with the token
    return res.status(200).json({
      message: 'Login successful',
      token: token,
    });
  })(req, res, next);
}
const tokenBlacklist = new Set();
const logout = (req, res, next) => {
  // Extract token from Authorization header
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(400).json({ message: 'Token is required for logout' });
  }

  // Add the token to the blacklist
  tokenBlacklist.add(token);

  return res.status(200).json({ message: 'Logout successful' });
};

// Middleware to check if a token is blacklisted
const isTokenBlacklisted = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (tokenBlacklist.has(token)) {
    return res.status(401).json({ message: 'Token has been invalidated. Please log in again.' });
  }
  next();
};


// Forgot Password - Step 1: Send email with reset token
const forgotPassword = async (req, res) => {
  const { email } = req.body;
  
  try {
    // Check if the user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User with this email does not exist' });
    }

    // Generate a reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    console.log(resetToken)
    const resetTokenExpiration = Date.now() + 3600000; // Token expires in 1 hour

    // Save reset token and its expiration in the database
    user.resetPasswordToken = resetToken;
    user.resetPasswordTokenExpiration = resetTokenExpiration;
    await user.save();

    // Send reset email with token
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'tunaytair@gmail.com', // Your email address
        pass: 'iywf wkcq qzws sunr' // Your email password (consider using environment variables for security)
      }
    });

    const resetLink = `http://localhost:5000/reset-password/${resetToken}`;

    const mailOptions = {
      from: 'tunaytair@gmail.com',
      to: email,
      subject: 'Password Reset Request',
      text: `You requested a password reset. Click the link to reset your password: ${resetLink}`
    };

    await transporter.sendMail(mailOptions);
    
    return res.status(200).json({ message: 'Password reset email sent' });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Error sending password reset email' });
  }
};

// Reset Password - Step 2: Validate token and update password
const resetPassword = async (req, res) => {
  const { token, newPassword } = req.body;
  
  try {
    // Find the user by reset token
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordTokenExpiration: { $gt: Date.now() } // Check if the token is still valid
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired token' });
    }

    // Hash the new password (consider using bcrypt)
    user.password = newPassword;  // You should hash the password here before saving it
    user.resetPasswordToken = undefined;
    user.resetPasswordTokenExpiration = undefined;

    await user.save();
    
    return res.status(200).json({ message: 'Password successfully reset' });
  
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Error resetting password' });
  }
};

module.exports = {
  index,
  getbyId,
  update,
  destroy,
  store,
  login,
  logout,
  isTokenBlacklisted,
  resetPassword,
  forgotPassword
};