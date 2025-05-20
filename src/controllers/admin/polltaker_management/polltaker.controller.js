const userModel = require('../../../models/user.model');
const surveyModel = require('../../../models/survey.model');
// const userModel = require('../../../models/user.model');
const responseHelper = require('../../../helpers/responseHelper')
const constants = require('../../../../config/constants')
const logger = require('../../../helpers/loggerService')
const moment = require('moment')
const Helper = require("../../../helpers/helper")
const polltakerTransformer = require('../../../transformers/admin/polltaker.transformer');
const { polltakerService } = require("../../../services/admin/polltaker.service")

//polltaker OR Team Owner List
exports.list = async (req, res) => {
    try {
        let reqBody = req.body
        const { limitCount, skipCount } = Helper.getPageAndLimit(reqBody.page, reqBody.limit);

        let findpolltakerList = await polltakerService({
            skip: skipCount,
            limit: limitCount,
            sortBy: reqBody.sortBy,
            sortKey: reqBody.sortKey,
            search: reqBody.search,
            managerId: reqBody.managerId
        })

        // polltaker Transform the list
        let response = findpolltakerList && findpolltakerList.length > 0 && findpolltakerList[0]?.data ? findpolltakerList[0].data : [];
        const responseData = await polltakerTransformer.polltakerTransform(response);
        let responseMeta = {
            totalCount: findpolltakerList && findpolltakerList.length > 0 && findpolltakerList[0].totalRecords[0] ? findpolltakerList[0].totalRecords[0].count : 0,
        };
        return responseHelper.successapi(res, res.__("polltakerListFound"), constants.META_STATUS.DATA, constants.WEB_STATUS_CODE.OK, responseData, responseMeta)
    } catch (e) {
        logger.logger.error(`Error from catch: ${e}`);
        return responseHelper.error(res, res.__('somethingWentWrongPleaseTryAgain'), constants.WEB_STATUS_CODE.SERVER_ERROR, e);
    }

}

//Status Update of the polltaker
exports.updateStatus = async (req, res) => {
    try {
        let reqBody = req.body
        let userDetails = await userModel.findOneAndUpdate({
            _id: reqBody.polltakerId,
        }, { $set: { status: reqBody.status } });
        return responseHelper.successapi(res, res.__('polltakerStatusUpdated'), constants.META_STATUS.DATA, constants.WEB_STATUS_CODE.OK);
    } catch (e) {
        logger.logger.error(`Error from catch: ${e}`);
        return responseHelper.error(res, res.__('somethingWentWrongPleaseTryAgain'), constants.WEB_STATUS_CODE.SERVER_ERROR, e);
    }
}


//Delete polltaker
exports.delete = async (req, res) => {
    try {
        let reqBody = req.body
        let userDetails = await userModel.findOneAndUpdate({
            _id: reqBody.polltakerId,
        }, { $set: { status: constants.STATUS.DELETED } });
        return responseHelper.successapi(res, res.__('polltakerdeletedSuccess'), constants.META_STATUS.DATA, constants.WEB_STATUS_CODE.OK);
    } catch (e) {
        logger.logger.error(`Error from catch: ${e}`);
        return responseHelper.error(res, res.__('somethingWentWrongPleaseTryAgain'), constants.WEB_STATUS_CODE.SERVER_ERROR, e);
    }
}


