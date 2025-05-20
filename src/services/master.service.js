let contactModel = require("../models/contact.model");
let stateModel = require("../models/state.model");
let cityModel = require("../models/city.model");
const constant = require('../../config/constants');
const { searchHelper, facetHelper } = require('../helpers/helper');
const surveyModel = require("../models/survey.model");
let ObjectId = require('mongodb').ObjectId

exports.masterService = async (data) => {
    try {
        let pipeline = [];
        pipeline.push(
            {
                $match: {
                    status: { $ne: constant.STATUS.DELETED }
                }
            },

            {
                $group: {
                    _id: {
                        city: "$address.city",
                        state: "$address.state",
                        zip: "$address.zip"
                    },
                    count: { $sum: 1 }
                }
            },
            {
                $group: {
                    _id: null,
                    cities: { $addToSet: "$_id.city" },
                    states: { $addToSet: "$_id.state" },
                    zipCodes: { $addToSet: "$_id.zip" }
                }
            },
            {
                $project: {
                    _id: 0,
                    cities: 1,
                    states: 1,
                    zipCodes: 1
                }
            }
        );

        const result = await contactModel.aggregate(pipeline);
        return result;

    } catch (e) {
        console.log("masterService", e);
        return false;
    }
}

exports.surveyStatisticsService = async (data) => {
    try {
        let pipeline = [];
        pipeline.push(
            {
                $match: {
                    polltaker: { $in: [data.pollTaker], },
                    status: { $ne: constant.STATUS.DELETED, },
                },
            },
            {
                $facet: {
                    total: [{ $count: "total" }],
                    pending: [
                        { $match: { surveyStatus: "pending" } }, // Assuming 1 represents "pending"
                        { $count: "pending" },
                    ],
                    completed: [
                        { $match: { surveyStatus: "completed" } }, // Assuming 2 represents "completed"
                        { $count: "completed" },
                    ],
                    inProcess: [
                        { $match: { surveyStatus: "inProcess" } }, // Assuming 2 represents "completed"
                        { $count: "inProcess" },
                    ],
                },
            },
            {
                $project: {
                    total: { $arrayElemAt: ["$total.total", 0] },
                    pending: { $arrayElemAt: ["$pending.pending", 0] },
                    completed: { $arrayElemAt: ["$completed.completed", 0] },
                    inProcess: { $arrayElemAt: ["$inProcess.inProcess", 0] },
                },
            },
        );

        const result = await surveyModel.aggregate(pipeline);
        return result;

    } catch (e) {
        console.log("statisticsService", e);
        return false;
    }
}




exports.contactStatisticsService = async (data) => {
    try {
        let pipeline = [];
        pipeline.push(
            {
                $match: {
                    polltaker: { $in: [data.pollTaker], },
                    status: { $ne: constant.STATUS.DELETED, },
                },
            },
            {
                $unwind: "$contact",
            },
            {
                $facet: {
                    total: [{ $count: "total" }],
                    pending: [
                        { $match: { "contact.status": "pending" } },
                        { $count: "pending" },
                    ],
                    completed: [
                        { $match: { "contact.status": "completed" } },
                        { $count: "completed" },
                    ],
                    refuse: [
                        { $match: { "contact.status": "refuse" } },
                        { $count: "refuse" },
                    ],
                    noanswer: [
                        { $match: { "contact.status": "noanswer" } },
                        { $count: "noanswer" },
                    ],
                    other: [
                        { $match: { "contact.status": "other" } },
                        { $count: "other" },
                    ],
                },
            },
            {
                $project: {
                    total: { $arrayElemAt: ["$total.total", 0] },
                    pending: { $arrayElemAt: ["$pending.pending", 0] },
                    refuse: { $arrayElemAt: ["$refuse.refuse", 0] },
                    noanswer: { $arrayElemAt: ["$noanswer.noanswer", 0] },
                    completed: { $arrayElemAt: ["$completed.completed", 0] },
                    other: { $arrayElemAt: ["$other.other", 0] },
                },
            },
        );

        const result = await surveyModel.aggregate(pipeline);
        return result;

    } catch (e) {
        console.log("statisticsService", e);
        return false;
    }
}
