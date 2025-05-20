const mongoose = require('mongoose');
const dateFormat = require('../helpers/dateFormat.helper');
const constants = require('../../config/constants');

const surveySchema = new mongoose.Schema({
    surveyName: {
        type: String
    },
    surveyDate: {
        type: Date
    },
    managerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user'
    },
    contact: [{
        contactId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'contact' // Optional: if you have a PollTaker model
        },
        status: {
            type: String,
            default: "pending",
            enum: ["pending", "inProcess", "completed", "refuse", "noAnswer", "other"]
        },
        note: {
            type: String,
            default: null
        },
        questionAnswers: [{
            questionId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'questions'
            },
            ansId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'questions'
            },
            answer: {
                type: String
            }
        }],
        submitById: {
            type: mongoose.Schema.Types.ObjectId,
            default: null,
            ref: 'user'
        },
    },
    ],
    polltaker: {
        type: [mongoose.Schema.Types.ObjectId],
        ref: 'user'
    },
    questions: {
        type: [mongoose.Schema.Types.ObjectId]
    },
    description: {
        type: String
    },
    status: {
        type: Number,
        default: constants.STATUS.ACTIVE,
        index: true
    },
    surveyStatus: {
        type: String,
        enum: ["pending", "inProcess", "completed"],
        default: "pending"
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

surveySchema.pre('save', async function (next) {
    if (!this?.createdAt) {
        this.createdAt = dateFormat.setCurrentTimestamp();
    }
    this.updatedAt = dateFormat.setCurrentTimestamp();
    next();
});

surveySchema.pre('findOneAndUpdate', async function (next) {
    this.set({ updatedAt: dateFormat.setCurrentTimestamp() });
    next();
});

surveySchema.pre('updateOne', async function (next) {
    this.set({ updatedAt: dateFormat.setCurrentTimestamp() });
    next();
});


const Survey = mongoose.model('survey', surveySchema);
module.exports = Survey;