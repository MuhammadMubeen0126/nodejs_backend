const express = require('express')
const cors = require('cors');
const connectDB = require('./db');
const User = require('./models/User');
const passport = require('passport');
const session = require('express-session'); 
// Import User Controller
const {index,getbyId,update,store,destroy, login, logout,isTokenBlacklisted,resetPassword,forgotPassword,googleRegister} = require('./controllers/UserController')
// Import Room Controller
// const {createRoom,getAllRooms,updateRoomStatus,bookRoom,checkInGuest,checkOutGuest,} = require('../controllers/roomController');
const jwt = require('jsonwebtoken');
const { sendEmail } = require('./services/emailService');
const app = express();
const port = 5000;
require('dotenv').config();
app.use(cors());
app.use(express.json()); 
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: 'your_session_secret',  // Secret key for session encryption
  resave: false,  // Don't save session if unmodified
  saveUninitialized: false,  // Don't create session until something is stored
  cookie: { secure: false }  // Set `secure: true` if using HTTPS
}));
app.use(passport.initialize());
app.use(passport.session());

const JWT_SECRET = 'your_jwt_secret';

const authenticateJWT = (req, res, next)=> {
  const token = req.header('Authorization') && req.header('Authorization').split(' ')[1];

  if(!token) {
    return res.status(401).json({message: 'Access denied. No token provided.'})
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if(err){
      return res.status(403).json({message: 'Invalid or Expired token.'})
    }
    req.user = user;
    next();
  })
}
connectDB();

app.get('/users',authenticateJWT,isTokenBlacklisted,index);

app.get('/user/:id',getbyId)

app.put('/user/:id',update)

app.delete('/user/:id',destroy)

app.post('/user', store);

app.post('/login', login);

app.post('/logout', logout);

app.post('/forgot-password', forgotPassword);

app.put('/reset-password/:token', resetPassword);


// Google Authentication
app.post('/auth/google',googleRegister );

  app.listen(port,()=>{
    console.log(port+"is running")
  })
