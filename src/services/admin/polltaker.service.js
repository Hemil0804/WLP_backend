let userModel = require("../../models/user.model");
const surveyModel = require('../../models/survey.model');
const constant = require('../../../config/constants');
const { searchHelper, facetHelper } = require('../../helpers/helper')
let ObjectId = require('mongodb').ObjectId

exports.polltakerService = async (data) => {
    try {
        let pipeline = [];
        // Add the filter for manager wise pollTaker if it is provided in the request
        pipeline.push(
            {
                $match: {
                    userRole: '3',
                    status: { $ne: constant.STATUS.DELETED }
                }
            }
        );
        if (data.managerId) {
            console.log(data.managerId,'data.managerId');
            
            pipeline.push({
                $match: {
                    managerId: new ObjectId(data.managerId)
                }
            });
        }
        pipeline.push(
            {
                $lookup: {
                    from: 'users',
                    let: { managerId: '$managerId' },
                    pipeline: [{
                        $match: {
                            $expr: {
                                $and: [
                                    { $eq: ['$_id', '$$managerId'] },
                                    { $ne: ['$status', constant.STATUS.DELETED] }
                                ]
                            }
                        }
                    }],
                    as: 'managerData'
                }
            }
        );
        // // Add the filter for manager wise pollTaker if it is provided in the request
        // if (data.managerId) {
        //     pipeline.push({
        //         $match: {
        //             managerId: data.managerId
        //         }
        //     });
        // }
        pipeline.push(
            {
                $match: {
                    userRole: constant.USER_ROLE.POLL_TAKER + '',
                    status: { $ne: constant.STATUS.DELETED }
                }
            },
            {
                $lookup: {
                    from: 'surveys',
                    localField: '_id',
                    foreignField: 'polltaker',
                    as: 'surveys'
                }
            },
            {
                $addFields: {
                    totalSurveys: { $size: '$surveys' },
                    activeSurveys: {
                        $size: {
                            $filter: {
                                input: '$surveys',
                                as: 'survey',
                                cond: { $eq: ['$$survey.surveyStatus', "inProcess"] }
                            }
                        }
                    },
                    pendingSurveys: {
                        $size: {
                            $filter: {
                                input: '$surveys',
                                as: 'survey',
                                cond: { $eq: ['$$survey.surveyStatus', "pending"] }
                            }
                        }
                    },
                    completedSurveys: {
                        $size: {
                            $filter: {
                                input: '$surveys',
                                as: 'survey',
                                cond: { $eq: ['$$survey.surveyStatus', "completed"] }
                            }
                        }
                    }
                }
            }
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

// exports.polltakerService = async (polltakerId) => {
//     let surveyList = await surveyModel.find({polltaker:{$in:polltakerId}});
//     console.log(surveyList,'surveyList')
// }

