let userModel = require("../../models/user.model");
const surveyModel = require('../../models/survey.model');
const constants = require('../../../config/constants');
const { searchHelper, facetHelper } = require('../../helpers/helper')
let ObjectId = require('mongodb').ObjectId

exports.polltakerManagerService = async (data) => {
    try {
        let pipeline = [];
        pipeline.push(
            {
                $match: {
                    managerId: new ObjectId(data.managerId),
                    userRole: constants.USER_ROLE.POLL_TAKER + '',
                    status: { $ne: constants.STATUS.DELETED }
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
        console.log(result)
        return result;
    } catch (e) {
        return false;
    }
}



// {
//     $lookup: {
//         from: 'survey',
//             let: { polltakerIds: '$polltaker' },
//         pipeline: [{
//             $match: {
//                 $expr: {
//                     $and: [
//                         { $in: ['$_id', '$$polltakerIds'] },
//                         { $ne: ['$status', constants.STATUS.DELETED] }
//                     ]
//                 }
//             }
//         }],
//             as: 'surveyData'
//     }
// },


// exports.polltakerService = async (polltakerId) => {
//     let surveyList = await surveyModel.find({polltaker:{$in:polltakerId}});
//     console.log(surveyList,'surveyList')
// }

