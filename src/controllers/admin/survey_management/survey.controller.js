const surveyModel = require('../../../models/survey.model');
const questionModel = require('../../../models/question.model');
const userModel = require('../../../models/user.model');
const responseHelper = require('../../../helpers/responseHelper')
const constants = require('../../../../config/constants')
const logger = require('../../../helpers/loggerService')
const moment = require('moment')
const Helper = require("../../../helpers/helper")
// const surveyTransformer = require('../../../transformers/admin/survey.transformer');
const surveyTransformer = require("../../../transformers/user/survey.transformer")
const { surveyService, surveyViewService } = require("../../../services/admin/survey.service")
const surveyValidation = require("../../../validations/user/survey.validation")
const {viewCompletedSurveyContactService} = require("../../../services/user/survey.service")

//Survey OR Team Owner List
exports.list = async (req, res) => {
    try {
        let reqBody = req.body
        const { limitCount, skipCount } = Helper.getPageAndLimit(reqBody.page, reqBody.limit);

        let findSurveyList = await surveyService({
            skip: skipCount,
            limit: limitCount,
            sortBy: reqBody.sortBy,
            sortKey: reqBody.sortKey,
            search: reqBody.search,
            surveyStatus: reqBody.surveyStatus,
            manager: reqBody.managerId
        })

        // Survey Transform the list
        let response = findSurveyList && findSurveyList.length > 0 && findSurveyList[0]?.data ? findSurveyList[0].data : [];
        const surveyListData = await surveyTransformer.surveyListTransformer(response);
        // responseData = await surveyTransformer.surveyListTransformer(response);

        let responseMeta = {
            totalCount: findSurveyList && findSurveyList.length > 0 && findSurveyList[0].totalRecords[0] ? findSurveyList[0].totalRecords[0].count : 0,
        };

        return responseHelper.successapi(res, res.__("SurveyListFound"), constants.META_STATUS.DATA, constants.WEB_STATUS_CODE.OK, surveyListData, responseMeta)
    } catch (e) {
        logger.logger.error(`Error from catch: ${e}`);
        return responseHelper.error(res, res.__('somethingWentWrongPleaseTryAgain'), constants.WEB_STATUS_CODE.SERVER_ERROR, e);
    }

}

//Status Update of the Survey
exports.updateStatus = async (req, res) => {
    try {
        let reqBody = req.body
        let userDetails = await surveyModel.findOneAndUpdate({
            _id: reqBody.surveyId,
        }, { $set: { status: reqBody.status } });

        let checkManagerSurveyStatus=await surveyModel.findOne({_id:reqBody.surveyId,surveyStatus:{$ne:"pending"}})
        if(checkManagerSurveyStatus) return responseHelper.successapi(res, res.__('surveyNotAuthorisedStatus'), constants.META_STATUS.DATA, constants.WEB_STATUS_CODE.OK);
        
        return responseHelper.successapi(res, res.__('SurveyStatusUpdated'), constants.META_STATUS.DATA, constants.WEB_STATUS_CODE.OK);
    } catch (e) {
        logger.logger.error(`Error from catch: ${e}`);
        return responseHelper.error(res, res.__('somethingWentWrongPleaseTryAgain'), constants.WEB_STATUS_CODE.SERVER_ERROR, e);
    }
}


//Delete Survey
exports.delete = async (req, res) => {
    try {
        let reqBody = req.body
        let userDetails = await surveyModel.findOneAndUpdate({
            _id: reqBody.surveyId,
        }, { $set: { status: constants.STATUS.DELETED } });

        let checkManagerSurveyStatus=await surveyModel.findOne({_id:reqBody.surveyId,surveyStatus:{$ne:"pending"}})
        if(checkManagerSurveyStatus) return responseHelper.successapi(res, res.__('surveyNotAuthorisedDelete'), constants.META_STATUS.DATA, constants.WEB_STATUS_CODE.OK);
        

        return responseHelper.successapi(res, res.__('SurveydeletedSuccess'), constants.META_STATUS.DATA, constants.WEB_STATUS_CODE.OK);
    } catch (e) {
        logger.logger.error(`Error from catch: ${e}`);
        return responseHelper.error(res, res.__('somethingWentWrongPleaseTryAgain'), constants.WEB_STATUS_CODE.SERVER_ERROR, e);
    }
}


