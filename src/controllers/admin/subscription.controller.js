const subscriptionModel = require('../../models/subscription.model');
const userModel = require('../../models/user.model');
const logger = require('../../helpers/loggerService');
const constants = require("../../../config/constants");
const responseHelper = require('../../helpers/responseHelper');
const { subscriptionViewTransformer, subscriptionListTransformer } = require("../../transformers/admin/admin.transformer");
const { addSubscriptionValidation, viewSubscriptionValidation } = require('../../validations/admin/subscription.validation');

module.exports = {
    addEditSubscription: async (req, res) => {
        try {
            const reqBody = req.body;
            let findSubscription, message

            function createSlug(text) {
                return text
                    .toLowerCase() // Convert to lowercase
                    .trim() // Remove leading/trailing spaces
                    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
                    .replace(/\s+/g, '-') // Replace spaces with hyphens
                    .replace(/-+/g, '-'); // Remove multiple hyphens
            }

            const validationMessage = await addSubscriptionValidation(reqBody)
            if (validationMessage) return responseHelper.error(res, res.__(validationMessage), constants.WEB_STATUS_CODE.BAD_REQUEST);

            if (reqBody.subscriptionId) {

                findSubscription = await subscriptionModel.findOne({ _id: reqBody.subscriptionId, status: constants.STATUS.ACTIVE });
                if (!findSubscription) return responseHelper.successapi(res, res.__("subscriptionNotFound"), constants.META_STATUS.NO_DATA, constants.WEB_STATUS_CODE.OK);

                let findSubscriptionTitle = await subscriptionModel.findOne({ _id: { $ne: reqBody.subscriptionId }, slug: createSlug(reqBody?.title), status: constants.STATUS.ACTIVE });
                if (findSubscriptionTitle) return responseHelper.successapi(res, res.__("subscriptionTitleAlreadyTaken"), constants.META_STATUS.NO_DATA, constants.WEB_STATUS_CODE.OK);

                message = "subscriptionUpdated"

            } else {

                let findSubscriptionTitle = await subscriptionModel.findOne({ slug: createSlug(reqBody?.title), status: constants.STATUS.ACTIVE });
                if (findSubscriptionTitle) return responseHelper.successapi(res, res.__("subscriptionTitleAlreadyTaken"), constants.META_STATUS.NO_DATA, constants.WEB_STATUS_CODE.OK);

                findSubscription = new subscriptionModel()
                message = "subscriptionAdded"
            }

            findSubscription.subscriptionType = reqBody?.subscriptionType ? constants.SUBSCRIPTION_TYPE.BASIC : findSubscription.subscriptionType
            // findSubscription.subscriptionType = constants.SUBSCRIPTION_TYPE.BASIC
            findSubscription.price = reqBody?.price ? reqBody.price : findSubscription.price
            findSubscription.title = reqBody?.title ? reqBody.title : findSubscription.title
            findSubscription.slug = reqBody?.title ? createSlug(reqBody.title) : findSubscription.slug
            findSubscription.description = reqBody?.description ? reqBody.description : findSubscription.description
            findSubscription.allowedContacts = reqBody?.allowedContacts ? reqBody.allowedContacts : findSubscription.allowedContacts
            // findSubscription.allowedQuestions = reqBody?.allowedQuestions ? reqBody.allowedQuestions : findSubscription.allowedQuestions
            findSubscription.allowedManagers = reqBody?.allowedManagers ? reqBody.allowedManagers : findSubscription.allowedManagers
            findSubscription.allowedPolltakers = reqBody?.allowedPolltakers ? reqBody.allowedPolltakers : findSubscription.allowedPolltakers
            findSubscription.allowedSurveys = reqBody?.allowedSurveys ? reqBody.allowedSurveys : findSubscription.allowedSurveys

            // findSubscription.timeLine = reqBody?.timeLine ? reqBody.timeLine : findSubscription.timeLine

            await findSubscription.save()

            const response = subscriptionViewTransformer(findSubscription);
            return responseHelper.successapi(res, res.__(message), constants.META_STATUS.DATA, constants.WEB_STATUS_CODE.OK, response);
        } catch (e) {
            console.log(e)
            logger.logger.error(`Error from catch: ${e}`);
            return responseHelper.error(res, res.__('somethingWentWrongPleaseTryAgain'), constants.WEB_STATUS_CODE.SERVER_ERROR, e);
        }
    },
    viewSubscription: async (req, res) => {
        try {
            let reqBody = req.body;

            const validationMessage = await viewSubscriptionValidation(reqBody)
            if (validationMessage) return responseHelper.error(res, res.__(validationMessage), constants.WEB_STATUS_CODE.BAD_REQUEST);

            let findSubscription = await subscriptionModel.findOne({ _id: reqBody.subscriptionId, status: constants.STATUS.ACTIVE });
            if (!findSubscription) return responseHelper.successapi(res, res.__("subscriptionNotFound"), constants.META_STATUS.NO_DATA, constants.WEB_STATUS_CODE.OK);

            const response = subscriptionViewTransformer(findSubscription);
            return responseHelper.successapi(res, res.__("subscriptionFound"), constants.META_STATUS.DATA, constants.WEB_STATUS_CODE.OK, response);
        } catch (e) {
            logger.logger.error(`Error from catch: ${e}`);
            return responseHelper.error(res, res.__('somethingWentWrongPleaseTryAgain'), constants.WEB_STATUS_CODE.SERVER_ERROR, e);
        }
    },
    listSubscription: async (req, res) => {
        try {
            let reqBody = req.body;
            let query = {
                status: constants.STATUS.ACTIVE
            };

            if (reqBody.subscriptionType) query.subscriptionType = reqBody.subscriptionType

            let findSubscription = await subscriptionModel.find(query).sort({ month: 1 });
            let totalCount = await subscriptionModel.find(query).countDocuments();

            const response = subscriptionListTransformer(findSubscription);
            return responseHelper.successapi(res, res.__("subscriptionFound"), constants.META_STATUS.DATA, constants.WEB_STATUS_CODE.OK, response, { totalCount });
        } catch (e) {
            logger.logger.error(`Error from catch: ${e}`);
            return responseHelper.error(res, res.__('somethingWentWrongPleaseTryAgain'), constants.WEB_STATUS_CODE.SERVER_ERROR, e);
        }
    },

    deleteSubscription: async (req, res) => {
        try {
            let reqBody = req.body

            const validationMessage = await viewSubscriptionValidation(reqBody)
            if (validationMessage) return responseHelper.error(res, res.__(validationMessage), constants.WEB_STATUS_CODE.BAD_REQUEST);

            let checkManagerOwnPackage = await userModel.findOne({ subscriptionId: reqBody.subscriptionId, status: { $ne: constants.STATUS.DELETED } })
            if (checkManagerOwnPackage) return responseHelper.successapi(res, res.__('managerOwnThisPackageSoYouAreCanNotDelete'), constants.META_STATUS.DATA, constants.WEB_STATUS_CODE.OK);

            let subscriptionDetails = await subscriptionModel.findOneAndUpdate({
                _id: reqBody.subscriptionId,
            }, { $set: { status: constants.STATUS.DELETED } });

            return responseHelper.successapi(res, res.__('packageDeletedSuccess'), constants.META_STATUS.DATA, constants.WEB_STATUS_CODE.OK);
        } catch (e) {
            logger.logger.error(`Error from catch: ${e}`);
            return responseHelper.error(res, res.__('somethingWentWrongPleaseTryAgain'), constants.WEB_STATUS_CODE.SERVER_ERROR, e);
        }
    }
}