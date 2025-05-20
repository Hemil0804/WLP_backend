const surveyModel = require("../../models/survey.model");
const contactModel = require("../../models/contact.model");
const questionModel = require("../../models/question.model");
const userModel = require("../../models/user.model");
const responseHelper = require('../../helpers/responseHelper');
const constants = require('../../../config/constants');
const surveyValidation = require("../../validations/user/survey.validation")
const { surveyService, getTotalCounts, surveyViewService, viewCompletedSurveyContactService } = require("../../services/user/survey.service")
const Helper = require("../../helpers/helper")
const surveyTransformer = require("../../transformers/user/survey.transformer")
const moment = require("moment")
let ObjectId = require('mongodb').ObjectId

exports.addEdit = async (req, res) => {
    try {
        let reqBody = req.body;
        let surveyExists;

        // let limitQue = 100
        // let limitCon = 100

        // let count = await getTotalCounts({ managerId: req.manager._id })

        if (reqBody.surveyId) {
            const validationMessage = await surveyValidation.editSurveyValidation(reqBody);
            if (validationMessage) return responseHelper.error(res, res.__(validationMessage), constants.WEB_STATUS_CODE.BAD_REQUEST);

            surveyExists = await surveyModel.findOne({ _id: reqBody.surveyId, status: { $ne: constants.STATUS.DELETED } });
            if (!surveyExists) return responseHelper.successapi(res, res.__("surveyNotFound"), constants.META_STATUS.NO_DATA, constants.WEB_STATUS_CODE.OK);

            let surveyNameExists = await surveyModel.findOne({ managerId: req.manager._id, _id: { $ne: reqBody.surveyId }, surveyName: reqBody.surveyName, status: { $ne: constants.STATUS.DELETED } });
            if (surveyNameExists) return responseHelper.successapi(res, res.__("surveyNameAlreadyExists"), constants.META_STATUS.NO_DATA, constants.WEB_STATUS_CODE.OK);
        } else {
            const validationMessage = await surveyValidation.addSurveyValidation(reqBody);
            if (validationMessage) return responseHelper.error(res, res.__(validationMessage), constants.WEB_STATUS_CODE.BAD_REQUEST);

            let surveyNameExists = await surveyModel.findOne({ managerId: req.user._id, surveyName: reqBody.surveyName, status: { $ne: constants.STATUS.DELETED } });
            if (surveyNameExists) return responseHelper.successapi(res, res.__("surveyNameAlreadyExists"), constants.META_STATUS.NO_DATA, constants.WEB_STATUS_CODE.OK);

            surveyExists = new surveyModel();

            reqBody.surveyStatus = "pending"
        }

        // let availableContact = limitCon - count.totalContacts
        // let availableQuestion = limitQue - count.totalQuestions
        if (reqBody?.contact?.length === 0) return responseHelper.successapi(res, res.__("pleaseSelectAtLeastOneContact"), constants.META_STATUS.NO_DATA, constants.WEB_STATUS_CODE.OK)
        // if (reqBody?.contact?.length > availableContact) return responseHelper.successapi(res, res.__("contactsLimitReached"), constants.META_STATUS.NO_DATA, constants.WEB_STATUS_CODE.OK)

        if (reqBody?.questions?.length === 0) return responseHelper.successapi(res, res.__("pleaseSelectAtLeastOneQuestion"), constants.META_STATUS.NO_DATA, constants.WEB_STATUS_CODE.OK)
        // if (reqBody?.questions?.length > availableQuestion) return responseHelper.successapi(res, res.__("questionsLimitReached"), constants.META_STATUS.NO_DATA, constants.WEB_STATUS_CODE.OK)

        if (reqBody?.polltaker?.length === 0) return responseHelper.successapi(res, res.__("pleaseSelectAtLeastOnePollTaker"), constants.META_STATUS.NO_DATA, constants.WEB_STATUS_CODE.OK)

        // if (reqBody?.contact?.length > 0) {
        //     let contactExists = await contactModel.find({ _id: { $in: reqBody.contact }, status: { $ne: constants.STATUS.DELETED } });
        //     if (contactExists?.length !== reqBody.contact.length) return responseHelper.successapi(res, res.__("contactNotFound"), constants.META_STATUS.NO_DATA, constants.WEB_STATUS_CODE.OK);
        // }

        if (reqBody?.questions?.length > 0) {
            let questionsExists = await questionModel.find({ _id: { $in: reqBody.questions }, status: { $ne: constants.STATUS.DELETED } });
            if (questionsExists?.length !== reqBody.questions.length) return responseHelper.successapi(res, res.__("questionsNotFound"), constants.META_STATUS.NO_DATA, constants.WEB_STATUS_CODE.OK);
        }

        if (reqBody?.polltaker?.length > 0) {
            let polltakerExists = await userModel.find({ _id: { $in: reqBody.polltaker }, status: { $ne: constants.STATUS.DELETED } });
            if (polltakerExists?.length !== reqBody.polltaker.length) return responseHelper.successapi(res, res.__("pollTakerNotFound"), constants.META_STATUS.NO_DATA, constants.WEB_STATUS_CODE.OK);
        }

        // contact = reqBody.contact.map(a => {a.status = "pending"})
        // reqBody.contact = contact
        // return console.log("reqBody.contact ------- : ", reqBody.contact)

        surveyExists.surveyName = reqBody?.surveyName ? reqBody.surveyName : surveyExists.surveyName
        surveyExists.surveyDate = reqBody?.surveyDate ? reqBody.surveyDate : surveyExists.surveyDate
        surveyExists.polltaker = reqBody?.polltaker ? reqBody.polltaker : surveyExists.polltaker
        surveyExists.managerId = req?.user?._id ? req.user._id : surveyExists.managerId
        surveyExists.description = reqBody?.description ? reqBody.description : surveyExists.description
        surveyExists.contact = reqBody?.contact ? reqBody.contact : surveyExists.contact
        surveyExists.questions = reqBody?.questions ? reqBody.questions : surveyExists.questions

        let response = await surveyExists.save()

        response = await surveyViewService({ surveyId: response._id });

        response = response?.length > 0 ? response[0] : null

        let responseData = await surveyTransformer.surveyDataViewTransformer(response)

        if (reqBody.surveyId) return responseHelper.successapi(res, res.__("surveyUpdatedSuccessfully"), constants.META_STATUS.DATA, constants.WEB_STATUS_CODE.OK, responseData)

        return responseHelper.successapi(res, res.__("surveyCreatedSuccessfully"), constants.META_STATUS.DATA, constants.WEB_STATUS_CODE.OK, responseData)
    } catch (e) {
        console.log('Error(survey-addEdit)', e);
        return responseHelper.error(res, res.__('somethingWentWrongPleaseTryAgain'), constants.WEB_STATUS_CODE.SERVER_ERROR, e);
    }
}

