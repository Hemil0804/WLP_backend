const userModel = require('../../../models/user.model');
const surveyModel = require('../../../models/survey.model');
const subscriptionModel = require('../../../models/subscription.model');
const responseHelper = require('../../../helpers/responseHelper')
const constants = require('../../../../config/constants')
const logger = require('../../../helpers/loggerService')
const moment = require('moment')
const Helper = require("../../../helpers/helper")
const managerTransformer = require('../../../transformers/admin/manager.transformer');
const { managerService, managerViewService } = require("../../../services/admin/manager.service");
const { assignContactValidation } = require('../../../validations/admin/contact.validation');
const { listTransformContactCity, listTransformContactState, listTransformContactZip } = require('../../../transformers/master.transformer');
const { viewManagerValidation } = require('../../../validations/admin/manager.validation');
const { getUserPrefrencesService } = require('../../../services/user/user.service');

//Manager OR Team Owner List

exports.assignContacts = async (req, res) => {

    // let profileImage = req.files?.profileImage?.[0]?.filename;
    try {
        let reqBody = req.body;

        // Validate the request body
        const validationMessage = await assignContactValidation(reqBody);
        if (validationMessage) return responseHelper.error(res, res.__(validationMessage), constants.WEB_STATUS_CODE.BAD_REQUEST);

        // Find the user by email
        const userWithEmail = await userModel.findOne({ _id: reqBody.managerId });
        // console.log("userWithEmail", userWithEmail)
        if (!userWithEmail) return responseHelper.successapi(res, res.__('userNotExist'), constants.META_STATUS.NO_DATA, constants.WEB_STATUS_CODE.OK);

        // Check if the user has filled out their preferences
        if (!userWithEmail.filledPreference) return responseHelper.successapi(res, res.__('userNotFilledPreference'), constants.META_STATUS.NO_DATA, constants.WEB_STATUS_CODE.OK);

        // Update the user's preferences

        const updatedUser = await userModel.findOneAndUpdate(
            { _id: reqBody.managerId },
            { $set: { assignedContacts: reqBody.contactIds, assignContact: true } },
            { new: true } // Return the updated document
        );

        // Return the updated user or handle the case where the update failed
        if (updatedUser) {
            return responseHelper.successapi(res, res.__('userAssignedContactsSuccessfully'), constants.META_STATUS.SUCCESS, constants.WEB_STATUS_CODE.OK);
        } else {
            return responseHelper.error(res, res.__('userAssignedContactsFailed'), constants.WEB_STATUS_CODE.INTERNAL_SERVER_ERROR);
        }
    } catch (err) {
        console.log('Error(register)', err);
        // profileImage && helper.deleteLocalFile('user', profileImage);
        return responseHelper.error(res, res.__('somethingWentWrongPleaseTryAgain'), constants.WEB_STATUS_CODE.SERVER_ERROR, err);
    }
}

