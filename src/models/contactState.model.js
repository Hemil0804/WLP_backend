const mongoose = require("mongoose");

const statesContactSchema = new mongoose.Schema({
    uuid: {
        type: String,
        unique: true,
        index: true
    },
    name: {
        type: String,
        index: true
    },
    slug: {
        type: String,
        index: true
    },
    countryId: {
        type: String,
        index: true,
    },
    status: {
        type: Number,
        enum: [1, 2, 3],
        default: 1
    }
}, { collection: "statesContact", timestamps: true });

module.exports = mongoose.model("statesContact", statesContactSchema);  