exports.list = async (req, res) => {
    try {
        let reqBody = req.body;

        const { limitCount, skipCount } = Helper.getPageAndLimit(reqBody.page, reqBody.limit);
        let surveyList

        // if (parseInt(req.user.userRole) === constants.USER_ROLE.MANAGER || constants.USER_ROLE.TEAM_MANAGER) {
        //     surveyList = await surveyModel.find({ managerId: userId, status: { $ne: constants.STATUS.DELETED } });

        // } else {
        //     surveyList = await surveyModel.find({
        //         polltaker: { $in: [userId] },
        //         status: { $ne: constants.STATUS.DELETED },
        //         surveyStatus: { $ne: "completed" }
        //     });
        // }

        if (parseInt(req.user.userRole) === constants.USER_ROLE.MANAGER) {
            console.log("manager survey", req.user.userRole)

            surveyList = await surveyService(
                {
                    managerId: req.user._id,
                    skip: skipCount,
                    limit: limitCount,
                    sortBy: reqBody.sortBy,
                    sortKey: reqBody.sortKey,
                    search: reqBody.search,
                    polltaker: reqBody.polltaker,
                    surveyStatus: reqBody.surveyStatus
                }
            )
        } else if (parseInt(req.user.userRole) === constants.USER_ROLE.TEAM_OWNER) {

            const managers = await userModel.find({ userRole: "2", teamOwnerId: req.user._id }, '_id');
            const managerIds = managers.map(manager => manager._id);

            surveyList = await surveyService(
                {
                    skip: skipCount,
                    limit: limitCount,
                    sortBy: reqBody.sortBy,
                    sortKey: reqBody.sortKey,
                    search: reqBody.search,
                    teamOwnerId: req.user._id,
                    managerId: reqBody.managerId,
                    managerIds: managerIds,
                    filterBy: reqBody.type,
                    surveyStatus: reqBody.surveyStatus
                }
            )
        } else {
            surveyList = await surveyService(
                {
                    polltaker: req.user._id,
                    skip: skipCount,
                    limit: limitCount,
                    sortBy: reqBody.sortBy,
                    sortKey: reqBody.sortKey,
                    search: reqBody.search,
                }
            )
        }


        let response = surveyList && surveyList.length > 0 && surveyList[0]?.data ? surveyList[0].data : [];

        // const polltakerFullNames = response.polltakerData.map(a => a.fullName);

        // If you want to keep the original polltakerData and just add the full names to a new property
        // response.polltakerFullNames = polltakerFullNames;

        // console.log("response List Survey", req.user._id, response);
        // const responseData = await surveyTransformer.onlySurveyListTransformer(response);
        let responseData;
        if (parseInt(req.user.userRole) === constants.USER_ROLE.TEAM_OWNER) {
            responseData = await surveyTransformer.teamOwnerSurveyListTransform(response);
        } else {
            responseData = await surveyTransformer.surveyListTransformer(response);
        }

        let responseMeta = {
            totalCount: surveyList && surveyList.length > 0 && surveyList[0].totalRecords[0] ? surveyList[0].totalRecords[0].count : 0,
        };

        return responseHelper.successapi(res, res.__("surveyListFoundSuccessfully"), constants.META_STATUS.DATA, constants.WEB_STATUS_CODE.OK, responseData, responseMeta)
    } catch (e) {
        console.log('Error(survey-list)', e);
        return responseHelper.error(res, res.__('somethingWentWrongPleaseTryAgain'), constants.WEB_STATUS_CODE.SERVER_ERROR, e);
    }
}

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

        return responseHelper.successapi(res, res.__("surveyDetailsFoundSuccessfully"), constants.META_STATUS.DATA, constants.WEB_STATUS_CODE.OK, responseData)
    } catch (e) {
        console.log('Error(survey-view)', e);
        return responseHelper.error(res, res.__('somethingWentWrongPleaseTryAgain'), constants.WEB_STATUS_CODE.SERVER_ERROR, e);
    }
}

