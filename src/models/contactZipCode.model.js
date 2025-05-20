const mongoose = require("mongoose");

const zipContactSchema = new mongoose.Schema({
    uuid: {
        type: String,
        unique: true,
        index: true
    },
    zip: {
        type: String,
        index: true
    },
    cityId: {
        type: String,
        required: true,
        index: true,
    },
    stateId: {
        type: String,
        required: true, 
        index: true,
    },
    status: {
        type: Number,
        enum: [1, 2, 3],
        default: 1
    }
}, { collection: "zipContact", timestamps: true });

module.exports = mongoose.model("zipContact", zipContactSchema);