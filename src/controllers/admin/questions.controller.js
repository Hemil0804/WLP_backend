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

            const validationMessage = await questionValidation.addEditQuestionValidation(reqBody);
            if (validationMessage) return responseHelper.error(res, res.__(validationMessage), constants.WEB_STATUS_CODE.OK);

            let questionData;
            reqBody.mcqOptions = reqBody.mcqOptions;
            reqBody.questionType = reqBody.questionType;
            reqBody.addById = req.user._id;
            reqBody.questionBy = req.user.userRole || 0;

            if (reqBody.questionId) {
                questionData = await questionModel.findOne({ _id: reqBody.questionId, status: constants.STATUS.ACTIVE });
                if (!questionData) return responseHelper.successapi(res, res.__("questionNotFound"), constants.META_STATUS.NO_DATA, constants.WEB_STATUS_CODE.OK);

                let questionInUse = await surveyModel.findOne({ questions: { $in: reqBody.questionId }, status: constants.STATUS.ACTIVE });
                // console.log(questionInUse,'questionInUse')
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

            if (!reqBody.questionId && reqBody.questionId === "") return responseHelper.error(res, res.__('PleaseProvideQuestionIdId'), constants.WEB_STATUS_CODE.OK);

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

            if (questionType) {
                searchQuery.questionType = questionType;
            }

            if (searchText) {
                searchQuery.$or = [
                    { questionTitle: { $regex: searchText, $options: 'i' } },
                    { "mcqOptions.description": { $regex: searchText, $options: 'i' } }
                ];
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

    deleteQuestion: async (req, res) => {
        try {
            let reqBody = req.body;

            // Correct the check for questionId
            // if (!reqBody.questionId || reqBody.questionId === "") return responseHelper.error(res, res.__('PleaseProvideQuestionId'), constants.WEB_STATUS_CODE.OK);

            const validationMessage = await questionValidation.viewQuestionValidation(reqBody);
            if (validationMessage) return responseHelper.error(res, res.__(validationMessage), constants.WEB_STATUS_CODE.BAD_REQUEST);

            // Find the question with the provided questionId and status ACTIVE
            const question = await questionModel.findOne({ _id: reqBody.questionId, status: constants.STATUS.ACTIVE }).lean();
            if (!question) return responseHelper.successapi(res, res.__('questionNotFound'), constants.META_STATUS.NO_DATA, constants.WEB_STATUS_CODE.OK);

            let questionInUse = await surveyModel.findOne({ questions: { $in: reqBody.questionId }, status: constants.STATUS.ACTIVE });
            // console.log(questionInUse,'questionInUse')
            if (questionInUse) return responseHelper.successapi(res, res.__("questionIsNowUsedInSurvey"), constants.META_STATUS.NO_DATA, constants.WEB_STATUS_CODE.OK);

            // Update the question status to DELETED
            await questionModel.findOneAndUpdate({ _id: reqBody.questionId }, { $set: { status: constants.STATUS.DELETED } });
            // Respond with success after updating
            return responseHelper.successapi(res, res.__('questionDeletedSuccessfully'), constants.META_STATUS.DATA, constants.WEB_STATUS_CODE.OK);

        } catch (err) {
            console.log('Error(deleteQuestion)', err);
            return responseHelper.error(res, res.__('somethingWentWrongPleaseTryAgain'), constants.WEB_STATUS_CODE.SERVER_ERROR, err);
        }
    },

    // importQuestions: async (req, res) => {
    //     try {
    //         if (!req.files) {
    //             return responseHelper.error(res, 'QuestionImportFileRequired', constants.WEB_STATUS_CODE.BAD_REQUEST);
    //         }
    //         // const letlong = await helper.getLatLong()
    //         console.log("req.file", req.file)

    //         // return false
    //         const filePath = req.files.questionImportFile[0].path;
    //         const contacts = [];
    //         let importId = helper.generateUserUniqId()

    //         fs.createReadStream(filePath).pipe(csv()).on('data', async (row) => {
    //             // const address = `${row.ADDRESS}, ${row.CITY}, ${row.STATE}, ${row.ZIP}`;
    //             // const { latitude, longitude } = await helper.getLatLong(address);
    //             // console.log("latitude   longitude  ", latitude, longitude);
    //             // "questionTitle": "What is the capital of India?",
    //             //     "mcqOptions": [
    //             //         {
    //             //             "name": "Delhi",
    //             //             "description": "Capital city of India"
    //             //         },
    //             //         {
    //             //             "name": "London",
    //             //             "description": "Capital city of the United Kingdom"
    //             //         },
    //             //         {
    //             //             "name": "Berlin",
    //             //             "description": "Capital city of Germany"
    //             //         },
    //             //         {
    //             //             "name": "Madrid",
    //             //             "description": "Capital city of Spain"
    //             //         }
    //             //     ],
    //             //     "questionType": 1

    //             const questionData = {
    //                 questionTitle: row.question,
    //                 questionType: row.questionType,
    //                 voterNum: row.VOTER_NBR,
    //                 firstName: row.FNAME,
    //                 lastName: row.LNAME,
    //                 title: row.TITLE,
    //                 email: row.EMAIL || null, // Adjust as needed
    //                 phone: row.PHONE,
    //                 address: {
    //                     streetAddress: row.ADDRESS + row.ADDRESS2,
    //                     city: row.CITY,
    //                     state: row.STATE,
    //                     zip: row.ZIP,
    //                     latitude: latitude, // Adjust as needed
    //                     longitude: longitude, // Adjust as needed
    //                     country: null, // Adjust as needed
    //                 },
    //                 dob: getTimestamp(row.DOB, 'MM/DD/YYYY'),
    //                 regDate: getTimestamp(row.REG_DATE, 'MM/DD/YYYY'),
    //                 district: row.DISTRICT,
    //                 gender: row.SEX,
    //                 status: constants.STATUS.ACTIVE,
    //                 createdAt: setCurrentTimestamp(),
    //                 updatedAt: setCurrentTimestamp(),
    //             };
    //             contacts.push(contactData);
    //             console.log(contactData);
    //         })
    //         return responseHelper.successapi(res, res.__("contactImportSuccessFully"), constants.META_STATUS.DATA, constants.WEB_STATUS_CODE.OK)
    //     } catch (error) {
    //         console.error('Error processing importContacts request', error);
    //         return responseHelper.error(res, res.__("SomethingWentWrongPleaseTryAgain"), constants.WEB_STATUS_CODE.SERVER_ERROR);
    //     }
    // }
}