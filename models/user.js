const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    username: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        required: true
    }
});

const User = module.exports = mongoose.model('User', UserSchema);

module.exports.registerUser = async function(newUser, callback) {
    try {
        const salt = await bcrypt.genSalt(10);
        newUser.password = await bcrypt.hash(newUser.password, salt);
        await newUser.save();
        callback(null, newUser);
    } catch (err) {
        callback(err, null);
    }
};

module.exports.getUserByUsername = async function(username, callback) {
    try {
        const query = { username: username };
        const user = await User.findOne(query);
        callback(null, user);
    } catch (err) {
        callback(err, null);
    }
};

module.exports.getUserById = async function(id, callback) {
    try {
        const user = await User.findById(id);
        callback(null, user);
    } catch (err) {
        callback(err, null);
    }
};

module.exports.comparePassword = async function(candidatePassword, hash, callback) {
    try {
        const isMatch = await bcrypt.compare(candidatePassword, hash);
        callback(null, isMatch);
    } catch (err) {
        callback(err);
    }
};
