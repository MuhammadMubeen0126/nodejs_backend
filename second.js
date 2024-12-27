const express = require('express')
const cors = require('cors');
const connectDB = require('./db');
const User = require('./models/User');


const app = express();
const port = 5000;

app.use(cors());
connectDB();

app.get('/',(req,res) => {
  res.send('Welcome to MongoDB Atlas API')
});

app.get('/post', async (req,res) => {
  try{
    const NewUser = new User({
      name: 'Abcd',
      email: "abcd@example.com",
      age: 45
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
});
  
  app.listen(port,()=>{
    console.log(port+"is running")
  })


  // liIVPrgeQRoUl9Jn

  // ikhlasafzaal13