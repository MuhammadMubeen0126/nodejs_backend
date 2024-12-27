const mongoose = require('mongoose');
const bcrypt = require('bcrypt')
const saltRounds = 10

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    age: {
        type: Number,
        required: true
    },
    password: {
        type: String,
        required: true
    },
})

userSchema.pre('save', async function(next){
    if(this.isModified('password')){
        try{
            const hashedPassword = await bcrypt.hash(this.password,saltRounds);
            this.password = hashedPassword;
            next();
        }catch(error){
            next(error);
        }
    }else{
        next();
    }
});

userSchema.methods.comparePassword = async function(candidatePassword){
    try{
        const isMatch = await bcrypt.compare(candidatePassword,this.password);
        return isMatch
    }catch(error){
        throw new error('Password comparison failed')
    }
}


const User = mongoose.model('User',userSchema);

module.exports = User;