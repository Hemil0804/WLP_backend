const mongoose = require('mongoose');
const dateFormat = require('../helpers/dateFormat.helper');
const constants = require('../../config/constants');

const questionSchema = new mongoose.Schema({
    questionTitle: {
        type: String,
        required: true,
        trim: true,
        index: true
    },
    mcqOptions: [{
        name: { type: String, trim: true },
        description: { type: String, trim: true },
        isCorrect: { type: Boolean, default: false },
    }],
    status: {
        type: Number,
        default: constants.STATUS.ACTIVE,
        index: true
    },
    questionType: {
        type: Number,
        enum: Object.values(constants.QUESTION_TYPE)
    },
    questionBy: {
        type: Number,
        default: constants.QUESTION_BY.ADMIN,
        enum: Object.values(constants.QUESTION_BY)
    },
    addById: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        default: null
    },
    createdAt: {
        type: Number,
        index: true
    },
    updatedAt: {
        type: Number,
        index: true
    },
});


//Output data to JSON
questionSchema.methods.toJSON = function () {
    let question = this;
    let questionObject = question.toObject();
    return questionObject;
};

questionSchema.pre('save', async function (next) {
    if (!this?.createdAt) {
        this.createdAt = dateFormat.setCurrentTimestamp();
    }
    this.updatedAt = dateFormat.setCurrentTimestamp();
    next();
});

questionSchema.pre('findOneAndUpdate', async function (next) {
    this.set({ updatedAt: dateFormat.setCurrentTimestamp() });
    next();
});

questionSchema.pre('updateOne', async function (next) {
    this.set({ updatedAt: dateFormat.setCurrentTimestamp() });
    next();
});


const Question = mongoose.model('questions', questionSchema);
module.exports = Question;