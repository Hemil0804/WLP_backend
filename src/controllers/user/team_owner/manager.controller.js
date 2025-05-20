const bcrypt = require('bcrypt')
const userModel = require('../../../models/user.model');
const managerTeamModel = require('../../../models/team.model');
const subscribedUserModel = require('../../../models/subscribedUser.model');
const responseHelper = require('../../../helpers/responseHelper')
const constants = require('../../../../config/constants')
const logger = require('../../../helpers/loggerService')
const moment = require('moment')
const Helper = require("../../../helpers/helper")
const managerTransformer = require('../../../transformers/user/manager.transformer');
const { managerService,managerSurveyListService } = require("../../../services/user/manager.service")
const helper = require('../../../helpers/helper');
const userToken = require('../../../models/userToken.model');
const userValidation = require('../../../validations/user/user.validation');
const userTransformer = require('../../../transformers/user/user.transformer');


exports.addEditManager = async (req, res) => {
    try {
        let reqBody = req.body;
        let teamOwnerId = req.user._id
        let managerWithTeamOwner
        let teamOwnerData=await userModel.findOne({_id:teamOwnerId,status:constants.STATUS.ACTIVE});
        if (!teamOwnerData) return responseHelper.successapi(res, res.__('teamOwnerDataNotFound'), constants.META_STATUS.NO_DATA,constants.WEB_STATUS_CODE.OK);
        if (reqBody.managerId) {
            // const validationMessage = await userValidation.editUserValidation(reqBody);
            // if (validationMessage) return responseHelper.error(res, res.__(validationMessage), constants.WEB_STATUS_CODE.OK);

            managerWithTeamOwner = await userModel.findOne({ _id: reqBody.managerId, teamOwnerId: teamOwnerId, status: { $ne: constants.STATUS.DELETED } });
            if (!managerWithTeamOwner) return responseHelper.successapi(res, res.__('managerNotFound'), constants.META_STATUS.NO_DATA,constants.WEB_STATUS_CODE.OK);

            if (reqBody.email) {
                const userWithEmail = await userModel.findOne({ _id: { $ne: reqBody.managerId }, email: reqBody.email.toLowerCase() });
                if (userWithEmail) return responseHelper.successapi(res, res.__('emailAlreadyExist'),constants.META_STATUS.NO_DATA, constants.WEB_STATUS_CODE.OK);
            }

            managerWithTeamOwner.fullName = reqBody?.fullName ? reqBody.fullName : managerWithTeamOwner.fullName
            managerWithTeamOwner.mobileNumber = reqBody?.mobileNumber ? reqBody.mobileNumber : managerWithTeamOwner.mobileNumber
            managerWithTeamOwner.email = reqBody?.email ? reqBody.email : managerWithTeamOwner.email
            managerWithTeamOwner.address = reqBody?.address ? reqBody.address : managerWithTeamOwner.address

            await managerWithTeamOwner.save()
            managerWithTeamOwner = userTransformer.userProfileTransformer(managerWithTeamOwner);

            return responseHelper.successapi(res, res.__('managerDetailIsUpdatedSuccessfully'), constants.META_STATUS.DATA, constants.WEB_STATUS_CODE.OK, managerWithTeamOwner);
        } else {
            const validationMessage = await userValidation.registerManagerValidation(reqBody);
            if (validationMessage) return responseHelper.error(res, res.__(validationMessage), constants.WEB_STATUS_CODE.BAD_REQUEST);

            const userWithEmail = await userModel.findOne({ email: reqBody.email.toLowerCase() });
            if (userWithEmail) return responseHelper.successapi(res, res.__('emailAlreadyExist'),constants.META_STATUS.NO_DATA, constants.WEB_STATUS_CODE.OK);

            managerWithTeamOwner = new userModel()
        }

        if (reqBody.password !== reqBody.confirmPassword) {
            return responseHelper.successapi(res, res.__('passwordAndConfirmPasswordDidNotMatch'), constants.META_STATUS.NO_DATA, constants.WEB_STATUS_CODE.OK);
        }

        // if (!req?.files?.profileImage) {
        //     return responseHelper.successapi(res, res.__('profileImageRequired'), constants.META_STATUS.NO_DATA, constants.WEB_STATUS_CODE.OK);
        // }    

        reqBody.password = await bcrypt.hash(reqBody.password, 10);
        // reqBody.subscriptionId = 
        const userDetails = new userModel(reqBody);
        userDetails.teamOwnerId = teamOwnerId;
        userDetails.isSubscribed = true;
        // userDetails.subscription_type = "free"
        userDetails.userRole = constants.USER_ROLE.MANAGER;

        // Send otp
        // let otp = helper.generateOTP(ENVIRONMENT);
        // userDetails.otp = otp;
        // userDetails.otpExpiresAt = dateFormat.addTimeToCurrentTimestamp(2, 'minutes');

        await userDetails.save();
        const getTeamOwnerSubscriptionData = await subscribedUserModel.findOne({userId:teamOwnerId,status:constants.STATUS.ACTIVE});
        if (!getTeamOwnerSubscriptionData) return responseHelper.successapi(res, res.__("userDoesNotHaveAnyActiveSubscriptionPlan"), constants.META_STATUS.NO_DATA, constants.WEB_STATUS_CODE.OK);

        const subscribedUserDetails = new subscribedUserModel({
            userId: userDetails._id,
            subscriptionId:getTeamOwnerSubscriptionData.subscriptionId,
            status:1,
        });
        subscribedUserDetails.save();
        
        await userModel.findByIdAndUpdate(userDetails._id, { subscriptionId: getTeamOwnerSubscriptionData.subscriptionId, isSubscribed: true,userPreferences:teamOwnerData.userPreferences,filledPreference:true });

        const addUserTransformer = userTransformer.userProfileTransformer(userDetails);

        // //send mail
        // helper.sendOtpEmail({
        //     email: addUserTransformer.email,
        //     fullName: addUserTransformer.fullName,
        //     otp: otp,
        //     subject: 'Welcome to WLP',
        //     baseUrl: BASE_URL,
        //     path: path.join(__dirname, '../../views/emails/', 'otp-verification.ejs'),
        //     language: 'en'
        // });

        // await collection({ userId: userDetails._id }).save()

        return responseHelper.successapi(res, res.__('managerAddedSuccessfully'), constants.META_STATUS.DATA, constants.WEB_STATUS_CODE.OK, addUserTransformer);

    } catch (err) {
        console.log('Error(register)', err);
        // profileImage && helper.deleteLocalFile('user', profileImage);
        return responseHelper.error(res, res.__('somethingWentWrongPleaseTryAgain'), constants.WEB_STATUS_CODE.SERVER_ERROR, err);
    }
}

