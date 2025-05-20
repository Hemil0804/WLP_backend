const mongoose = require('mongoose');
const dateFormat = require('../helpers/dateFormat.helper');
const constants = require('../../config/constants');

const subscriptionSchema = new mongoose.Schema(
    {
        subscriptionType: {
            type: String,
            enum: Object.values(constants.SUBSCRIPTION_TYPE)
        },
        price: {
            type: Number
        },
        title: {
            trim: true,
            type: String
        },
        slug: {
            type: String
        },
        description: {
            type: [String]
        },
        allowedContacts: {
            type: Number
        },
        allowedQuestions: {
            type: Number
        },
        allowedManagers: {
            type: Number
        },
        allowedPolltakers: {
            type: Number
        },
        allowedSurveys: {
            type: Number
        },
        timeLine: {
            type: String
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

subscriptionSchema.pre('save', async function (next) {
    if (!this?.createdAt) {
        this.createdAt = dateFormat.setCurrentTimestamp();
    }
    this.updatedAt = dateFormat.setCurrentTimestamp();
    next();
});

const subscription = mongoose.model('subscription', subscriptionSchema);
module.exports = subscription;
