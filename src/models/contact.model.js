const mongoose = require('mongoose');
const dateFormat = require('../helpers/dateFormat.helper');
const constants = require('../../config/constants');

const contactSchema = new mongoose.Schema({
    contactStateId: {
        type: Number,
        index: true
    },
    voterNum: {
        type: Number,
        index: true
    }, 
    firstName: {
        type: String,
        trim: true,
        index: false
    },
    lastName: {
        type: String,
        trim: true,
        index: false
    },
    title: {
        type: String,
        trim: true,
        index: false
    },
    email: {
        type: String,
        index: true,
        lowercase: true
    },
    phone: {
        type: String,
    },
    address: {
        streetAddress: { type: String, trim: true },
        city: { type: String, trim: true },
        state: { type: String, trim: true },
        zip: { type: String, trim: true },
        state: { type: String },
        latitude: { type: Number, trim: true, },
        longitude: { type: Number, trim: true },
        country: { type: String, trim: true, default: 'U.S.A' }
    },
    zipId: {
        type: String,
        // required: true,
        index: true,
    },
    cityId: {
        type: String,
        // required: true,
        index: true,
    },
    stateId: {
        type: String,
        // required: true,
        index: true,
    },
    streetAddress: { type: String, trim: true },
    country: { type: String, trim: true, default: 'U.S.A' },
    latitude: { type: String, trim: true, },
    longitude: { type: String, trim: true },
    dob: {
        type: Number,
        trim: true,
        index: true
    },
    regDate: {
        type: Number,
        trim: true,
        index: true
    },
    gender: {
        type: String,
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
    importId: {
        type: String
    },
    updatedLatLong: {
        type: Boolean,
        default: false
    },
});

contactSchema.pre('save', async function (next) {
    if (!this?.createdAt) {
        this.createdAt = dateFormat.setCurrentTimestamp();
    }
    this.updatedAt = dateFormat.setCurrentTimestamp();
    next();
});

// Automatically update updatedAt before updating
contactSchema.pre('findOneAndUpdate', async function (next) {
    this.set({ updatedAt: new Date() });
    next();
});

contactSchema.pre('updateOne', async function (next) {
    this.set({ updatedAt: new Date() });
    next();
});

contactSchema.pre('updateMany', async function (next) {
    this.set({ updatedAt: new Date() });
    next();
});

const contact = mongoose.model('contact', contactSchema);
module.exports = contact;