//Manager OR Team Owner List
exports.list = async (req, res) => {
    try {
        let teamManagerId = req.user._id
        let checkUser = await userModel.findOne({ _id: teamManagerId, userRole: "4", status: constants.STATUS.ACTIVE });
        if (!checkUser) return responseHelper.successapi(res, res.__("notAuthorizedTeamManagerToGetList"), constants.META_STATUS.DATA, constants.WEB_STATUS_CODE.OK)
        let reqBody = req.body
        const { limitCount, skipCount } = Helper.getPageAndLimit(reqBody.page, reqBody.limit);

        let findManagerList = await managerService({
            skip: skipCount,
            limit: limitCount,
            sortBy: reqBody.sortBy,
            sortKey: reqBody.sortKey,
            search: reqBody.search,
            teamManagerId: teamManagerId
        })
        let response = findManagerList && findManagerList.length > 0 && findManagerList[0]?.data ? findManagerList[0].data : [];
        const responseData = await managerTransformer.managerTransform(response);
        let responseMeta = {
            totalCount: findManagerList && findManagerList.length > 0 && findManagerList[0].totalRecords[0] ? findManagerList[0].totalRecords[0].count : 0,
        };

        return responseHelper.successapi(res, res.__("managerListFound"), constants.META_STATUS.DATA, constants.WEB_STATUS_CODE.OK, responseData, responseMeta)
        // let finalArray = []
        // for (item of findManagerList[0].data) {
        //     let checkManager = await managerTeamModel.find({ managerId: { $in: [item._id] } })
        //     if (checkManager.length == 0) {
        //         finalArray.push(item)
        //     }
        // }
        // console.log(finalArray, 'finalArray')
        // if (finalArray.length > 0) {
        //     findManagerList[0].data = finalArray
        //     let response = findManagerList && findManagerList.length > 0 && findManagerList[0]?.data ? findManagerList[0].data : [];
        //     const responseData = await managerTransformer.managerTransform(response);
        //     let responseMeta = {
        //         totalCount: findManagerList && findManagerList.length > 0 && findManagerList[0].totalRecords[0] ? findManagerList[0].totalRecords[0].count : 0,
        //     };

        //     return responseHelper.successapi(res, res.__("managerListFound"), constants.META_STATUS.DATA, constants.WEB_STATUS_CODE.OK, responseData, responseMeta)
        // } else {
        // return responseHelper.successapi(res, res.__("managerListFound"), constants.META_STATUS.DATA, constants.WEB_STATUS_CODE.OK)
        // }
        // Manager Transform the list
    } catch (e) {
        logger.logger.error(`Error from catch: ${e}`);
        return responseHelper.error(res, res.__('somethingWentWrongPleaseTryAgain'), constants.WEB_STATUS_CODE.SERVER_ERROR, e);
    }

}

