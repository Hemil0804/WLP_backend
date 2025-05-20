const mongoose = require("mongoose");

const stateSchema = new mongoose.Schema({
    name: {
        type: String,
        index: true
    },
    countryId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        index: true,
    },
    status: {
        type: Number,
        enum: [1, 2, 3],
        default: 1
    }
}, { collection: "states", timestamps: true });

module.exports = mongoose.model("states", stateSchema);