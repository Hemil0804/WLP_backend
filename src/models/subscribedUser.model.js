const mongoose = require('mongoose');
const dateFormat = require('../helpers/dateFormat.helper');
const constants = require('../../config/constants');

const subscribedUserSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Types.ObjectId,
        ref: 'user'
    },
    subscriptionId: {
        type: mongoose.Types.ObjectId,
        ref: 'subscription'
    },
    month: {
        type: Number
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
    updatedAt: {
        type: Number,
        index: true
    },
    deletedAt: {
        type: Number,
        default: null,
        index: true
    }
});

subscribedUserSchema.pre('save', async function (next) {
    if (!this?.createdAt) {
        this.createdAt = dateFormat.setCurrentTimestamp();
    }
    this.updatedAt = dateFormat.setCurrentTimestamp();
    next();
});

subscribedUserSchema.pre('findOneAndUpdate', async function (next) {
    this.set({ updatedAt: dateFormat.setCurrentTimestamp() });
    next();
});

subscribedUserSchema.pre('updateOne', async function (next) {
    this.set({ updatedAt: dateFormat.setCurrentTimestamp() });
    next();
});


const subscribedUser = mongoose.model('subscribedUser', subscribedUserSchema);
module.exports = subscribedUser;