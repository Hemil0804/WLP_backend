const mongoose = require("mongoose");

const citySchema = new mongoose.Schema({
    name: {
        type: String,
        index: true
    },
    stateId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        index: true,
    },
    status: {
        type: Number,
        enum: [1, 2, 3],
        default: 1
    }
}, { collection: "cities", timestamps: true });

module.exports = mongoose.model("cities", citySchema);