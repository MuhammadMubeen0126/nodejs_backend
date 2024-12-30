const mongoose = require('mongoose');

const connectDB = async () => {
    try{
        const dbURL = 'mongodb+srv://Mubeen:Mubeen123@cluster0.te1hx.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

        await mongoose.connect(dbURL,{useNewUrlParser: true, useUnifiedTopology:true})
        console.log('Connected to Mongoose Atlas');
    } catch(err){
        console.error('Error Connecting to MongoDB Atlas',err)
        process.exit(1)
    }
}

module.exports = connectDB;