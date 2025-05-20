const path = require('path');
const moment = require('moment');
const Joi = require('joi');
Joi.objectId = require('joi-objectid')(Joi);
const { ObjectId } = require('mongoose').Types;
const { BASE_URL, JWT_AUTH_TOKEN_SECRET, ENVIRONMENT } = require('../../../config/key');
const responseHelper = require('../../helpers/responseHelper');
const constants = require('../../../config/constants');
const helper = require('../../helpers/helper');
const userTransformer = require('../../transformers/user/user.transformer');
const dateFormat = require('../../helpers/dateFormat.helper');
const questionModel = require('../../models/question.model');
const surveyModel = require('../../models/survey.model');
const pollTakerValidation = require("../../validations/user/polltTaker.validation");
const questionValidation = require("../../validations/admin/question.validation");
const questionTransformer = require('../../transformers/user/question.transformer');
const jwt = require("jsonwebtoken");
const { masterService, contactStatisticsService, surveyStatisticsService } = require('../../services/master.service');


module.exports = {
    addEditQuestions: async (req, res) => {
        try {
            const reqBody = req.body;
            let message = 'questionUpdated';

            // const validationMessage = await questionValidation.addEditQuestionValidation(reqBody);
            // if (validationMessage) return responseHelper.error(res, res.__(validationMessage), constants.WEB_STATUS_CODE.OK);

            let questionData;
            reqBody.mcqOptions = reqBody.mcqOptions;
            reqBody.questionType = reqBody.questionType;
            reqBody.addById = req.user._id;
            reqBody.questionBy = req.user.userRole || 0;

            if (reqBody.questionId) {
                questionData = await questionModel.findOne({ _id: reqBody.questionId, status: constants.STATUS.ACTIVE });
                if (!questionData) return responseHelper.successapi(res, res.__("questionNotFound"), constants.META_STATUS.NO_DATA, constants.WEB_STATUS_CODE.OK);

                let questionInUse = await surveyModel.findOne({ questions: { $in: reqBody.questionId }, status: constants.STATUS.ACTIVE });
                if (questionInUse) return responseHelper.successapi(res, res.__("questionIsNowUsedInSurvey"), constants.META_STATUS.NO_DATA, constants.WEB_STATUS_CODE.OK);

            } else {
                questionData = new questionModel(reqBody);
                message = 'questionAdded';
            }

            questionData.questionTitle = reqBody?.questionTitle ? reqBody.questionTitle : questionData.questionTitle
            questionData.mcqOptions = reqBody?.mcqOptions ? reqBody.mcqOptions : questionData.mcqOptions
            questionData.questionType = reqBody?.questionType ? reqBody.questionType : questionData.questionType
            questionData.questionBy = reqBody?.questionBy ? reqBody.questionBy : questionData.questionBy

            questionData = await questionData.save();

            const response = questionTransformer.questionViewTransform(questionData);

            return responseHelper.successapi(res, res.__(message), constants.META_STATUS.DATA, constants.WEB_STATUS_CODE.OK, response);

        } catch (err) {
            console.log('Error(addEditQuestions)', err);
            return responseHelper.error(res, res.__('somethingWentWrongPleaseTryAgain'), constants.WEB_STATUS_CODE.SERVER_ERROR, err);
        }
    },

    viewQuestion: async (req, res) => {
        try {
            let reqBody = req.body;


            if (!reqBody.questionId || reqBody.questionId.trim() === "") return responseHelper.error(res, res.__('PleaseProvideQuestionIdId'), constants.WEB_STATUS_CODE.BAD_REQUEST);

            const question = await questionModel.findOne({ _id: reqBody.questionId, status: constants.STATUS.ACTIVE }).lean();
            if (!question) return responseHelper.successapi(res, res.__('questionIdNotFound'), constants.META_STATUS.NO_DATA, constants.WEB_STATUS_CODE.OK);

            const response = questionTransformer.questionViewTransform(question);
            return responseHelper.successapi(res, res.__('userProfileFoundSuccessFully'), constants.META_STATUS.DATA, constants.WEB_STATUS_CODE.OK, response);

        } catch (err) {
            console.log('Error(viewProfile)', err);
            return responseHelper.error(res, res.__('somethingWentWrongPleaseTryAgain'), constants.WEB_STATUS_CODE.SERVER_ERROR, err);
        }
    },

    listQuestion: async (req, res) => {
        try {
            let reqBody = req.body;

            const page = parseInt(reqBody.page) || 1;
            const limit = parseInt(reqBody.limit) || 10;
            const skip = (page - 1) * limit;
            const searchText = reqBody.searchText || '';
            const questionType = reqBody.questionType || null; // Get questionType from request body if provided

            // Build the search query
            let searchQuery = { questionBy: constants.QUESTION_BY.ADMIN, status: constants.STATUS.ACTIVE };
            if (searchText) {
                searchQuery.$or = [
                    { questionTitle: { $regex: searchText, $options: 'i' } },
                    { "mcqOptions.description": { $regex: searchText, $options: 'i' } }
                ];
            }

            if (questionType) {
                searchQuery.questionType = questionType;
            }
            // Get the total count of active questions
            const totalCount = await questionModel.countDocuments(searchQuery);

            // Fetch the paginated list of active questions
            const questionList = await questionModel.find(searchQuery)
                .skip(skip)
                .limit(limit);

            // Transform the list
            const response = questionList && questionList.length > 0 ? questionTransformer.questionListTransform(questionList) : [];

            return responseHelper.successapi(res, res.__("questionListed"), constants.META_STATUS.DATA, constants.WEB_STATUS_CODE.OK, response, {
                totalCount,
                currentPage: page,
                totalPages: Math.ceil(totalCount / limit)
            });
        } catch (e) {
            return responseHelper.error(res, res.__('somethingWentWrongPleaseTryAgain'), constants.WEB_STATUS_CODE.SERVER_ERROR, e);
        }
    },
}