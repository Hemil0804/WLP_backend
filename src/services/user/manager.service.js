let userModel = require("../../models/user.model");
let surveyModel = require("../../models/survey.model");
const constant = require('../../../config/constants');
const { searchHelper, facetHelper } = require('../../helpers/helper')
let ObjectId = require('mongodb').ObjectId

exports.managerService = async (data) => {
    try {
        let pipeline = [];
        pipeline.push(
            {
                $match: {
                    userRole: "2",
                    teamOwnerId: data.teamManagerId,
                    status: { $ne: constant.STATUS.DELETED }
                }
            },
        );

        let obj = {}
        sortBy = data.sortBy ? data.sortBy : -1
        sortBy = parseInt(sortBy)
        let sortKey = data.sortKey ? data.sortKey : 'createdAt'
        obj[sortKey] = sortBy

        if (data.search) {
            let fieldsArray = ['fullName', 'email', 'mobileNumber']
            pipeline.push(searchHelper(data.search, fieldsArray))
        }

        pipeline.push({ $sort: obj }, facetHelper(Number(data.skip), Number(data.limit)))

        const result = await userModel.aggregate(pipeline);

        return result;
    } catch (e) {
        return false;
    }
}
exports.managerSurveyListService = async (data) => {
    try {
        const managers = await userModel.find({ userRole: "2", teamOwnerId: data.teamOwnerId });
        const managerIds = managers.map(manager => manager._id);
        let pipeline = [];
        if (data.managerId == "" && data.type == "manager") {
            pipeline.push({
                $match: {
                    managerId: { $in: managerIds },
                    status: { $ne: constant.STATUS.DELETED },
                }
            })
        } else if(data.managerId != "" && data.type == "manager"){
            pipeline.push({
                $match: {
                    managerId: new ObjectId(data.managerId),
                    status: { $ne: constant.STATUS.DELETED },
                }
            })
        }else if(data.managerId == "" && data.type == "self"){
            pipeline.push({
                $match: {
                    managerId: data.teamOwnerId,
                    status: { $ne: constant.STATUS.DELETED },
                }
            })
        }
        pipeline.push(
            {
                $lookup: {
                    from: 'users',  // Collection name in the database
                    localField: 'managerId',
                    foreignField: '_id',
                    as: 'managerDetails'
                }
            },
            {
                $unwind: '$managerDetails'
            },
            {
                $project: {
                    surveyName: 1,
                    surveyDate: 1,
                    managerDetails: {
                        fullName: 1,
                        _id: 1
                    },
                    contact: 1,
                    status: 1,
                    createdAt:1
                }
            }
        );

        let obj = {}
        sortBy = data.sortBy ? data.sortBy : -1
        sortBy = parseInt(sortBy)
        let sortKey = data.sortKey ? data.sortKey : 'createdAt'
        obj[sortKey] = sortBy

        if (data.search) {
            let fieldsArray = ['surveyName', 'managerData.fullName', 'surveyDate', 'status']
            pipeline.push(searchHelper(data.search, fieldsArray))
        }

        pipeline.push({ $sort: obj }, facetHelper(Number(data.skip), Number(data.limit)))

        const result = await surveyModel.aggregate(pipeline);
        return result;
    } catch (e) {
        console.log(e, 'error')
        return false;
    }
}


