const mongoose = require("mongoose");

const cityContactSchema = new mongoose.Schema({
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
}, { collection: "citiesContact", timestamps: true });

module.exports = mongoose.model("citiesContact", cityContactSchema);