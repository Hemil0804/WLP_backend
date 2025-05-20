const path = require('path');
const moment = require('moment');
const Joi = require('joi');
Joi.objectId = require('joi-objectid')(Joi);
const { ObjectId } = require('mongoose').Types;
const responseHelper = require('../../helpers/responseHelper');
const constants = require('../../../config/constants');
const helper = require('../../helpers/helper');
const userTransformer = require('../../transformers/user/user.transformer');
const dateFormat = require('../../helpers/dateFormat.helper');
// const userervices = require('../../services/user.services');
const contactModel = require('../../models/contact.model');
const userModel = require('../../models/user.model');
const surveyModel = require('../../models/survey.model');
const { contactListTransform, contactViewTransform } = require('../../transformers/user/contact.transformer');
const jwt = require("jsonwebtoken");

const { contactAssignListService } = require('../../services/user/contact.service');
// const contactValidation = require('../../validations/user/contact.validation');


module.exports = {
    // list: async (req, res) => {
    //     try {
    //         // let deviceType = req?.headers?.devicetype ?   constants.DEVICE_TYPE.WEB :req.headers.devicetype;
    //         let reqBody = req.body;
    //         let contactList;

    //         const page = parseInt(reqBody.page) || 1;
    //         const limit = parseInt(reqBody.limit) || 10;
    //         const skip = (page - 1) * limit;
    //         const searchText = reqBody.searchText || '';

    //         // Build the search query
    //         let searchQuery = {
    //             status: constants.STATUS.ACTIVE,
    //             "address.latitude": { $ne: null },
    //             "address.longitude": { $ne: null }
    //         };

    //         if (searchText) {
    //             searchQuery.$or = [
    //                 { "firstName": { $regex: searchText, $options: 'i' } },
    //                 { "lastName": { $regex: searchText, $options: 'i' } },
    //                 { "email": { $regex: searchText, $options: 'i' } },
    //                 { "mobileNumber": { $regex: searchText, $options: 'i' } },
    //                 { "address.city": { $regex: searchText, $options: 'i' } },
    //                 { "address.zipCode": { $regex: searchText, $options: 'i' } },
    //                 { "address.state": { $regex: searchText, $options: 'i' } },
    //                 { "address.country": { $regex: searchText, $options: 'i' } }
    //             ];
    //         }

    //         if (reqBody.city && reqBody.city.length > 0) {
    //             searchQuery['address.city'] = { $in: reqBody.city };
    //         }

    //         // Add state filter if provided
    //         if (reqBody.state && reqBody.state.length > 0) {
    //             searchQuery['address.state'] = { $in: reqBody.state };
    //         }

    //         // Add zip code filter if provided
    //         if (reqBody.zipCode && reqBody.zipCode.length > 0) {
    //             searchQuery['address.zip'] = { $in: reqBody.zipCode };
    //         }

    //         // Get the total count of active contacts
    //         const totalCount = await contactModel.countDocuments(searchQuery);

    //         if (reqBody.devicetype === "web") {
    //             contactList = await contactModel.find(searchQuery)
    //         } else {
    //             // Fetch the paginated list of active contacts
    //             contactList = await contactModel.find(searchQuery)
    //                 .skip(skip)
    //                 .limit(limit);
    //         }

    //         // Transform the list
    //         const response = contactList && contactList.length > 0 ? contactListTransform(contactList) : [];

    //         return responseHelper.successapi(res, res.__("contactListed"), constants.META_STATUS.DATA, constants.WEB_STATUS_CODE.OK, response, {
    //             totalCount,
    //             currentPage: page,
    //             totalPages: Math.ceil(totalCount / limit)
    //         });
    //     } catch (e) {
    //         return responseHelper.error(res, res.__('somethingWentWrongPleaseTryAgain'), constants.WEB_STATUS_CODE.SERVER_ERROR, e);
    //     }
    // },

    listContact: async (req, res) => {
        try {
            let reqBody = req.body;
            const { limitCount, skipCount } = helper.getPageAndLimit(reqBody.page, reqBody.limit);
            let contactList;

            let user = await userModel.findOne({ _id: req.user._id, })
            if (!user) return responseHelper.successapi(res, res.__('userNotFound'), constants.META_STATUS.NO_DATA, constants.WEB_STATUS_CODE.OK);


            if (!user.assignContact)
                return responseHelper.successapi(res, res.__('pleaseWaitForAssignContactFromAdmin'), constants.META_STATUS.NO_DATA, constants.WEB_STATUS_CODE.OK);

            // Build the search query
            const contactListData = await contactAssignListService({
                skip: skipCount,
                assignedContacts: user.assignedContacts,
                limit: limitCount,
                search: reqBody.searchText,
                sortBy: reqBody.sortBy,
                city: reqBody.city,
                state: reqBody.state,
                zip: reqBody.zipCode,
                sortKey: reqBody.sortKey,
            });

            // console.log("response", contactListData)
            // Transform the list
            contactList = contactListData && contactListData.length > 0 ? contactListData[0].data : [];

            // console.log("response")
            // console.log("response")
            const response = contactList && contactList.length > 0 ? await contactListTransform(contactList) : [];

            return responseHelper.successapi(res, res.__("contactListed"), constants.META_STATUS.DATA, constants.WEB_STATUS_CODE.OK, response);
        } catch (e) {
            console.log("eeeeeeeeeee", e)

            return responseHelper.error(res, res.__('somethingWentWrongPleaseTryAgain'), constants.WEB_STATUS_CODE.SERVER_ERROR, e);
        }
    },

    viewContact: async (req, res) => {
        try {
            let reqBody = req.body;

            if (!reqBody.contactId || reqBody.contactId.trim() === "") return responseHelper.error(res, res.__('PleaseProvideContactId'), constants.WEB_STATUS_CODE.BAD_REQUEST);

            // let contact = await contactModel.findOne({ _id: reqBody.contactId, status: constants.STATUS.ACTIVE }).lean();
            let contact = await contactModel.aggregate([
                {
                    $match: {
                        _id: new ObjectId(reqBody.contactId),  // Ensure the contactId is converted to ObjectId
                        status: constants.STATUS.ACTIVE
                    }
                },{
                    $lookup: {
                        from: 'zipContact',
                        localField: 'zipId',
                        foreignField: 'uuid',
                        as: 'zipData'
                    }
                }, {
                    $lookup: {
                        from: 'citiesContact',
                        localField: 'cityId',
                        foreignField: 'uuid',
                        as: 'cityData'
                    }
                }, {
        
                    $lookup: {
                        from: 'statesContact',
                        localField: 'stateId',
                        foreignField: 'uuid',
                        as: 'stateData'
                    }
                },
                {
                    $limit: 1 // To mimic the behavior of findOne, you can limit the results to 1 document
                }
            ]).exec();
            if (!contact) return responseHelper.successapi(res, res.__('contactNotFound'), constants.META_STATUS.NO_DATA, constants.WEB_STATUS_CODE.OK);
            let getSurveyData = await surveyModel.find({ 'contact.contactId': new ObjectId(reqBody.contactId), managerId: req.user._id, status: { $ne: constants.STATUS.DELETED } });
            if (getSurveyData.length > 0) {
                getSurveyData = getSurveyData.map(item => {
                    return {
                        ...item.toObject(),  // Convert Mongoose Document to a plain object
                        totalQuestion: item.questions ? item.questions.length : 0,
                        totalPollTaker: item.polltaker ? item.polltaker.length : 0
                    };
                });
            }
            // console.log(getSurveyData);
            contact[0].surveyData = getSurveyData;
            // console.log(contact, 'contact')
            // return false;
            const response = contactViewTransform(contact[0]);
            return responseHelper.successapi(res, res.__('contactFoundSuccessFully'), constants.META_STATUS.DATA, constants.WEB_STATUS_CODE.OK, response);

        } catch (err) {
            console.log('Error(contactView)', err);
            return responseHelper.error(res, res.__('somethingWentWrongPleaseTryAgain'), constants.WEB_STATUS_CODE.SERVER_ERROR, err);
        }
    },

}