// exports.checkAndUpdateSurveyStatus = async (surveyId) => {
//     try {
//         const survey = await surveyModel.aggregate([
//             { $match: { _id: new ObjectId(surveyId) } },
//             { $unwind: "$contact" },
//             {
//                 $group: {
//                     _id: "$_id",
//                     allCompleted: { $min: { $cond: [{ $eq: ["$contact.status", "completed"] }, 1, 0] } },
//                     totalContacts: { $sum: 1 }
//                 }
//             },
//             {
//                 $project: {
//                     _id: 0,
//                     allCompleted: { $eq: ["$allCompleted", "$totalContacts"] }
//                 }
//             }
//         ]);

//         if (survey.length > 0 && survey[0].allCompleted) {
//             // Update survey status to completed
//             await surveyModel.updateOne(
//                 { _id:  new ObjectId(surveyId) },
//                 { $set: { surveyStatus: "completed" } }
//             );
//         }
//     } catch (error) {
//         console.error('Error updating survey status:', error);
//         throw error;
//     }
// }
exports.submitIncompleteSurveyContact = async (req, res) => {
    try {

        let reqBody = req.body;
        let updateSurveyStatus
        let updateContactStatus;
        let note = null;
        const pollTakerId = req.user._id;

        const validationMessage = await surveyValidation.incompleteSurveyContactValidation(reqBody);
        if (validationMessage) return responseHelper.error(res, res.__(validationMessage), constants.WEB_STATUS_CODE.BAD_REQUEST);

        let pollTakerExists = await userModel.findOne({ _id: pollTakerId, status: { $ne: constants.STATUS.DELETED } });
        if (!pollTakerExists) return responseHelper.successapi(res, res.__("pollTakerNotExists"), constants.META_STATUS.NO_DATA, constants.WEB_STATUS_CODE.OK);

        let surveyNameExists = await surveyModel.findOne({ _id: reqBody.surveyId, polltaker: { $in: [pollTakerId] }, status: { $ne: constants.STATUS.DELETED } });
        if (!surveyNameExists) return responseHelper.successapi(res, res.__("surveyNotExists"), constants.META_STATUS.NO_DATA, constants.WEB_STATUS_CODE.OK);

        // Check if contact exists and its current status
        let contact = await surveyModel.findOne({ _id: reqBody.surveyId, "contact.contactId": reqBody.contactId },
            { "contact.$": 1 } // Projection to get only the matched contact
        );

        if (!contact || contact.contact.length === 0) return responseHelper.successapi(res, res.__('contactNotFound'), constants.META_STATUS.NO_DATA, constants.WEB_STATUS_CODE.OK);

        let contactStatus = contact.contact[0].status;
        if (contactStatus !== "pending")
            return responseHelper.successapi(res, res.__("contactAlreadyCompleted"), constants.META_STATUS.NO_DATA, constants.WEB_STATUS_CODE.OK);

        // let surveyQuestions = surveyNameExists.questions.map(q => q.toString());
        // let submittedQuestionIds = reqBody.questionAnswers.map(qa => qa.questionId);

        // let allQuestionsAnswered = surveyQuestions.every(qId => submittedQuestionIds.includes(qId));

        // if (!allQuestionsAnswered) {
        //     return responseHelper.successapi(res, res.__("allQuestionsMustBeAnswered"), constants.META_STATUS.NO_DATA, constants.WEB_STATUS_CODE.OK);
        // }

        //         if (reqBody?.reasone?.length === 0) return responseHelper.successapi(res, res.__("pleaseFillQuestion"), constants.META_STATUS.NO_DATA, constants.WEB_STATUS_CODE.OK)

        if (reqBody.status == 1) {
            updateContactStatus = "refuse";
        } else if (reqBody.status == 2) {
            updateContactStatus = "noanswer";
        } else if (reqBody.status == 3) {
            updateContactStatus = "other";
            note = reqBody.note || null;
        }

        let updateContact = await surveyModel.updateOne({ _id: reqBody.surveyId, "contact.contactId": reqBody.contactId },
            {
                $set: {
                    "contact.$.status": updateContactStatus,
                    "contact.$.note": note,
                    "contact.$.submitById": pollTakerId
                }
            })

        if (!updateContact) return responseHelper.successapi(res, res.__('contactNotFound'), constants.META_STATUS.NO_DATA, constants.WEB_STATUS_CODE.OK);

        // await this.checkAndUpdateSurveyStatus(reqBody.surveyId);
        const updatedSurvey = await surveyModel.findById(reqBody.surveyId);
        // console.log("updateContact", updatedSurvey);

        const anyContactsCompleted = updatedSurvey.contact.some(contact => contact.status === 'completed' || contact.status === 'completed' || contact.status === 'refuse' || contact.status === 'noanswer' || contact.status === 'other');
        const allContactsCompleted = updatedSurvey.contact.every(contact => contact.status === 'completed' || contact.status === 'refuse' || contact.status === 'noanswer' || contact.status === 'other');

        if (allContactsCompleted) {
            updateSurveyStatus = 'completed';
        } else if (anyContactsCompleted) {
            updateSurveyStatus = 'inProcess';
        }

        if (updateSurveyStatus) {
            await surveyModel.updateOne(
                { _id: reqBody.surveyId },
                { $set: { surveyStatus: updateSurveyStatus } }
            );
        }

        if (updateContact) return responseHelper.successapi(res, res.__("contactSubmittedSuccessfully"), constants.META_STATUS.DATA, constants.WEB_STATUS_CODE.OK)

    } catch (e) {
        console.log('Error(survey-addEdit)', e);
        return responseHelper.error(res, res.__('somethingWentWrongPleaseTryAgain'), constants.WEB_STATUS_CODE.SERVER_ERROR, e);
    }
}

