const mongoose = require('mongoose');
const dateFormat = require('../helpers/dateFormat.helper');

const cmsSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            trim: true,
            index: true
        },
        titleIt: {
            type: String,
            trim: true,
            index: true
        },
        description: {
            type: String,
            trim: true,
            index: true
        },
        descriptionIt: {
            type: String,
            trim: true,
            index: true
        },
        slug: {
            type: String,
            trim: true,
            index: true
        },
        status: {
            type: Number,
            default: 1,
            enum: [1, 2, 3],
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
    }
);

cmsSchema.pre('save', async function (next) {
    if (!this?.createdAt) {
        this.createdAt = dateFormat.setCurrentTimestamp();
    }
    this.updatedAt = dateFormat.setCurrentTimestamp();
    next();
});


const CMS = mongoose.model('cms', cmsSchema);
module.exports = CMS;