//view manager
exports.view = async (req, res) => {
    try {
        let teamManagerId = req.user._id
        let checkUser = await userModel.findOne({ _id: teamManagerId, userRole: "4", status: constants.STATUS.ACTIVE });
        if (!checkUser) return responseHelper.successapi(res, res.__("notAuthorisedTeamManagerToViewManager"), constants.META_STATUS.DATA, constants.WEB_STATUS_CODE.OK)
        let reqBody = req.body
        let userDetails = await userModel.findOne({ _id: reqBody.managerId, status: { $ne: constants.STATUS.DELETED } });

        if (userDetails) {
            userDetails = userTransformer.userProfileTransformer(userDetails)
            return responseHelper.successapi(res, res.__("managerDetailsSuccess"), constants.META_STATUS.DATA, constants.WEB_STATUS_CODE.OK, userDetails)
        } else {
            return responseHelper.successapi(res, res.__("managerDetailsEmpty"), constants.META_STATUS.DATA, constants.WEB_STATUS_CODE.OK, userDetails)
        }
    } catch (e) {
        logger.logger.error(`Error from catch: ${e}`);
        return responseHelper.error(res, res.__('somethingWentWrongPleaseTryAgain'), constants.WEB_STATUS_CODE.SERVER_ERROR, e);
    }
}


exports.allManagerList = async (req, res) => {
    try {
        
     
        let getAllManagerList = await userModel.find({ userRole: "2", teamOwnerId: req.user._id, status: { $ne: constants.STATUS.DELETED } });
       
        const responseData = await managerTransformer.allManagerTransform(getAllManagerList);
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
        let teamManagerId = req.user._id

        let checkUser = await userModel.findOne({ _id: teamManagerId, userRole: "4", status: constants.STATUS.ACTIVE });
        if (!checkUser) return responseHelper.successapi(res, res.__("notAuthorizedTeamManagerToUpdateManagerStatus"), constants.META_STATUS.DATA, constants.WEB_STATUS_CODE.OK)

        let checkTeamManagerAccess = await userModel.findOne({ teamOwnerId: teamManagerId, _id: reqBody.managerId, status: { $ne: constants.STATUS.DELETED } });
        if (!checkTeamManagerAccess) return responseHelper.successapi(res, res.__("notAuthorizedTeamManagerToUpdateManagerStatus"), constants.META_STATUS.DATA, constants.WEB_STATUS_CODE.OK)

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
        let teamManagerId = req.user._id

        let checkUser = await userModel.findOne({ _id: teamManagerId, userRole: "4", status: constants.STATUS.ACTIVE });
        if (!checkUser) return responseHelper.successapi(res, res.__("notAuthorizedTeamManagerToDeleteManagerStatus"), constants.META_STATUS.DATA, constants.WEB_STATUS_CODE.OK)

        let checkTeamManagerAceess = await userModel.findOne({ teamOwnerId: teamManagerId, _id: reqBody.managerId, status: { $ne: constants.STATUS.DELETED } });
        if (!checkTeamManagerAceess) return responseHelper.successapi(res, res.__("notAuthorizedTeamManagerToDeleteManagerStatus"), constants.META_STATUS.DATA, constants.WEB_STATUS_CODE.OK)

        let userDetails = await userModel.findOneAndUpdate({
            _id: reqBody.managerId,
        }, { $set: { status: constants.STATUS.DELETED } });
        return responseHelper.successapi(res, res.__('managerdeletedSuccess'), constants.META_STATUS.DATA, constants.WEB_STATUS_CODE.OK);
    } catch (e) {
        logger.logger.error(`Error from catch: ${e}`);
        return responseHelper.error(res, res.__('somethingWentWrongPleaseTryAgain'), constants.WEB_STATUS_CODE.SERVER_ERROR, e);
    }
}