exports.submitSurveyContact = async (req, res) => {
    try {

        let reqBody = req.body;
        let updateSurveyStatus
        let updateContactStatus = 'completed';
        const pollTakerId = req.user._id;

        const validationMessage = await surveyValidation.submitSurveyContactValidation(reqBody);
        if (validationMessage) return responseHelper.error(res, res.__(validationMessage), constants.WEB_STATUS_CODE.BAD_REQUEST);

        let pollTakerExists = await userModel.findOne({ _id: pollTakerId, status: { $ne: constants.STATUS.DELETED } });
        if (!pollTakerExists) return responseHelper.successapi(res, res.__("pollTakerNotExists"), constants.META_STATUS.NO_DATA, constants.WEB_STATUS_CODE.OK);

        let surveyNameExists = await surveyModel.findOne({ _id: reqBody.surveyId, polltaker: { $in: [pollTakerId] }, status: { $ne: constants.STATUS.DELETED } });
        if (!surveyNameExists) return responseHelper.successapi(res, res.__("surveyNotExists"), constants.META_STATUS.NO_DATA, constants.WEB_STATUS_CODE.OK);

        // Check if contact exists and its current status
        let contact = await surveyModel.findOne({ _id: reqBody.surveyId, "contact.contactId": reqBody.contactId },
            { "contact.$": 1 } // Projection to get only the matched contact
        );

        if (!contact || contact.contact.length === 0) return responseHelper.successapi(res, res.__('contactNotFound'), constants.META_STATUS.NO_DATA, constants.WEB_STATUS_CODE.OK);

        let contactStatus = contact.contact[0].status;
        if (contactStatus !== "pending") return responseHelper.successapi(res, res.__("contactAlreadyCompleted"), constants.META_STATUS.NO_DATA, constants.WEB_STATUS_CODE.OK);

        // let surveyQuestions = surveyNameExists.questions.map(q => q.toString());
        // let submittedQuestionIds = reqBody.questionAnswers.map(qa => qa.questionId);

        // let allQuestionsAnswered = surveyQuestions.every(qId => submittedQuestionIds.includes(qId));

        // if (!allQuestionsAnswered) {
        //     return responseHelper.successapi(res, res.__("allQuestionsMustBeAnswered"), constants.META_STATUS.NO_DATA, constants.WEB_STATUS_CODE.OK);
        // }

        if (reqBody?.questionAnswers?.length === 0) return responseHelper.successapi(res, res.__("pleaseFillQuestion"), constants.META_STATUS.NO_DATA, constants.WEB_STATUS_CODE.OK)

        let updateContact = await surveyModel.updateOne({ _id: reqBody.surveyId, "contact.contactId": reqBody.contactId },
            {
                $set: {
                    "contact.$.status": updateContactStatus,
                    "contact.$.questionAnswers": reqBody.questionAnswers,
                    "contact.$.submitById": pollTakerId
                }
            })

        if (!updateContact) return responseHelper.successapi(res, res.__('contactNotFound'), constants.META_STATUS.NO_DATA, constants.WEB_STATUS_CODE.OK);

        // await this.checkAndUpdateSurveyStatus(reqBody.surveyId);
        const updatedSurvey = await surveyModel.findById(reqBody.surveyId);
        // console.log("updateContact", updatedSurvey);

        const anyContactsCompleted = updatedSurvey.contact.some(contact => contact.status === 'completed' || contact.status === 'completed' || contact.status === 'refuse' || contact.status === 'noanswer' || contact.status === 'other');
        const allContactsCompleted = updatedSurvey.contact.every(contact => contact.status === 'completed' || contact.status === 'refuse' || contact.status === 'noanswer' || contact.status === 'other');

        if (allContactsCompleted) {
            updateSurveyStatus = 'completed';
        } else if (anyContactsCompleted) {
            updateSurveyStatus = 'inProcess';
        }

        if (updateSurveyStatus) {
            await surveyModel.updateOne(
                { _id: reqBody.surveyId },
                { $set: { surveyStatus: updateSurveyStatus } }
            );
        }

        if (updateContact) return responseHelper.successapi(res, res.__("contactSubmittedSuccessfully"), constants.META_STATUS.DATA, constants.WEB_STATUS_CODE.OK)

    } catch (e) {
        console.log('Error(survey-addEdit)', e);
        return responseHelper.error(res, res.__('somethingWentWrongPleaseTryAgain'), constants.WEB_STATUS_CODE.SERVER_ERROR, e);
    }
}