exports.getManagerPreference = async (req, res) => {
    try {
        let reqBody = req.body;

        const validationMessage = await viewManagerValidation(reqBody);
        if (validationMessage) return responseHelper.error(res, res.__(validationMessage), constants.WEB_STATUS_CODE.BAD_REQUEST);

        let user = await userModel.findOne({ _id: reqBody.managerId, status: constants.STATUS.ACTIVE });
        // let user = await userModel.findOne({ _id: req.user._id, status: constants.STATUS.ACTIVE, isSubscribed: true, userRole: "2" });
        if (!user) return responseHelper.successapi(res, res.__('userNotFound'), constants.META_STATUS.NO_DATA, constants.WEB_STATUS_CODE.OK);

        //checked user subscribed any packages
        if (!user.isSubscribed && deviceType == constants.DEVICE_TYPE.APP)
            return responseHelper.successapi(res, res.__('pleaseSubscribeThePackagesFirstFromTheWebsite'), constants.META_STATUS.NO_DATA, constants.WEB_STATUS_CODE.OK);

        //checked user subscribed any packages
        if (!user.filledPreference)
            return responseHelper.successapi(res, res.__('pleaseAddPreferencesFirstFromTheWebsite'), constants.META_STATUS.NO_DATA, constants.WEB_STATUS_CODE.OK);

        //checked user is Manager Or Not
        if (!user.userRole == "2")
            return responseHelper.successapi(res, res.__('unAuthorisedUser'), constants.META_STATUS.NO_DATA, constants.WEB_STATUS_CODE.OK);

        let getUserPreferences = await getUserPrefrencesService({
            managerId: reqBody.managerId
        });

        // console.log("subscriptionId", user)
        let response = getUserPreferences.length > 0 ? getUserPreferences[0] : []
        let responseData = {}

        let subscriptionData = await subscriptionModel.findOne({ _id: user.subscriptionId, status: constants.STATUS.ACTIVE })
        if (!subscriptionData) return responseHelper.successapi(res, res.__('subscriptionNotFound'), constants.META_STATUS.NO_DATA, constants.WEB_STATUS_CODE.OK);
        let subscriptionDataObj = {
            subscriptionType: subscriptionData.subscriptionType,
            allowedContacts: subscriptionData.allowedContacts,
            allowedContacts: subscriptionData.allowedContacts,
            allowedSurveys: subscriptionData.allowedSurveys,
        }

        let allowedContacts = user?.assignedContacts ? user.assignedContacts.length : 0;
        let remainingContact = subscriptionData?.allowedContacts && user?.assignedContacts ? subscriptionData.allowedContacts - user.assignedContacts.length : 0;

        // final response data
        responseData = {
            name: user.fullName,
            email: user.email,
            subscription: subscriptionDataObj,
            assignedContact: allowedContacts,
            remainingContact: remainingContact,
            zipCodes: listTransformContactZip(response?.zipContactInfo),
            city: listTransformContactCity(response?.cityInfo),
            states: listTransformContactState(response?.stateInfo),
        }

        return responseHelper.successapi(res, res.__('getPrefrenceSuccessfully'), constants.META_STATUS.DATA, constants.WEB_STATUS_CODE.OK, responseData);
    } catch (err) {
        console.log('Error(login)', err);
        return responseHelper.error(res, res.__('somethingWentWrongPleaseTryAgain'), constants.WEB_STATUS_CODE.SERVER_ERROR, err);
    }
}
exports.list = async (req, res) => {
    try {
        let reqBody = req.body
        const { limitCount, skipCount } = Helper.getPageAndLimit(reqBody.page, reqBody.limit);

        let findManagerList = await managerService({
            skip: skipCount,
            limit: limitCount,
            sortBy: reqBody.sortBy,
            sortKey: reqBody.sortKey,
            search: reqBody.search,
            status: reqBody.status,
            filledPreference: reqBody.filledPreference,
            subscriptionTitle: reqBody.subscriptionType
        })

        // Manager Transform the list
        let response = findManagerList && findManagerList.length > 0 && findManagerList[0]?.data ? findManagerList[0].data : [];
        const responseData = await managerTransformer.managerTransform(response);
        // for (item of responseData) {
        //     let polltakerCount = await userModel.countDocuments({ managerId: item.id, userRole: "3" });
        //     responseData
        // }
        // console.log(responseData, 'responseData')
        let responseMeta = {
            totalCount: findManagerList && findManagerList.length > 0 && findManagerList[0].totalRecords[0] ? findManagerList[0].totalRecords[0].count : 0,
        };

        return responseHelper.successapi(res, res.__("managerListFound"), constants.META_STATUS.DATA, constants.WEB_STATUS_CODE.OK, responseData, responseMeta)
    } catch (e) {
        logger.logger.error(`Error from catch: ${e}`);
        return responseHelper.error(res, res.__('somethingWentWrongPleaseTryAgain'), constants.WEB_STATUS_CODE.SERVER_ERROR, e);
    }

}


//Manager OR Team Owner List
exports.allManagerList = async (req, res) => {
    try {
        let getAllManagerList;
        if (req.user.userRole == constants.USER_ROLE.TEAM_OWNER + '') {
            getAllManagerList = await userModel.find({ userRole: "2", teamOwnerId: req.user._id, status: { $ne: constants.STATUS.DELETED } });
        } else {
            getAllManagerList = await userModel.find({ userRole: "2", managerId: null, status: { $ne: constants.STATUS.DELETED } });
        }
        const responseData = await managerTransformer.allmanagerTransform(getAllManagerList);
        let responseMeta = {
            totalCount: responseData.length,
        };

        return responseHelper.successapi(res, res.__("managerListFound"), constants.META_STATUS.DATA, constants.WEB_STATUS_CODE.OK, responseData, responseMeta)
    } catch (e) {
        logger.logger.error(`Error from catch: ${e}`);
        return responseHelper.error(res, res.__('somethingWentWrongPleaseTryAgain'), constants.WEB_STATUS_CODE.SERVER_ERROR, e);
    }

}

