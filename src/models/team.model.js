const mongoose = require('mongoose');
const dateFormat = require('../helpers/dateFormat.helper');
const constants = require('../../config/constants');

const teamSchema = new mongoose.Schema({
    team_managerId: {
        type: mongoose.Schema.Types.ObjectId,
        index: true,    // Create an index on this field
    },
    managerId: {
        type: [mongoose.Schema.Types.ObjectId],
    },
    name: {
        type: String,
        required: true,
        index: true,
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

teamSchema.pre('save', async function (next) {
    if (!this?.createdAt) {
        this.createdAt = dateFormat.setCurrentTimestamp();
    }
    this.updatedAt = dateFormat.setCurrentTimestamp();
    next();
});

teamSchema.pre('findOneAndUpdate', async function (next) {
    this.set({ updatedAt: dateFormat.setCurrentTimestamp() });
    next();
});

teamSchema.pre('updateOne', async function (next) {
    this.set({ updatedAt: dateFormat.setCurrentTimestamp() });
    next();
});

teamSchema.pre('updateMany', async function (next) {
    this.set({ updatedAt: dateFormat.setCurrentTimestamp() });
    next();
});


const team = mongoose.model('managerTeam', teamSchema);
module.exports = team;