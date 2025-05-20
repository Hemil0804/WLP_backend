
const Joi = require('joi');
const path = require('path');
const bcrypt = require('bcrypt');
const jwt = require("jsonwebtoken");
Joi.objectId = require('joi-objectid')(Joi);
const { ObjectId } = require('mongoose').Types;
const helper = require('../../../helpers/helper');
const userModel = require('../../../models/user.model');
const constants = require('../../../../config/constants');
const surveyModel = require('../../../models/survey.model');
const responseHelper = require('../../../helpers/responseHelper');
const userValidation = require("../../../validations/user/user.validation");
const userTransformer = require('../../../transformers/user/user.transformer');
const pollTakerValidation = require("../../../validations/user/polltTaker.validation");
const { JWT_AUTH_TOKEN_SECRET, ENVIRONMENT } = require('../../../../config/key');
const { polltakerManagerService } = require('../../../services/user/pollTaker.service');


module.exports = {
    addPollTaker: async (req, res) => {

        try {
            let reqBody = req.body;

            const validationMessage = await pollTakerValidation.addPollTakerValidation(reqBody);
            if (validationMessage) return responseHelper.error(res, res.__(validationMessage), constants.WEB_STATUS_CODE.BAD_REQUEST);

            let pollTakerExists = await userModel.findOne({ email: reqBody.email,/* managerId: req.user._id,*/ status: { $ne: constants.STATUS.DELETED } });
            if (pollTakerExists) return responseHelper.successapi(res, res.__("pollTakerAlreadyExist"), constants.META_STATUS.NO_DATA, constants.WEB_STATUS_CODE.OK);

            if (reqBody.password !== reqBody.confirmPassword) {
                // profileImage && helper.deleteLocalFile('polltaker', profileImage);
                return responseHelper.successapi(res, res.__('passwordAndConfirmPasswordDidNotMatch'), constants.META_STATUS.NO_DATA, constants.WEB_STATUS_CODE.OK);
            }

            // if (!req?.files?.profileImage) {
            //     return responseHelper.successapi(res, res.__('profileImageRequired'), constants.META_STATUS.NO_DATA, constants.WEB_STATUS_CODE.OK);
            // }

            reqBody.profileImage = req?.files?.profileImage ? await helper.getFileName(req?.files?.profileImage[0]) : '';
            reqBody.password = await bcrypt.hash(reqBody.password, 10);
            reqBody.managerId = req.user._id
            reqBody.isVerified = true;
            reqBody.userRole = constants.USER_ROLE.POLL_TAKER
            const pollTakerDetails = new userModel(reqBody);

            await pollTakerDetails.save();
            const addPollTakerTransformer = userTransformer.pollTakerAddViewTransform(pollTakerDetails);

            return responseHelper.successapi(res, res.__('pollTakerAdded'), constants.META_STATUS.DATA, constants.WEB_STATUS_CODE.OK, addPollTakerTransformer);

        } catch (err) {
            console.log('Error(register)', err);

            // profileImage && helper.deleteLocalFile('pollTaker', profileImage);
            return responseHelper.error(res, res.__('somethingWentWrongPleaseTryAgain'), constants.WEB_STATUS_CODE.SERVER_ERROR, err);
        }
    },

    viewPollTaker: async (req, res) => {
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
            const response = userTransformer.pollTakerViewWithSurveyTransform(pollTakerData);
            return responseHelper.successapi(res, res.__('userProfileFoundSuccessFully'), constants.META_STATUS.DATA, constants.WEB_STATUS_CODE.OK, response);

        } catch (err) {
            console.log('Error(viewProfile)', err);
            return responseHelper.error(res, res.__('somethingWentWrongPleaseTryAgain'), constants.WEB_STATUS_CODE.SERVER_ERROR, err);
        }
    },

    deletePollTaker: async (req, res) => {
        try {

            let reqBody = req.body;
            let pollTakerData = []
            let pollTakerRoleString = constants.USER_ROLE.POLL_TAKER.toString();

            if (!reqBody.pollTakerId || reqBody.pollTakerId.trim() === "") return responseHelper.error(res, res.__('PleaseProvidePollTakerId'), constants.WEB_STATUS_CODE.OK);

            let pollTaker = await userModel.findOne({ _id: reqBody.pollTakerId, managerId: req.user._id, userRole: pollTakerRoleString, status: constants.STATUS.ACTIVE }).lean();
            if (!pollTaker) return responseHelper.successapi(res, res.__('pollTakerNotFound'), constants.META_STATUS.NO_DATA, constants.WEB_STATUS_CODE.OK);

            //push PollTaker profile data 

            if (pollTaker) {
                // Proceed with the aggregation pipeline
                const pipeline = [{
                    $match: {
                        managerId: pollTaker.managerId,
                        polltaker: { $in: [pollTaker._id] },
                        surveyStatus: "pending"
                    }
                }];
                // Example using MongoDB native driver
                const survey = await surveyModel.aggregate(pipeline).exec();
                // console.log(survey);
                if (survey.length > 0) return responseHelper.successapi(res, res.__('pollTakeHavePendingSurveyYouCanNotDeletePollTake'), constants.META_STATUS.NO_DATA, constants.WEB_STATUS_CODE.OK);

                await userModel.updateOne(
                    {
                        _id: reqBody.pollTakerId,
                        managerId: req.user._id,
                        userRole: constants.USER_ROLE.POLL_TAKER,
                        status: { $ne: constants.STATUS.DELETED }
                    },
                    {
                        $set: { status: constants.STATUS.DELETED }
                    }
                );
                return responseHelper.successapi(res, res.__('pollTakerDeletedSuccessFully'), constants.META_STATUS.DATA, constants.WEB_STATUS_CODE.OK);
            } else {
                return responseHelper.successapi(res, res.__('pollTakerNotFound'), constants.META_STATUS.NO_DATA, constants.WEB_STATUS_CODE.OK);
            }
        } catch (err) {
            console.log('Error(viewProfile)', err);
            return responseHelper.error(res, res.__('somethingWentWrongPleaseTryAgain'), constants.WEB_STATUS_CODE.SERVER_ERROR, err);
        }
    },

    // listPollTaker: async (req, res) => {
    //     try {
    //         // Get page and limit from query parameters, set defaults if not provided

    //         let reqBody = req.body;

    //         if (req.user.userRole == constants.USER_ROLE.POLL_TAKER) {
    //             return responseHelper.successapi(res, res.__("youHaveNotAccess"), constants.META_STATUS.NO_DATA, constants.WEB_STATUS_CODE.OK,)
    //         }

    //         const page = parseInt(reqBody.page) || 1;
    //         const limit = parseInt(reqBody.limit) || 10;
    //         const skip = (page - 1) * limit;
    //         const searchText = reqBody.searchText || '';

    //         // Build the search query
    //         let searchQuery = { managerId: req.user._id, userRole: constants.USER_ROLE.POLL_TAKER, status: constants.STATUS.ACTIVE };
    //         if (searchText) {
    //             searchQuery.$or = [
    //                 { fullName: { $regex: searchText, $options: 'i' } },
    //                 { email: { $regex: searchText, $options: 'i' } },
    //                 { mobileNumber: { $regex: searchText, $options: 'i' } }
    //             ];
    //         }

    //         // Get the total count of active poll takers
    //         const totalCount = await userModel.countDocuments(searchQuery);

    //         // Fetch the paginated list of active poll takers
    //         const pollTakerList = await userModel.find(searchQuery).skip(skip).limit(limit);

    //         // Transform the list
    //         const response = pollTakerList && pollTakerList.length > 0 ? userTransformer.pollTakerListAddTransform(pollTakerList) : [];

    //         return responseHelper.successapi(res, res.__("pollTakerListed"), constants.META_STATUS.DATA, constants.WEB_STATUS_CODE.OK, response, {
    //             totalCount,
    //             currentPage: page,
    //             totalPages: Math.ceil(totalCount / limit)
    //         });
    //     } catch (e) {
    //         return responseHelper.error(res, res.__('somethingWentWrongPleaseTryAgain'), constants.WEB_STATUS_CODE.SERVER_ERROR, e);
    //     }
    // },
    listPollTaker: async (req, res) => {
        try {
            // Get page and limit from query parameters, set defaults if not provided

            let reqBody = req.body;

            if (req.user.userRole == constants.USER_ROLE.POLL_TAKER) {
                return responseHelper.successapi(res, res.__("youHaveNotAccess"), constants.META_STATUS.NO_DATA, constants.WEB_STATUS_CODE.OK,)
            }

            const { limitCount, skipCount } = helper.getPageAndLimit(reqBody.page, reqBody.limit);

            let findpolltakerList = await polltakerManagerService({
                managerId: req.user._id,
                skip: skipCount,
                limit: limitCount,
                sortBy: reqBody.sortBy,
                sortKey: reqBody.sortKey,
                search: reqBody.searchText
            })

            let response = findpolltakerList && findpolltakerList.length > 0 && findpolltakerList[0]?.data ? findpolltakerList[0].data : [];
            // console.log("reponse", response)

            response = response && response.length > 0 ? userTransformer.pollTakerListAddTransform(response) : [];
            let responseMeta = {
                totalCount: findpolltakerList && findpolltakerList.length > 0 && findpolltakerList[0].totalRecords[0] ? findpolltakerList[0].totalRecords[0].count : 0,
            };
            return responseHelper.successapi(res, res.__("pollTakerListed"), constants.META_STATUS.DATA, constants.WEB_STATUS_CODE.OK, response, responseMeta);
        } catch (e) {
            return responseHelper.error(res, res.__('somethingWentWrongPleaseTryAgain'), constants.WEB_STATUS_CODE.SERVER_ERROR, e);
        }
    },
}