const mongoose = require('mongoose');
const dateFormat = require('../helpers/dateFormat.helper');
const { JWT_AUTH_TOKEN_SECRET, JWT_EXPIRES_IN, } = require('../../config/key');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

const adminSchema = new mongoose.Schema(
    {
        firstName: {
            type: String
        },
        lastName: {
            type: String
        },
        profilePicture: {
            type: String
        },
        email: {
            type: String,
            lowercase: true,
        },
        password: {
            type: String,
        },
        otp: {
            type: Number
        },
        expirationTime: {
            type: Date
        },
        isVerified: {
            type: Boolean,
            default: false
        },
        createdAt: {
            type: Number,
            index: true
        },
        updatedAt: {
            type: Number,
            index: true
        },
        status: {
            type: Number,
            default: 1,
            enum: [1, 2, 3]
        }
    }
);

//Generate auth token
adminSchema.methods.generateAuthToken = async function () {
    let user = this;
    let token = jwt.sign({
        _id: user._id.toString(),
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        status: user.status,
    }, JWT_AUTH_TOKEN_SECRET, {
        expiresIn: JWT_EXPIRES_IN
    });

    return token;
}

//Checking if password is valid
adminSchema.methods.validPassword = function (password) {
    return bcrypt.compareSync(password, this.password);
};


adminSchema.pre('save', async function (next) {
    if (!this?.createdAt) {
        this.createdAt = dateFormat.setCurrentTimestamp();
    }
    this.updatedAt = dateFormat.setCurrentTimestamp();
    next();
});

adminSchema.pre('findOneAndUpdate', async function (next) {
    if (!this?.createdAt) {
        this.createdAt = dateFormat.setCurrentTimestamp();
    }
    this.updatedAt = dateFormat.setCurrentTimestamp();
    next();
});

adminSchema.pre('updateOne', async function (next) {
    if (!this?.createdAt) {
        this.createdAt = dateFormat.setCurrentTimestamp();
    }
    this.updatedAt = dateFormat.setCurrentTimestamp();
    next();
});

const admin = mongoose.model('admin', adminSchema);
module.exports = admin;