//view polltaker
exports.view = async (req, res) => {
    try {
        let reqBody = req.body;
        let pollTakerData = [];

        if (!reqBody.pollTakerId || reqBody.pollTakerId.trim() === "") return responseHelper.error(res, res.__('PleaseProvidePollTakerId'), constants.WEB_STATUS_CODE.BAD_REQUEST);

        let pollTaker = await userModel.findOne({ _id: reqBody.pollTakerId, /*managerId: req.user.managerId,*/ userRole: constants.USER_ROLE.POLL_TAKER }).lean();
        if (!pollTaker) return responseHelper.successapi(res, res.__('pollTakerNotFound'), constants.META_STATUS.NO_DATA, constants.WEB_STATUS_CODE.OK);

        pollTakerData.push({ pollTaker: pollTaker }) //push PollTaker profile data 

        if (pollTaker) {
            // Proceed with the aggregation pipeline
            const pipeline = [
                {
                    $match: {
                        managerId: pollTaker.managerId,
                        polltaker: { $in: [pollTaker._id] }
                    }
                },
                {
                    $facet: {
                        surveyList: [{
                            $project:
                            {
                                _id: 1,
                                polltaker: 1,
                                questions: 1,
                                status: 1,
                                surveyStatus: 1,
                                deletedAt: 1,
                                contact: 1,
                                surveyName: 1,
                                surveyDate: 1,
                                managerId: 1,
                                description: 1,
                                createdAt: 1,
                                updatedAt: 1
                            }

                        }],
                        pendingSurveyCount: [
                            { $match: { surveyStatus: 'pending' } },
                            { $count: 'count' }
                        ],
                        inProcessSurveyCount: [
                            { $match: { surveyStatus: 'inProcess' } },
                            { $count: 'count' }
                        ],
                        completedSurveyCount: [
                            { $match: { surveyStatus: 'completed' } },
                            { $count: 'count' }
                        ]
                    }
                },
                {
                    $project: {
                        surveyList: 1,
                        pendingSurveyCount: { $arrayElemAt: ['$pendingSurveyCount.count', 0] },
                        inProcessSurveyCount: { $arrayElemAt: ['$inProcessSurveyCount.count', 0] },
                        completedSurveyCount: { $arrayElemAt: ['$completedSurveyCount.count', 0] }
                    }
                }
            ];
            // Example using MongoDB native driver
            const survey = await surveyModel.aggregate(pipeline).exec();
            // console.log(survey)
            if (survey.length > 0) pollTakerData.push(
                {
                    survey: survey[0].surveyList,
                    pendingSurveyCount: survey[0]?.pendingSurveyCount ? survey[0].pendingSurveyCount : 0,
                    inProcessSurveyCount: survey[0]?.inProcessSurveyCount ? survey[0].inProcessSurveyCount : 0,
                    completedSurveyCount: survey[0]?.completedSurveyCount ? survey[0].completedSurveyCount : 0
                }
            )
        }
        // return console.log(pollTakerData)
        const response = polltakerTransformer.pollTakerViewWithSurveyTransform(pollTakerData);
        return responseHelper.successapi(res, res.__('polltakerDetailsSuccess'), constants.META_STATUS.DATA, constants.WEB_STATUS_CODE.OK, response);

    } catch (err) {
        console.log('Error(viewProfile)', err);
        return responseHelper.error(res, res.__('somethingWentWrongPleaseTryAgain'), constants.WEB_STATUS_CODE.SERVER_ERROR, err);
    }
    // try {
    //     let reqBody = req.body
    //     let polltakerDetails = await userModel.findOne({ _id: reqBody.polltakerId, status: { $ne: constants.STATUS.DELETED } });
    //     if (polltakerDetails) {
    //         let responseObj = {
    //             "isSubscribed":polltakerDetails.isSubscribed,
    //             "_id":polltakerDetails._id,
    //             "managerId":polltakerDetails.managerId,
    //             "fullName":polltakerDetails.fullName,
    //             "email":polltakerDetails.email,
    //             "status":polltakerDetails.status,
    //             "userRole":polltakerDetails.userRole,
    //             "password":polltakerDetails.password,
    //             "isVerified":polltakerDetails.isVerified,
    //             "profileImage":polltakerDetails.profileImage,
    //             "mobileNumber":polltakerDetails.mobileNumber,
    //             "totalCart":polltakerDetails.totalCart,
    //             "createdAt":polltakerDetails.createdAt,
    //             "updatedAt":polltakerDetails.updatedAt
    //         }
    //         let SurveyList = await getSurveyDetails(polltakerDetails._id)
    //         responseObj.SurveyDetails = SurveyList;
    //         return responseHelper.successapi(res, res.__("polltakerDetailsSuccess"), constants.META_STATUS.DATA, constants.WEB_STATUS_CODE.OK, responseObj)
    //     } else {
    //         return responseHelper.successapi(res, res.__("polltakerDetailsEmpty"), constants.META_STATUS.DATA, constants.WEB_STATUS_CODE.OK, polltakerDetails)
    //     }
    // } catch (e) {
    //     logger.logger.error(`Error from catch: ${e}`);
    //     return responseHelper.error(res, res.__('somethingWentWrongPleaseTryAgain'), constants.WEB_STATUS_CODE.SERVER_ERROR, e);
    // }
}

async function getSurveyDetails(polltakerId) {
    let surveyList = await surveyModel.find({ polltaker: { $in: [polltakerId] } });
    return surveyList
}