//survey List of all managers
// exports.surveyList = async (req, res) => {
//     try {
//         let teamOwnerId = req.user._id
//         console.log(teamOwnerId,'teamOwnerId')

//         let checkUser = await userModel.findOne({ _id: teamOwnerId, userRole: "4", status: constants.STATUS.ACTIVE });
//         if (!checkUser) return responseHelper.successapi(res, res.__("notAuthorizedTeamManagerToDeleteManagerStatus"), constants.META_STATUS.DATA, constants.WEB_STATUS_CODE.OK)

//         let reqBody = req.body
//         const { limitCount, skipCount } = Helper.getPageAndLimit(reqBody.page, reqBody.limit);

//         let findSurveyList = await managerSurveyListService({
//             skip: skipCount,
//             limit: limitCount,
//             sortBy: reqBody.sortBy,
//             sortKey: reqBody.sortKey,
//             search: reqBody.search,
//             teamOwnerId: teamOwnerId,
//             managerId: reqBody.managerId
//         })
//         console.log(JSON.stringify(findSurveyList),'findManagerList')

//         let response = findSurveyList && findSurveyList.length > 0 && findSurveyList[0]?.data ? findSurveyList[0].data : [];
//         const responseData = await managerTransformer.managerSurveyListTransform(response);
//         let responseMeta = {
//             totalCount: findSurveyList && findSurveyList.length > 0 && findSurveyList[0].totalRecords[0] ? findSurveyList[0].totalRecords[0].count : 0,
//         };

//         return responseHelper.successapi(res, res.__("SurveyListFound"), constants.META_STATUS.DATA, constants.WEB_STATUS_CODE.OK, responseData, responseMeta)
        
//     } catch (e) {
//         logger.logger.error(`Error from catch: ${e}`);
//         return responseHelper.error(res, res.__('somethingWentWrongPleaseTryAgain'), constants.WEB_STATUS_CODE.SERVER_ERROR, e);
//     }
// }
// exports.createTeam = async (req, res) => {
//     try {
//         // managerTeamModel
//         let teamManagerId = req.user._id
//         let checkUser = await userModel.findOne({ _id: teamManagerId, userRole: "4", status: constants.STATUS.ACTIVE });
//         if (!checkUser) return responseHelper.successapi(res, res.__("notAuthorisedTeamManagerToCreateTeam"), constants.META_STATUS.DATA, constants.WEB_STATUS_CODE.OK)

//         let managerExist = await userModel.find({ _id: { $in: req.body.managerId }, status: { $ne: constants.STATUS.DELETED } });
//         if (managerExist?.length !== req.body.managerId.length) return responseHelper.successapi(res, res.__("selectedManagersAreNotFound"), constants.META_STATUS.NO_DATA, constants.WEB_STATUS_CODE.OK);

//         let managerTeam = {
//             team_managerId: teamManagerId,
//             managerId: req.body.managerId,
//             name: req.body.name,
//         };

//         const mTeam = await managerTeamModel.create(managerTeam);
//         console.log(JSON.stringify(mTeam), 'mTeam')
//         const response = await managerTransformer.createTeamTransform(mTeam);
//         // console.log(response)
//         return responseHelper.successapi(res, res.__("managerTeamCreatedSuccess"), constants.META_STATUS.DATA, constants.WEB_STATUS_CODE.OK, response)
//     } catch (e) {
//         logger.logger.error(`Error from catch: ${e}`);
//         return responseHelper.error(res, res.__('somethingWentWrongPleaseTryAgain'), constants.WEB_STATUS_CODE.SERVER_ERROR, e);
//     }
// }