//view Survey
exports.view = async (req, res) => {
    try {
        let reqBody = req.body;

        const validationMessage = await surveyValidation.deleteSurveyValidation(reqBody);
        if (validationMessage) return responseHelper.error(res, res.__(validationMessage), constants.WEB_STATUS_CODE.BAD_REQUEST);

        let surveyFound = await surveyModel.findOne({ _id: reqBody.surveyId, status: { $ne: constants.STATUS.DELETED } });
        if (!surveyFound) return responseHelper.successapi(res, res.__("surveyNotFound"), constants.META_STATUS.NO_DATA, constants.WEB_STATUS_CODE.OK);

        let response = await surveyViewService({ surveyId: reqBody.surveyId });

        for (let obj of response) {
            if (obj.contactData && obj.contact) {
                obj.contactData = obj.contactData.map(contact => {
                    const matchedContact = obj.contact.find(c => c.contactId.toString() === contact._id.toString());
                    return {
                        ...contact,
                        completeStatus: matchedContact ? matchedContact.status : ''
                    };
                });
            }
        }

        response = response?.length > 0 ? response[0] : null
        // console.log("resopnse respones   ", response);
        let responseData = await surveyTransformer.surveyDataViewTransformer(response)
        return responseHelper.successapi(res, res.__("SurveyDetailsSuccess"), constants.META_STATUS.DATA, constants.WEB_STATUS_CODE.OK, responseData)

    } catch (e) {
        logger.logger.error(`Error from catch: ${e}`);
        return responseHelper.error(res, res.__('somethingWentWrongPleaseTryAgain'), constants.WEB_STATUS_CODE.SERVER_ERROR, e);
    }
}
exports.viewSubmitSurveyContact = async (req, res) => {
    try {
        let reqBody = req.body;

        const validationMessage = await surveyValidation.viewSurveyContact(reqBody)
        if (validationMessage) return responseHelper.error(res, res.__(validationMessage), constants.WEB_STATUS_CODE.BAD_REQUEST);

        if (req.user.userRole != "1") {
            return responseHelper.successapi(res, res.__("youCanNotAllowToSeeSubmittedContact"), constants.META_STATUS.NO_DATA, constants.WEB_STATUS_CODE.OK);
        }

        let surveyFound = await surveyModel.findOne({ _id: reqBody.surveyId, status: { $ne: constants.STATUS.DELETED } });
        if (!surveyFound) return responseHelper.successapi(res, res.__("surveyNotFound"), constants.META_STATUS.NO_DATA, constants.WEB_STATUS_CODE.OK);

        let response = await viewCompletedSurveyContactService({ surveyId: reqBody.surveyId, contactId: reqBody.contactId });
        response = response.length > 0 ? response[0] : [];

        let questionsData = response?.questionsData.length > 0 ? response.questionsData : []
        let contactQuestionAnswer = response.contact.questionAnswers
        // console.log("Match contactQuestionAnswer in ===================", contactQuestionAnswer);
        // console.log("Match questionsData in ===================", questionsData);

        // method ---- 1 for update question mcqOption as true;
        if (contactQuestionAnswer.length > 0 && questionsData.length > 0) {
            contactQuestionAnswer.forEach(submittedQ => {
                // console.log(submittedQ,'submittedQ')
                // Find the question where the questionId matches
                const question = questionsData.find(q => q._id.equals(submittedQ.questionId));
                // console.log("Match Questions in ===================", question);
                // console.log("submittedQ in......................", submittedQ);
                if (question) {
                    if (question.questionType == 3) {
                        question.answer = submittedQ.answer
                    }
                    const option = question.mcqOptions.find(opt => opt._id.equals(submittedQ.ansId)); // Find the answer option where ansId matches
                    if (option) { option.isCorrect = true; } // Set isCorrect to true for the matching option     
                }
            });
        }

        // viewContact = response.contactData.filter(a => a._id.equals(viewContact[0].contactId));
        // responseData.contact = viewContact
        let submittedByPollTaker = response.polltakerData.filter(a => a._id.equals(response.contact.submitById));

        let responseData = {};
        responseData.managerName = response.managerData.fullName
        responseData.pollTakerName = submittedByPollTaker[0].fullName
        responseData.questionsData = questionsData
        responseData.note = response?.contact?.note && response.contact.status == 'other' ? response.contact.note : ''

        // responseData.questionsData = response.questionsData
        // const response = contactViewTransform(response);
        return responseHelper.successapi(res, res.__('contactFoundSuccessFully'), constants.META_STATUS.DATA, constants.WEB_STATUS_CODE.OK, responseData);

    } catch (err) {
        console.log('Error(contactView)', err);
        return responseHelper.error(res, res.__('somethingWentWrongPleaseTryAgain'), constants.WEB_STATUS_CODE.SERVER_ERROR, err);
    }
}