exports.viewSubmitSurveyContact = async (req, res) => {
    try {
        let reqBody = req.body;

        const validationMessage = await surveyValidation.viewSurveyContact(reqBody)
        if (validationMessage) return responseHelper.error(res, res.__(validationMessage), constants.WEB_STATUS_CODE.BAD_REQUEST);

        if (req.user.userRole != "2") {
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
                        question.answer=submittedQ.answer
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

exports.delete = async (req, res) => {
    try {
        let reqBody = req.body;

        const validationMessage = await surveyValidation.deleteSurveyValidation(reqBody);
        if (validationMessage) return responseHelper.error(res, res.__(validationMessage), constants.WEB_STATUS_CODE.BAD_REQUEST);

        let surveyFound = await surveyModel.findOne({ _id: reqBody.surveyId, status: { $ne: constants.STATUS.DELETED } });
        if (!surveyFound) return responseHelper.successapi(res, res.__("surveyNotFound"), constants.META_STATUS.NO_DATA, constants.WEB_STATUS_CODE.OK);

        surveyFound.status = constants.STATUS.DELETED
        surveyFound.deletedAt = moment().format('x')

        await surveyFound.save();

        return responseHelper.successapi(res, res.__("surveyDeletedSuccessfully"), constants.META_STATUS.DATA, constants.WEB_STATUS_CODE.OK)
    } catch (e) {
        console.log('Error(survey-delete)', e);
        return responseHelper.error(res, res.__('somethingWentWrongPleaseTryAgain'), constants.WEB_STATUS_CODE.SERVER_ERROR, e);
    }
}
