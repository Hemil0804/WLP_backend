const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const dateFormat = require('../helpers/dateFormat.helper');
const constants = require('../../config/constants');
const { JWT_AUTH_TOKEN_SECRET, JWT_EXPIRES_IN, } = require('../../config/key');
const { NumberModule } = require('@faker-js/faker');

const userSchema = new mongoose.Schema({
    managerId: {
        type: mongoose.Schema.Types.ObjectId,
        default: null,  // Use null as the default value
        index: true,    // Create an index on this field
    },
    teamOwnerId: {
        type: mongoose.Schema.Types.ObjectId,
        default: null,  // Use null as the default value
        index: true,    // Create an index on this field
    },
    userRole: {
        type: String,
        // default: constants.USER_ROLE.MANAGER,
        index: true
    },
    fullName: {
        type: String,
        trim: true,
        index: false
    },
    email: {
        type: String,
        required: true,
        index: true,
        lowercase: true
    },
    mobileNumber: {
        type: String,
    },
    password: {
        type: String,
    },
    isVerified: {
        type: Boolean,
        default: false,
        index: false
    },
    address: {
        type: String, trim: true,
    },
    otp: {
        type: Number,
        index: false
    },
    otpExpiresAt: {
        type: Number,
    },
    profileImage: {
        type: String,
        default: '',
    },
    userPreferences: {
        cityId: {
            type: [String],
            ref: 'citiesContact'
        },
        stateId: {
            type: String,
            ref: 'statesContact'
        },
        countryId: {
            type: String,
            default: null,
            ref: 'country'
        },
        zipId: {
            type: [String],
            ref: 'zipContact'
        },
    },
    subscriptionId: {
        type: mongoose.Types.ObjectId,
        ref: 'subscription'
    },
    isSubscribed: {
        type: Boolean,
        default: false,
        index: false
    },
    filledPreference: {
        type: Boolean,
        default: false,
        index: false
    },
    assignContact: {
        type: Boolean,
        default: false,
        index: false
    },
    assignedContacts: {
        type: [mongoose.Schema.Types.ObjectId],
        ref: 'contact',
        index: true
    },
    status: {
        type: Number,
        default: constants.STATUS.ACTIVE,
        index: true
    },
    createdAt: {
        type: Number,
        index: true
    },
    notification: {
        type: Boolean,
        index: false
    },
    totalCart: {
        type: Number,
        default: 0
    },
    updatedAt: {
        type: Number,
        index: true
    },
});

//Checking if password is valid
userSchema.methods.validPassword = function (password) {
    return bcrypt.compareSync(password, this.password);
};

//Output data to JSON
userSchema.methods.toJSON = function () {
    let user = this;
    let userObject = user.toObject();
    return userObject;
};

//Checking for user credentials
userSchema.statics.findByCredentials = async function (email, password) {

    const user = await User.findOne({
        email: email,
        status: { $ne: constants.STATUS.DELETED }
    });
    if (!user) {
        return 1
    }

    if (user?.isSocialuser) {
        return user.socialType == 'google' ? 3 : 4
    };
    console.log('validPassword', user.validPassword(password));
    if (!user.validPassword(password)) {
        return 2
    }
    return user;
}

//Generate auth token
userSchema.methods.generateAuthToken = async function () {
    let user = this;
    let token = jwt.sign({
        _id: user._id.toString(),
        firstName: user.firstName,
        lastName: user.lastName,
        userRole: user.userRole,
        email: user.email,
        status: user.status,
        userType: user.userType
    }, JWT_AUTH_TOKEN_SECRET, {
        expiresIn: JWT_EXPIRES_IN
    });

    return token;
}

userSchema.pre('save', async function (next) {
    if (!this?.createdAt) {
        this.createdAt = dateFormat.setCurrentTimestamp();
    }
    this.updatedAt = dateFormat.setCurrentTimestamp();
    next();
});

userSchema.pre('findOneAndUpdate', async function (next) {
    this.set({ updatedAt: dateFormat.setCurrentTimestamp() });
    next();
});

userSchema.pre('updateOne', async function (next) {
    this.set({ updatedAt: dateFormat.setCurrentTimestamp() });
    next();
});

userSchema.pre('updateMany', async function (next) {
    this.set({ updatedAt: dateFormat.setCurrentTimestamp() });
    next();
});


const User = mongoose.model('user', userSchema);
module.exports = User;