//Status Update of the manager
exports.updateStatus = async (req, res) => {
    try {
        let reqBody = req.body

        const validationMessage = await viewManagerValidation(reqBody);
        if (validationMessage) return responseHelper.error(res, res.__(validationMessage), constants.WEB_STATUS_CODE.BAD_REQUEST);

        let checkManagerSurveyStatus = await surveyModel.findOne({ managerId: reqBody.managerId, surveyStatus: { $ne: "completed" } })
        if (checkManagerSurveyStatus) return responseHelper.successapi(res, res.__('managerNotAuthorisedStatus'), constants.META_STATUS.DATA, constants.WEB_STATUS_CODE.OK);

        let userDetails = await userModel.findOneAndUpdate({
            _id: reqBody.managerId,
        }, { $set: { status: reqBody.status } });

        return responseHelper.successapi(res, res.__('managerStatusUpdated'), constants.META_STATUS.DATA, constants.WEB_STATUS_CODE.OK);
    } catch (e) {
        logger.logger.error(`Error from catch: ${e}`);
        return responseHelper.error(res, res.__('somethingWentWrongPleaseTryAgain'), constants.WEB_STATUS_CODE.SERVER_ERROR, e);
    }
}


//Delete manager
exports.delete = async (req, res) => {
    try {
        let reqBody = req.body

        const validationMessage = await viewManagerValidation(reqBody);
        if (validationMessage) return responseHelper.error(res, res.__(validationMessage), constants.WEB_STATUS_CODE.BAD_REQUEST);

        let checkManagerSurveyStatus = await surveyModel.findOne({ managerId: reqBody.managerId, surveyStatus: { $ne: "completed" } })
        if (checkManagerSurveyStatus) return responseHelper.successapi(res, res.__('managerNotAuthorisedDelete'), constants.META_STATUS.DATA, constants.WEB_STATUS_CODE.OK);

        let userDetails = await userModel.findOneAndUpdate({
            _id: reqBody.managerId,
        }, { $set: { status: constants.STATUS.DELETED } });

        return responseHelper.successapi(res, res.__('managerdeletedSuccess'), constants.META_STATUS.DATA, constants.WEB_STATUS_CODE.OK);
    } catch (e) {
        logger.logger.error(`Error from catch: ${e}`);
        return responseHelper.error(res, res.__('somethingWentWrongPleaseTryAgain'), constants.WEB_STATUS_CODE.SERVER_ERROR, e);
    }
}


//view manager
exports.view = async (req, res) => {
    try {
        let reqBody = req.body

        const validationMessage = await viewManagerValidation(reqBody);
        if (validationMessage) return responseHelper.error(res, res.__(validationMessage), constants.WEB_STATUS_CODE.BAD_REQUEST);

        // let userDetails = await userModel.findOne({ _id: reqBody.managerId, status: { $ne: constants.STATUS.DELETED } });
        let userDetails = await managerViewService({ managerId: reqBody.managerId })
        // // console.log()
        // return false;
        if (userDetails.length > 0) {
            const responseData = await managerTransformer.managerViewTransform(userDetails[0]);
            return responseHelper.successapi(res, res.__("managerDetailsSuccess"), constants.META_STATUS.DATA, constants.WEB_STATUS_CODE.OK, responseData)
        } else {
            return responseHelper.successapi(res, res.__("managerDetailsEmpty"), constants.META_STATUS.DATA, constants.WEB_STATUS_CODE.OK, userDetails)
        }
    } catch (e) {
        logger.logger.error(`Error from catch: ${e}`);
        return responseHelper.error(res, res.__('somethingWentWrongPleaseTryAgain'), constants.WEB_STATUS_CODE.SERVER_ERROR, e);
    }
}