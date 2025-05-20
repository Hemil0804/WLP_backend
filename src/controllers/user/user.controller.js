const ejs = require('ejs');
const Joi = require('joi');
const path = require('path');
const moment = require('moment');
const bcrypt = require('bcrypt');
const jwt = require("jsonwebtoken");
Joi.objectId = require('joi-objectid')(Joi);
const { ObjectId } = require('mongoose').Types;
const Mailer = require('../../helpers/Mailer');
const helper = require('../../helpers/helper');
const userModel = require('../../models/user.model');
const contactCityModel = require('../../models/contactCity.model');
const contactStateModel = require('../../models/contactState.model');
const contactZipCodeModel = require('../../models/contactZipCode.model');
const contactModel = require('../../models/contact.model');
const constants = require('../../../config/constants');
const userToken = require('../../models/userToken.model');
const dateFormat = require('../../helpers/dateFormat.helper');
const responseHelper = require('../../helpers/responseHelper');
const subscriptionPlan = require('../../models/subscription.model');
const userValidation = require("../../validations/user/user.validation");
const subscribedUserModel = require('../../models/subscribedUser.model');
const userTransformer = require('../../transformers/user/user.transformer');
const masterTransformer = require('../../transformers/master.transformer');
// const { userAuthService } = require('../../services/user/user.service');
const { BASE_URL, JWT_AUTH_TOKEN_SECRET, ENVIRONMENT } = require('../../../config/key');
const { masterService, contactStatisticsService, surveyStatisticsService } = require('../../services/master.service');
const { getUserPrefrencesService } = require("../../services/user/user.service")
const { v4: uuidv4 } = require('uuid');


module.exports = {
    // Register user by web only 
    register: async (req, res) => {

        // let profileImage = req.files?.profileImage?.[0]?.filename;
        try {

            let reqBody = req.body;
            const validationMessage = await userValidation.registerManagerValidation(reqBody);
            if (validationMessage) return responseHelper.error(res, res.__(validationMessage), constants.WEB_STATUS_CODE.BAD_REQUEST);

            const userWithEmail = await userModel.findOne({ email: reqBody.email.toLowerCase() });
            if (userWithEmail) return responseHelper.successapi(res, res.__('emailAlreadyExist'), constants.META_STATUS.NO_DATA, constants.WEB_STATUS_CODE.OK);

            if (reqBody.password !== reqBody.confirmPassword) {
                profileImage && helper.deleteLocalFile('user', profileImage);
                return responseHelper.successapi(res, res.__('passwordAndConfirmPasswordDidNotMatch'), constants.META_STATUS.NO_DATA, constants.WEB_STATUS_CODE.OK);
            }

            // if (!req?.files?.profileImage) {
            //     return responseHelper.successapi(res, res.__('profileImageRequired'), constants.META_STATUS.NO_DATA, constants.WEB_STATUS_CODE.OK);
            // }


            let userData = new userModel();

            userData.profileImage = req?.files?.profileImage ? await helper.getFileName(req?.files?.profileImage[0]) : '';
            userData.fullName = reqBody.fullName;
            userData.mobileNumber = reqBody.mobileNumber;
            userData.email = reqBody.email;
            userData.password = await bcrypt.hash(reqBody.password, 10);
            userData.address = reqBody.address;
            // console.log('userData', userData.userPreferences);

            // userData.userPreferences.stateId = reqBody.userPreferences.stateId;

            // userData.userPreferences.cityId = reqBody.userPreferences.cityId;

            // userData.userPreferences.zipId = reqBody.userPreferences.zipId;

            userData = await userData.save()

            // Send otp
            let otp = helper.generateOTP(ENVIRONMENT);
            userData.otp = otp;
            userData.userRole = '';
            userData.otpExpiresAt = dateFormat.addTimeToCurrentTimestamp(2, 'minutes');

            await userData.save();
            const addUserTransformer = userTransformer.userLogInTransformAddressDetails(userData);

            //send mail
            helper.sendOtpEmail({
                email: addUserTransformer.email,
                fullName: addUserTransformer.fullName,
                otp: otp,
                subject: 'Welcome to WLP',
                baseUrl: BASE_URL,
                path: path.join(__dirname, '../../views/emails/', 'otp-verification.ejs'),
                language: 'en'
            });

            // await collection({ userId: userDetails._id }).save()

            return responseHelper.successapi(res, res.__('userRegistered'), constants.META_STATUS.DATA, constants.WEB_STATUS_CODE.OK, addUserTransformer);

        } catch (err) {
            console.log('Error(register)', err);
            // profileImage && helper.deleteLocalFile('user', profileImage);
            return responseHelper.error(res, res.__('somethingWentWrongPleaseTryAgain'), constants.WEB_STATUS_CODE.SERVER_ERROR, err);
        }
    },

    // Add User Preferences
    addPreference: async (req, res) => {
        try {
            let reqBody = req.body;
            let reqUserPreferences = req.body.userPreferences;
            let deviceType = req?.headers?.devicetype ? constants.DEVICE_TYPE.WEB : req.headers.devicetype;

            let user = await userModel.findOne({ _id: req.user._id, status: constants.STATUS.ACTIVE });
            // let user = await userModel.findOne({ _id: req.user._id, status: constants.STATUS.ACTIVE, isSubscribed: true, userRole: "2" });
            if (!user) return responseHelper.successapi(res, res.__('userNotFound'), constants.META_STATUS.NO_DATA, constants.WEB_STATUS_CODE.OK);

            const validationMessage = await userValidation.addUserPreference(reqBody);
            if (validationMessage) return responseHelper.error(res, res.__(validationMessage), constants.WEB_STATUS_CODE.BAD_REQUEST);

            //checked user subscribed any packages
            if (!user.isSubscribed && deviceType == constants.DEVICE_TYPE.APP)
                return responseHelper.successapi(res, res.__('pleaseSubscribeThePackagesFirstFromTheWebsite'), constants.META_STATUS.NO_DATA, constants.WEB_STATUS_CODE.OK);

            //checked user is Manager Or Not
            if (!user.userRole == "2")
                return responseHelper.successapi(res, res.__('unAuthorizedUser'), constants.META_STATUS.NO_DATA, constants.WEB_STATUS_CODE.OK);

            //checked contacts are assigned or not
            if (user.assignContact == true)
                return responseHelper.successapi(res, res.__('contactAssignedSoYouCanNotAbleToEditPreference'), constants.META_STATUS.NO_DATA, constants.WEB_STATUS_CODE.OK);

            if (reqUserPreferences.zipId.length > 0) {
                let zipExists = await contactZipCodeModel.find({ uuid: { $in: reqUserPreferences.zipId }, status: { $ne: constants.STATUS.DELETED } });
                if (zipExists?.length !== reqUserPreferences.zipId.length) return responseHelper.successapi(res, res.__("zipNotFound"), constants.META_STATUS.NO_DATA, constants.WEB_STATUS_CODE.OK);
            }
            if (reqUserPreferences.cityId.length > 0) {
                let cityExists = await contactCityModel.find({ uuid: { $in: reqUserPreferences.cityId }, status: { $ne: constants.STATUS.DELETED } });
                if (cityExists?.length !== reqUserPreferences.cityId.length) return responseHelper.successapi(res, res.__("cityNotFound"), constants.META_STATUS.NO_DATA, constants.WEB_STATUS_CODE.OK);
            }
            if (reqUserPreferences.stateId) {
                let stateExists = await contactStateModel.find({ uuid: reqUserPreferences.stateId, status: { $ne: constants.STATUS.DELETED } });
                if (!stateExists) return responseHelper.successapi(res, res.__("stateNotFound"), constants.META_STATUS.NO_DATA, constants.WEB_STATUS_CODE.OK);
            }

            let updateData = {
                "userPreferences": {
                    "cityId": reqBody.userPreferences.cityId, // Assume this comes from the request body
                    "zipId": reqBody.userPreferences.zipId,   // Assume this comes from the request body
                    "stateId": reqBody.userPreferences.stateId // Assume this comes from the request body
                },
                "filledPreference": true
            };

            let updatedUser = await userModel.findOneAndUpdate(
                { _id: req.user._id },
                { $set: updateData },
                { new: true } // Returns the updated document
            );

            return responseHelper.successapi(res, res.__('addPrefrenceSuccessfully'), constants.META_STATUS.DATA, constants.WEB_STATUS_CODE.OK);
        } catch (err) {
            console.log('Error(login)', err);
            return responseHelper.error(res, res.__('somethingWentWrongPleaseTryAgain'), constants.WEB_STATUS_CODE.SERVER_ERROR, err);
        }
    },

    // Get User Preferences
    getPreference: async (req, res) => {
        try {
            let reqBody = req.body;
            let deviceType = req?.headers?.devicetype ? constants.DEVICE_TYPE.WEB : req.headers.devicetype;
            let user = await userModel.findOne({ _id: req.user._id, status: constants.STATUS.ACTIVE });
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

            let getUserPrefrences = await getUserPrefrencesService({
                managerId: req.user._id
            });
            let response = getUserPrefrences.length > 0 ? getUserPrefrences[0] : []
            let responseData = {}
            if (response != []) {
                responseData = {
                    zipCodes: masterTransformer.listTransformContactZip(response.zipContactInfo),
                    city: masterTransformer.listTransformContactCity(response.cityInfo),
                    states: masterTransformer.listTransformContactState(response.stateInfo),
                }

            }

            return responseHelper.successapi(res, res.__('getPrefrenceSuccessfully'), constants.META_STATUS.DATA, constants.WEB_STATUS_CODE.OK, responseData);
        } catch (err) {
            console.log('Error(login)', err);
            return responseHelper.error(res, res.__('somethingWentWrongPleaseTryAgain'), constants.WEB_STATUS_CODE.SERVER_ERROR, err);
        }
    },

    // Login user...
    login: async (req, res) => {
        try {
            let reqBody = req.body
            let deviceType = req?.headers?.devicetype ? constants.DEVICE_TYPE.WEB : req.headers.devicetype;
            let user = await userModel.findByCredentials(reqBody.email, reqBody.password);

            //checked user is exist
            if (user === 1) return responseHelper.successapi(res, res.__('userAccountDoesNotExist'), constants.META_STATUS.NO_DATA, constants.WEB_STATUS_CODE.OK);

            //checked passWord and email 
            if (user === 2) return responseHelper.successapi(res, res.__('emailOrPasswordWrong'), constants.META_STATUS.NO_DATA, constants.WEB_STATUS_CODE.OK);

            //checked user subscribed any packages
            if (!user.isSubscribed && deviceType == constants.DEVICE_TYPE.APP)
                return responseHelper.successapi(res, res.__('pleaseSubscribeThePackagesFirstFromTheWebsite'), constants.META_STATUS.NO_DATA, constants.WEB_STATUS_CODE.OK);


            //checked user Prefrences
            if (!user.filledPreference && deviceType == constants.DEVICE_TYPE.APP)
                return responseHelper.successapi(res, res.__('pleaseAddPreferencesFirstFromTheWebsite'), constants.META_STATUS.NO_DATA, constants.WEB_STATUS_CODE.OK);

            // if (user === 5) message = "accountAlreadyExistsWithApple";
            // if (user === 4 || user === 5) return responseHelper.successapi(res, res.__(message), constants.META_STATUS.NO_DATA, constants.WEB_STATUS_CODE.OK);

            if (user.status === constants.STATUS.INACTIVE)
                return responseHelper.successapi(res, res.__('accountInactive'), constants.META_STATUS.NO_DATA, constants.WEB_STATUS_CODE.OK);

            let authToken = await user.generateAuthToken();
            await user.save();

            if (user.isVerified === false) {

                // Send otp
                let otp = helper.generateOTP(ENVIRONMENT);
                const expirationTime = dateFormat.addTimeToCurrentTimestamp(2, 'minutes');

                user.otp = otp;
                user.otpExpiresAt = expirationTime;

                //send mail
                helper.sendOtpEmail({
                    email: user.email,
                    fullName: user.fullName,
                    otp: otp,
                    subject: 'Welcome to WLP',
                    baseUrl: BASE_URL,
                    path: path.join(__dirname, '../../views/emails/', 'otp-verification.ejs'),
                });
            }

            user = await user.save();
            // user = JSON.parse(JSON.stringify(user));
            if (user.isSubscribed == true) {
                let getSubScribedUserData = await subscribedUserModel.findOne({ userId: user._id, status: constants.STATUS.ACTIVE });
                if (getSubScribedUserData) {
                    let getSubScriptionDetails = await subscriptionPlan.findOne({ _id: getSubScribedUserData.subscriptionId });
                    if (getSubScriptionDetails) {

                        user.subscription_type = getSubScriptionDetails.title,
                            user.subscription_description = getSubScriptionDetails.description,
                            user.subscription_detail = {
                                allowed_contacts: getSubScriptionDetails.allowedContacts,
                                allowed_managers: getSubScriptionDetails.allowedManagers,
                                allowed_polltakers: getSubScriptionDetails.allowedPolltakers,
                                allowed_survey: getSubScriptionDetails.allowedSurveys
                            }

                    }
                }
            }
            // user = await userAuthService({ userId: user._id })

            const response = userTransformer.userLogInTransformAddressDetails(user);

            if (reqBody?.deviceToken && reqBody?.deviceType) {

                //Store fcm tokens if any
                await userToken.updateOne(
                    {
                        userId: new ObjectId(response.userId),
                        deviceToken: reqBody.deviceToken
                    },
                    {
                        $set: {
                            userId: response.userId,
                            deviceToken: reqBody.deviceToken,
                            userType: reqBody.userType,
                            language: language,
                            deviceType: reqBody.deviceType,
                            status: constants.STATUS.ACTIVE
                        }
                    },
                    { upsert: true }
                );
            }
            console.log("User LogIn", user.userRole);
            return responseHelper.successapi(res, res.__('userLoggedInSuccessfully'), constants.META_STATUS.DATA, constants.WEB_STATUS_CODE.OK, response,
                {
                    token: authToken,
                    isVerified: user.isVerified
                });

        } catch (err) {
            console.log('Error(login)', err);
            return responseHelper.error(res, res.__('somethingWentWrongPleaseTryAgain'), constants.WEB_STATUS_CODE.SERVER_ERROR, err);
        }
    },

    // Purchase Subscription...
    buySubscriptionPlan: async (req, res) => {
        try {
            let reqBody = req.body;
            let userId = req.user._id;
            let subscriptionId = reqBody.subscriptionId
            let userType = constants.USER_ROLE.MANAGER;

            if (!subscriptionId) {
                return responseHelper.successapi(res, res.__('pleaseProvideSubscriptionId'), constants.META_STATUS.NO_DATA, constants.WEB_STATUS_CODE.OK);
            }

            let user = await userModel.findOne({ _id: userId, status: constants.STATUS.ACTIVE }).lean();
            if (!user) return responseHelper.successapi(res, res.__('userNotFound'), constants.META_STATUS.NO_DATA, constants.WEB_STATUS_CODE.OK);

            const checkPrevSubscription = await subscribedUserModel.findOne({
                userId: userId, status: constants.STATUS.ACTIVE
            });
            if (checkPrevSubscription) return responseHelper.successapi(res, res.__("userAlreadyHaveActivePlan"), constants.META_STATUS.NO_DATA, constants.WEB_STATUS_CODE.OK);

            const checkSubscription = await subscriptionPlan.findOne({
                _id: reqBody.subscriptionId, status: constants.STATUS.ACTIVE
            });
            if (!checkSubscription) return responseHelper.successapi(res, res.__("subscriptionNotFound"), constants.META_STATUS.NO_DATA, constants.WEB_STATUS_CODE.OK);

            const userPlan = new subscribedUserModel({
                userId: userId,
                subscriptionId: reqBody.subscriptionId,
                month: checkSubscription.month
            })

            await userPlan.save()

            if (checkSubscription.subscriptionType === constants.SUBSCRIPTION_TYPE.FREE + "") userType = constants.USER_ROLE.MANAGER;
            if (checkSubscription.subscriptionType === constants.SUBSCRIPTION_TYPE.BASIC + "") userType = constants.USER_ROLE.MANAGER;
            if (checkSubscription.subscriptionType === constants.SUBSCRIPTION_TYPE.TEAM + "") userType = constants.USER_ROLE.MANAGER;
            if (checkSubscription.subscriptionType === constants.SUBSCRIPTION_TYPE.ORGANIZATION + "") userType = constants.USER_ROLE.TEAM_OWNER;

            await userModel.findByIdAndUpdate(userId, { subscriptionId: reqBody.subscriptionId, isSubscribed: true, userRole: userType });

            return responseHelper.successapi(res, res.__('subscribeSuccessFully'), constants.META_STATUS.DATA, constants.WEB_STATUS_CODE.OK);
        } catch (err) {
            console.log('Error(viewProfile)', err);
            return responseHelper.error(res, res.__('somethingWentWrongPleaseTryAgain'), constants.WEB_STATUS_CODE.SERVER_ERROR, err);
        }
    },

    //Verify user
    verifyUser: async (req, res) => {
        try {

            let reqBody = req.body;
            reqBody.otp = +reqBody.otp;

            let user = await userModel.findOne({
                email: reqBody.email,
                status: { $ne: constants.STATUS.DELETED }
            });

            if (!user) return responseHelper.successapi(res, res.__('userNotFound'), constants.META_STATUS.NO_DATA, constants.WEB_STATUS_CODE.OK);

            // if (user?.isVerified) {
            //     const response = userTransformer.userTransformAddressDetails(user);
            //     return responseHelper.successapi(res, res.__('userAlreadyVerified'), constants.META_STATUS.DATA, constants.WEB_STATUS_CODE.OK, response, {
            //         isVerified: user.isVerified,
            //         userType: user.userType
            //     })
            // }

            if (moment().isAfter(user.otpExpiresAt)) return responseHelper.successapi(res, res.__('otpHasBeenExpired'), constants.META_STATUS.NO_DATA, constants.WEB_STATUS_CODE.OK);

            if (reqBody.otp !== user.otp) return responseHelper.successapi(res, res.__('invalidOtp'), constants.META_STATUS.NO_DATA, constants.WEB_STATUS_CODE.OK);

            user.isVerified = true;
            await user.save();

            let authToken = await user.generateAuthToken();
            const verifyuserTransformer = userTransformer.userTransformAddressDetails(user);

            // if (reqBody?.deviceToken && reqBody?.deviceType) {

            //     //Store fcm tokens if any
            //     await userToken.updateOne(
            //         {
            //             userId: new ObjectId(verifyuserTransformer.userId),
            //             deviceToken: reqBody.deviceToken
            //         },
            //         {
            //             $set: {
            //                 userId: verifyuserTransformer.userId,
            //                 userType: verifyuserTransformer.userType,
            //                 deviceToken: reqBody.deviceToken,
            //                 language: language,
            //                 deviceType: reqBody.deviceType,
            //                 status: constants.STATUS.ACTIVE
            //             }
            //         },
            //         { upsert: true }
            //     );
            // }

            return responseHelper.successapi(res, res.__('otpVerifiedSuccessfully'), constants.META_STATUS.DATA, constants.WEB_STATUS_CODE.OK, verifyuserTransformer, {
                token: authToken,
                isVerified: user.isVerified,
                userType: user.userType
            });
        } catch (err) {
            console.log('Error(verifyuser)', err);
            return responseHelper.error(res, res.__('somethingWentWrongPleaseTryAgain'), constants.WEB_STATUS_CODE.SERVER_ERROR, err);
        }
    },

    //Resend-otp
    resendOtp: async (req, res) => {
        try {

            let reqBody = req.body;

            let otp = helper.generateOTP(ENVIRONMENT);
            const expirationTime = dateFormat.addTimeToCurrentTimestamp(2, 'minutes');

            let userDetails = await user.findOneAndUpdate({
                email: reqBody.email,
                status: { $ne: constants.STATUS.DELETED }
            }, { $set: { otp, otpExpiresAt: expirationTime } });

            if (!userDetails) return responseHelper.successapi(res, res.__('userNotFound'), constants.META_STATUS.NO_DATA, constants.WEB_STATUS_CODE.OK);

            helper.sendOtpEmail({
                fullName: userDetails.fullName,
                email: userDetails.email,
                otp: otp,
                subject: language == 'WLP - Resend Verification Code',
                baseUrl: BASE_URL,
                path: path.join(__dirname, '../../views/emails/', 'resend-otp-verification.ejs'),
                language: language
            });

            return responseHelper.successapi(res, res.__('otpSendSuccessfully'), constants.META_STATUS.DATA, constants.WEB_STATUS_CODE.OK);
        } catch (err) {
            console.log('Error(resendOtp)', err);
            return responseHelper.error(res, res.__('somethingWentWrongPleaseTryAgain'), constants.WEB_STATUS_CODE.SERVER_ERROR, err);
        }
    },

    // Forgot Password
    forgotPassword: async (req, res) => {
        try {
            let reqBody = req.body;

            //existing user
            let userDetails = await userModel.findOne({
                email: reqBody.email,
                deletedAt: null,
                status: { $ne: constants.STATUS.DELETED }
            });

            if (!userDetails)
                return responseHelper.successapi(res, res.__('userNotFound'), constants.META_STATUS.NO_DATA, constants.WEB_STATUS_CODE.OK);
            if (userDetails && userDetails.status === constants.STATUS.INACTIVE)
                return responseHelper.successapi(res, res.__('userInactive'), constants.META_STATUS.NO_DATA, constants.WEB_STATUS_CODE.OK);

            //generating otp
            let otp = helper.generateOTP(ENVIRONMENT);
            const expirationTime = dateFormat.addTimeToCurrentTimestamp(2, 'minutes');

            //updating otp
            userDetails.otp = otp;
            userDetails.otpExpiresAt = expirationTime;

            await userDetails.save();

            userDetails = userDetails.toJSON();

            helper.sendOtpEmail({
                fullName: userDetails.fullName,
                email: userDetails.email,
                otp: otp,
                subject: 'WLP - Reset Password',
                baseUrl: `${BASE_URL}/public`,
                path: path.join(__dirname, '../../views/emails/', 'forgot-password.ejs'),
            });

            return responseHelper.successapi(res, res.__('otpSendSuccessfully'), constants.META_STATUS.DATA, constants.WEB_STATUS_CODE.OK);
        } catch (err) {
            console.log('Error(forgotPassword)', err);
            return responseHelper.error(res, res.__('somethingWentWrongPleaseTryAgain'), constants.WEB_STATUS_CODE.SERVER_ERROR, err);
        }
    },

    // forgotPassword: async (req, res) => {
    //     try {

    //         let deviceType = req?.headers?.devicetype ? req.headers.devicetype : constants.DEVICE_TYPE.WEB;
    //         let reqBody;
    //         if (deviceType === constants.DEVICE_TYPE.WEB) reqBody = req.body;
    //         if (deviceType === constants.DEVICE_TYPE.APP) reqBody = req.query;
    //         console.log("req.originalUrl ---", req.originalUrl)

    //         // let validationMessage = await sellerAuthValidation.forgotPasswordValidation(reqBody);
    //         if (!reqBody.email) return responseHelper.successapi(res, res.__('pleaseEnterValidEmail'), constants.META_STATUS.NO_DATA, constants.WEB_STATUS_CODE.BAD_REQUEST);

    //         //existing seller
    //         let foundUser = await userModel.findOne({ email: reqBody.email.toLowerCase() });
    //         if (!foundUser) return responseHelper.successapi(res, res.__('emailIsWrong'), constants.META_STATUS.NO_DATA, constants.WEB_STATUS_CODE.OK);
    //         // console.log(foundUser)
    //         const resetToken = await jwt.sign({ _id: foundUser._id }, JWT_AUTH_TOKEN_SECRET, { expiresIn: "5m" });
    //         await foundUser.updateOne({ resetToken: resetToken });

    //         var locals = {
    //             username: foundUser.fullName,
    //             imageLink: ``,
    //             tokenUrl: `${BASE_URL}/api/v1/user/resetpassword/${resetToken}`
    //         }

    //         let emailBody = await ejs.renderFile(path.join(__dirname, "../../views/emails/", "forgot-password.ejs"), { locals: locals });
    //         //sending mail to user
    //         Mailer.sendEmail(foundUser.email, emailBody, 'Reset Password');

    //         return responseHelper.successapi(res, res.__('resetPWDLikSentInMail'), constants.META_STATUS.DATA, constants.WEB_STATUS_CODE.OK);
    //     } catch (err) {
    //         console.log('Error(forgotPassword)', err);
    //         return responseHelper.error(res, res.__('somethingWentWrongPleaseTryAgain'), constants.WEB_STATUS_CODE.SERVER_ERROR, err);
    //     }
    // },
    //Reset Password

    resetPassword: async (req, res) => {
        try {
            let reqBody = req.body;

            // reqBody.otp = +reqBody.otp;

            let userDetails = await userModel.findOne({ email: reqBody.email, status: constants.STATUS.ACTIVE });

            if (!userDetails)
                return responseHelper.successapi(res, res.__('userNotFound'), constants.META_STATUS.NO_DATA, constants.WEB_STATUS_CODE.OK);

            // if (userDetails.otp !== reqBody.otp)
            //     return responseHelper.successapi(res, res.__('otpNotValid'), constants.META_STATUS.NO_DATA, constants.WEB_STATUS_CODE.OK);

            // if (moment().isAfter(userDetails.otpExpiresAt, 'x'))
            //     return responseHelper.successapi(res, res.__('otpHasBeenExpired'), constants.META_STATUS.NO_DATA, constants.WEB_STATUS_CODE.OK);

            let password = await bcrypt.hash(reqBody.password, 10);

            await userModel.updateOne({ email: reqBody.email, deletedAt: null }, { $set: { password: password } });

            return responseHelper.successapi(res, res.__('passwordChangedSuccessfully'), constants.META_STATUS.DATA, constants.WEB_STATUS_CODE.OK);
        } catch (err) {
            console.log('Error(resetPassword)', err);
            return responseHelper.error(res, res.__('somethingWentWrongPleaseTryAgain'), constants.WEB_STATUS_CODE.SERVER_ERROR, err);
        }
    },

    //Reset Password Mobile
    resetPasswordMobile: async (req, res) => {
        try {

            let reqBody;

            reqBody.otp = +reqBody.otp;

            let userDetails = await userModel.findOne({ email: reqBody.email, status: constants.STATUS.ACTIVE }).lean();

            if (!userDetails)
                return responseHelper.successapi(res, res.__('userNotFound'), constants.META_STATUS.NO_DATA, constants.WEB_STATUS_CODE.OK);

            if (reqBody.otp) {

                if (userDetails.otp !== reqBody.otp)
                    return responseHelper.successapi(res, res.__('otpNotValid'), constants.META_STATUS.NO_DATA, constants.WEB_STATUS_CODE.OK);

                if (moment().isAfter(userDetails.otpExpiresAt, 'x'))
                    return responseHelper.successapi(res, res.__('otpHasBeenExpired'), constants.META_STATUS.NO_DATA, constants.WEB_STATUS_CODE.OK);
            }

            if (reqBody?.password) {
                let password = await bcrypt.hash(reqBody.password, 10);
                await user.updateOne({ email: reqBody.email, deletedAt: null }, { $set: { password: password } });
            } else {
                return responseHelper.successapi(res, res.__('validOtp'), constants.META_STATUS.DATA, constants.WEB_STATUS_CODE.OK);
            }

            return responseHelper.successapi(res, res.__('passwordChangedSuccessfully'), constants.META_STATUS.DATA, constants.WEB_STATUS_CODE.OK);
        } catch (err) {
            console.log('Error(resetPasswordMobile)', err);
            return responseHelper.error(res, res.__('somethingWentWrongPleaseTryAgain'), constants.WEB_STATUS_CODE.SERVER_ERROR, err);
        }
    },

    //view-profile
    viewProfile: async (req, res) => {
        try {
            const user = req.user;

            let userProfile = await userModel.findOne({ _id: user._id, status: constants.STATUS.ACTIVE }).lean();
            if (!userProfile) return responseHelper.successapi(res, res.__('userNotFound'), constants.META_STATUS.NO_DATA, constants.WEB_STATUS_CODE.OK);
            if (userProfile.isSubscribed == true) {
                let getSubScribedUserData = await subscribedUserModel.findOne({ userId: userProfile._id, status: constants.STATUS.ACTIVE });
                if (getSubScribedUserData) {
                    let getSubScriptionDetails = await subscriptionPlan.findOne({ _id: getSubScribedUserData.subscriptionId });
                    if (getSubScriptionDetails) {

                        userProfile.subscription_type = getSubScriptionDetails.title,
                            userProfile.subscription_description = getSubScriptionDetails.description,
                            userProfile.subscription_detail = {
                                allowed_contacts: getSubScriptionDetails.allowedContacts,
                                allowed_polltakers: getSubScriptionDetails.allowedPolltakers,
                                allowed_survey: getSubScriptionDetails.allowedSurveys
                            }

                    }
                }
            }
            const response = userTransformer.userProfileTransformer(userProfile);
            return responseHelper.successapi(res, res.__('userProfileFoundSuccessFully'), constants.META_STATUS.DATA, constants.WEB_STATUS_CODE.OK, response);

        } catch (err) {
            console.log('Error(viewProfile)', err);
            return responseHelper.error(res, res.__('somethingWentWrongPleaseTryAgain'), constants.WEB_STATUS_CODE.SERVER_ERROR, err);
        }
    },

    //Edit profile
    editProfile: async (req, res) => {
        try {
            let deviceType = req?.headers?.devicetype ? req.headers.devicetype : constants.DEVICE_TYPE.WEB;
            let reqBody

            if (deviceType === constants.DEVICE_TYPE.WEB) reqBody = req.body;
            if (deviceType === constants.DEVICE_TYPE.APP) reqBody = req.query;

            const user = req.user;
            let oldImage;

            let userData = await userModel.findOne({ _id: user._id, status: constants.STATUS.ACTIVE });

            if (userData.email !== reqBody.email) {

                const existingEmail = await userModel.findOne({
                    _id: { $ne: user._id },
                    email: reqBody.email,
                    status: { $ne: constants.STATUS.DELETED }
                });
                if (existingEmail) {
                    return responseHelper.successapi(res, res.__('emailAlreadyExist'), constants.META_STATUS.NO_DATA, constants.WEB_STATUS_CODE.OK);
                }
            }
            if (userData.mobileNumber !== reqBody.mobileNumber) {

                const existingMobileNumber = await userModel.findOne({
                    _id: { $ne: user._id },
                    mobileNumber: reqBody.mobileNumber,
                    status: { $ne: constants.STATUS.DELETED }
                });
                if (existingMobileNumber) {
                    return responseHelper.successapi(res, res.__('emailAlreadyExist'), constants.META_STATUS.NO_DATA, constants.WEB_STATUS_CODE.OK);
                }
            }

            if (req?.files?.profileImage) {
                if (userData.profileImage !== "") {
                    oldImage = userData.profileImage
                }
            }

            userData.fullName = reqBody?.fullName ? reqBody.fullName : userData.fullName;
            userData.email = reqBody?.email ? reqBody.email : userData.email;
            userData.address = reqBody?.address ? reqBody.address : userData.address;
            userData.mobileNumber = reqBody?.mobileNumber ? reqBody.mobileNumber : userData.mobileNumber;
            userData.profileImage = req?.files?.profileImage ? await helper.getFileName(req.files.profileImage[0]) : userData.profileImage;

            userData = await userData.save();
            userData = JSON.parse(JSON.stringify(userData));
            if (oldImage && req?.files?.profileImage) await helper.deleteLocalFile('user', oldImage);

            const response = userTransformer.userProfileTransformer(userData);
            return responseHelper.successapi(res, res.__('profileEditSuccessfully'), constants.META_STATUS.DATA, constants.WEB_STATUS_CODE.OK, response, { isVerified: response.isVerified });
        } catch (err) {
            console.log('Error(editProfile)', err);
            return responseHelper.error(res, res.__('somethingWentWrongPleaseTryAgain'), constants.WEB_STATUS_CODE.SERVER_ERROR, err);
        }
    },

    //Change Password
    changePassword: async (req, res) => {
        try {
            let reqBody = req.body;

            let userExist = await userModel.findOne({ _id: req.user._id, status: constants.STATUS.ACTIVE });
            if (!userExist)
                return responseHelper.successapi(res, res.__('userNotFound'), constants.META_STATUS.NO_DATA, constants.WEB_STATUS_CODE.OK);

            let isMatch = bcrypt.compareSync(reqBody.oldPassword, userExist.password);
            if (!isMatch)
                return responseHelper.successapi(res, res.__('oldPasswordDoesNotMatch'), constants.META_STATUS.NO_DATA, constants.WEB_STATUS_CODE.OK);

            if (reqBody.oldPassword === reqBody.password)
                return responseHelper.successapi(res, res.__('oldPasswordAndNewPasswordCanNotBeSame'), constants.META_STATUS.NO_DATA, constants.WEB_STATUS_CODE.OK);

            if (reqBody.password !== reqBody.confirmPassword)
                return responseHelper.successapi(res, res.__('passwordConfirmPasswordNotSame'), constants.META_STATUS.NO_DATA, constants.WEB_STATUS_CODE.OK);

            let newPassword = await bcrypt.hash(reqBody.password, 10);

            await userModel.updateOne({ _id: req.user._id }, { password: newPassword });
            return responseHelper.successapi(res, res.__('passwordChangedSuccessfully'), constants.META_STATUS.DATA, constants.WEB_STATUS_CODE.OK);
        } catch (err) {
            console.log('Error(changePassword)', err);
            return responseHelper.error(res, res.__('somethingWentWrongPleaseTryAgain'), constants.WEB_STATUS_CODE.SERVER_ERROR, err);
        }
    },

    logOut: async (req, res) => {
        try {
            let reqBody = req.body;
            let userId = req.user._id;

            if (reqBody?.deviceToken) {
                await userToken.updateOne(
                    {
                        userId: userId,
                        deviceToken: reqBody.deviceToken,
                        status: constants.STATUS.ACTIVE,
                    },
                    {
                        $set: {
                            status: constants.STATUS.DELETED,
                        }
                    },
                );
            };

            return responseHelper.successapi(res, res.__('userLogoutSuccessfully'), constants.META_STATUS.DATA, constants.WEB_STATUS_CODE.OK);
        } catch (err) {
            console.log('Error(logOut)', err);
            return responseHelper.error(res, res.__('somethingWentWrongPleaseTryAgain'), constants.WEB_STATUS_CODE.SERVER_ERROR, err);
        }
    },

    masterList: async (req, res) => {
        try {

            let reqBody = req.body;

            // let validationMessage = await mainCategoryValidation.mainCategoryValidation(reqParam);
            // if (validationMessage) return responseHelper.error(res, res.__(validationMessage), FAILURE);

            // size List...
            let listData = await masterService({
                // sortBy: reqParam.sortBy,
                // sortKey: reqParam.sortKey,
                // categoryId: reqParam.categoryId
            });

            let masterListResponse = {
                city: listData[0].cities,
                states: listData[0].states,
                zipCodes: listData[0].zipCodes,
            }

            return responseHelper.successapi(res, res.__("masterListed"), constants.META_STATUS.DATA, constants.WEB_STATUS_CODE.OK, masterListResponse);
        } catch (e) {
            console.log('Error(masterList)', err);
            return responseHelper.error(res, res.__('somethingWentWrongPleaseTryAgain'), constants.WEB_STATUS_CODE.SERVER_ERROR, err);
        }
    },

    masterUserPresenceList: async (req, res) => {
        try {
            let reqBody = req.body;

            let zipSearchQuery = {};
            if (reqBody?.cityId && reqBody.cityId !== "") {
                zipSearchQuery.cityId = reqBody.cityId;
            }
            let contactZipCode = await contactZipCodeModel.find(zipSearchQuery);

            let citySearchQuery = {};
            if (reqBody?.stateId && reqBody.stateId !== "") {
                citySearchQuery.stateId = reqBody.stateId;
            }
            let contactCity = await contactCityModel.find(citySearchQuery);

            let contactState = await contactStateModel.find();

            let masterListResponse = {
                zipCodes: masterTransformer.listTransformContactZip(contactZipCode),
                city: masterTransformer.listTransformContactCity(contactCity),
                states: masterTransformer.listTransformContactState(contactState),
            }

            return responseHelper.successapi(res, res.__("masterListed"), constants.META_STATUS.DATA, constants.WEB_STATUS_CODE.OK, masterListResponse);
        } catch (e) {
            console.log('Error(masterList)', e);
            return responseHelper.error(res, res.__('somethingWentWrongPleaseTryAgain'), constants.WEB_STATUS_CODE.SERVER_ERROR, err);
        }
    },

    statisticsList: async (req, res) => {
        try {

            let reqBody = req.body;

            // let validationMessage = await mainCategoryValidation.mainCategoryValidation(reqParam);
            // if (validationMessage) return responseHelper.error(res, res.__(validationMessage), FAILURE);

            // survey...
            let surveyStatistics = await surveyStatisticsService({ pollTaker: req.user._id });
            surveyStatistics = surveyStatistics.length > 0 ? surveyStatistics[0] : []

            let surveyTotal = surveyStatistics?.total ? surveyStatistics.total : 0
            let surveyPending = surveyStatistics?.pending ? surveyStatistics.pending : 0
            let surveyInProcess = surveyStatistics?.inProcess ? surveyStatistics.inProcess : 0
            let surveyCompleted = surveyStatistics?.completed ? surveyStatistics.completed : 0

            // contact...
            let contactStatistics = await contactStatisticsService({ pollTaker: req.user._id });
            contactStatistics = contactStatistics.length > 0 ? contactStatistics[0] : []

            let contactTotal = contactStatistics?.total ? contactStatistics.total : 0
            let contactPending = contactStatistics?.pending ? contactStatistics.pending : 0
            let contactCompleted = contactStatistics?.completed ? contactStatistics.completed : 0
            let contactRefuse = contactStatistics?.refuse ? contactStatistics.refuse : 0
            let contactNoAnswer = contactStatistics?.noanswer ? contactStatistics.noanswer : 0
            let contactOther = contactStatistics?.other ? contactStatistics.other : 0

            let statisticsListResponse = {
                survey: { total: surveyTotal, pending: surveyPending, inProcess: surveyInProcess, completed: surveyCompleted },
                contact: { total: contactTotal, pending: contactPending, completed: contactCompleted, refuse: contactRefuse, noAnswer: contactNoAnswer, other: contactOther }
            }

            return responseHelper.successapi(res, res.__("statisticsListed"), constants.META_STATUS.DATA, constants.WEB_STATUS_CODE.OK, statisticsListResponse);
        } catch (e) {
            console.log('Error(masterList)', err);
            return responseHelper.error(res, res.__('somethingWentWrongPleaseTryAgain'), constants.WEB_STATUS_CODE.SERVER_ERROR, err);
        }
    }
}

// const socialLoginRegister = async (req, res) => {
//     try {
//         let deviceType = req?.headers?.devicetype ? req.headers.devicetype : constants.DEVICE_TYPE.WEB;
//         let reqParam = deviceType == constants.DEVICE_TYPE.WEB ? req.body : req?.query;

//         if (!reqParam.type) return responseHelper.error(res, res.__('validationSocialLogInTypeRequired'), constants.WEB_STATUS_CODE.OK);

//         if (reqParam.type == 'login') {

//             let validationMessage = await userValidation.socialLoginValidation(reqParam);
//             validationMessage && helper.deleteFilesIfAnyValidationError(req.files ? req.files : {});
//             if (validationMessage) return responseHelper.error(res, res.__(validationMessage), constants.WEB_STATUS_CODE.OK);

//             let existinguser = await user.findOne({ email: reqParam.email, status: constants.STATUS.ACTIVE });

//             if (existinguser && existinguser.status === constants.STATUS.INACTIVE)
//                 return responseHelper.successapi(res, res.__('accountInactive'), constants.META_STATUS.NO_DATA, constants.WEB_STATUS_CODE.OK, null, { isInactive: true, isAlert: reqParam.isAlert });

//             if (!existinguser) return responseHelper.successapi(res, res.__("userNotFound"), constants.META_STATUS.DATA, constants.WEB_STATUS_CODE.OK, { isLogin: false }, { isRegistered: false, isAlert: reqParam.isAlert });

//             if (reqParam.socialType == 'google') {
//                 let message;
//                 let checkGoogleuser, isRegistered = existinguser ? true : false;

//                 if (existinguser.isSocialuser === true) {
//                     if (existinguser.socialType !== reqParam.socialType) {
//                         let message;

//                         if (existinguser.socialType == 'google') message = "accountAlreadyExistsWithGoogle"
//                         if (existinguser.socialType == 'apple') message = "accountAlreadyExistsWithApple"
//                         // return responseHelper.successapi(res, res.__(message), constants.META_STATUS.NO_DATA, constants.WEB_STATUS_CODE.OK);
//                     } else {
//                         checkGoogleuser = existinguser;
//                         message = "accountAlreadyExistsWithThisEmail";
//                     }
//                 } else {
//                     message = "accountAlreadyExistsWithThisEmail";
//                     // return responseHelper.successapi(res, res.__('accountAlreadyExistsWithThisEmail'), constants.META_STATUS.NO_DATA, constants.WEB_STATUS_CODE.OK);
//                 }

//                 const tokenData = {
//                     _id: checkGoogleuser._id.toString(),
//                     fullName: checkGoogleuser.fullName,
//                     userType: checkGoogleuser.userType,
//                     email: checkGoogleuser.email,
//                     status: checkGoogleuser.status
//                 }

//                 if (reqParam.deviceToken) {
//                     let userToken = await userToken.findOne({
//                         userId: checkGoogleuser._id,
//                         deviceToken: reqParam.deviceToken
//                     });
//                     if (!userToken) {
//                         let deviceToken = {
//                             userId: checkGoogleuser._id,
//                             deviceToken: reqParam.deviceToken,
//                         }
//                         await userToken.create(deviceToken);
//                     }
//                 }

//                 const token = await jwt.sign(tokenData, JWT_AUTH_TOKEN_SECRET, { expiresIn: JWT_EXPIRES_IN });

//                 const response = userTransformer.userLogInTransformAddressDetails(checkGoogleuser)
//                 message = !isRegistered ? "userLoggedInSuccessfullyViaSocial" : message;
//                 console.log('message', message);
//                 console.log('isRegistered', isRegistered);
//                 return responseHelper.successapi(res, res.__("userLoggedInSuccessfullyViaSocial"), constants.META_STATUS.DATA, constants.WEB_STATUS_CODE.OK, response, {
//                     token,
//                     isVerified: checkGoogleuser.isVerified,
//                     isRegistered,
//                     isAlert: reqParam.isAlert
//                 });

//             }
//         } else if (reqParam.type == 'register') {

//             let validationMessage = await userValidation.socialLoginValidation(reqParam);
//             validationMessage && helper.deleteFilesIfAnyValidationError(req.files ? req.files : {});
//             if (validationMessage) return responseHelper.error(res, res.__(validationMessage), constants.WEB_STATUS_CODE.OK);

//             let existinguser = await user.findOne({ email: reqParam.email, status: { $ne: constants.STATUS.DELETED } });
//             if (!existinguser) {
//                 let validationMessage = await userValidation.socialSignUpValidation(reqParam);
//                 validationMessage && helper.deleteFilesIfAnyValidationError(req.files ? req.files : {});
//                 if (validationMessage) return responseHelper.error(res, res.__(validationMessage), constants.WEB_STATUS_CODE.OK);
//             }

//             if (existinguser && existinguser?.status === constants.STATUS.INACTIVE)
//                 return responseHelper.successapi(res, res.__('accountInactive'), constants.META_STATUS.NO_DATA, constants.WEB_STATUS_CODE.OK, null, { isInactive: true, isAlert: reqParam.isAlert });

//             if (existinguser) return responseHelper.successapi(res, res.__("userAlreadyExist"), constants.META_STATUS.DATA, constants.WEB_STATUS_CODE.OK, null, { isRegistered: true, isAlert: reqParam.isAlert });

//             if (reqParam.socialType == 'google') {
//                 let googleuser;
//                 let checkGoogleuser;
//                 if (!existinguser) {
//                     checkGoogleuser = await user.findOne({
//                         socialId: reqParam.sub,
//                         socialType: reqParam.socialType,
//                         isSocialuser: true,
//                         status: constants.STATUS.ACTIVE
//                     });
//                     if (!checkGoogleuser) {

//                         let userData = {
//                             fullName: reqParam.fullName,
//                             email: reqParam.email,
//                             profileImage: req?.files?.picture?.length ? req?.files?.picture?.[0]?.filename : reqParam?.picture,
//                             isVerified: true,
//                             socialType: reqParam.socialType,
//                             mobileNumber: reqParam.mobileNumber,
//                             socialId: reqParam.sub,
//                             isSocialuser: true,
//                             status: constants.STATUS.ACTIVE,
//                         }
//                         googleuser = await user.create(userData);
//                         await collection({ userId: googleuser._id }).save()
//                     }

//                     checkGoogleuser = checkGoogleuser || googleuser;
//                 } else {

//                     if (existinguser.isSocialuser === true) {
//                         if (existinguser.socialType !== reqParam.socialType) {
//                             let message;

//                             if (existinguser.socialType == 'google') message = "accountAlreadyExistsWithGoogle"
//                             if (existinguser.socialType == 'apple') message = "accountAlreadyExistsWithApple"
//                             return responseHelper.successapi(res, res.__(message), constants.META_STATUS.NO_DATA, constants.WEB_STATUS_CODE.OK);
//                         } else {
//                             if (req?.files?.picture?.length) {
//                                 existinguser.profileImage = req.files?.picture?.[0]?.filename;
//                                 await existinguser.save();
//                             }
//                             checkGoogleuser = existinguser;
//                         }
//                     } else {
//                         return responseHelper.successapi(res, res.__('accountAlreadyExistsWithThisEmail'), constants.META_STATUS.NO_DATA, constants.WEB_STATUS_CODE.OK);
//                     }
//                 }

//                 const tokenData = {
//                     _id: checkGoogleuser._id.toString(),
//                     fullName: checkGoogleuser.fullName,
//                     userType: checkGoogleuser.userType,
//                     email: checkGoogleuser.email,
//                     status: checkGoogleuser.status
//                 }

//                 if (reqParam.deviceToken) {
//                     let userToken = await userToken.findOne({
//                         userId: checkGoogleuser._id,
//                         deviceToken: reqParam.deviceToken
//                     });
//                     if (!userToken) {
//                         let deviceToken = {
//                             userId: checkGoogleuser._id,
//                             deviceToken: reqParam.deviceToken,
//                         }
//                         await userToken.create(deviceToken);
//                     }
//                 }

//                 const token = await jwt.sign(tokenData, JWT_AUTH_TOKEN_SECRET, { expiresIn: JWT_EXPIRES_IN });

//                 const response = userTransformer.userLogInTransformAddressDetails(checkGoogleuser)
//                 return responseHelper.successapi(res, res.__("userLoggedInSuccessfullyViaSocial"), constants.META_STATUS.DATA, constants.WEB_STATUS_CODE.OK, response, {
//                     token,
//                     isVerified: checkGoogleuser.isVerified,
//                     isAlert: reqParam.isAlert
//                 });

//             }
//         }

//     } catch (e) {
//         console.log(e)
//         return responseHelper.error(res, res.__("somethingWentWrongPleaseTryAgain"), constants.WEB_STATUS_CODE.SERVER_ERROR);
//     }
// };


// const deleteAccount = async (req, res) => {
//     try {
//         let reqBody = req.body;
//         let userId = req.user._id;

//         if (reqBody?.deviceToken) {
//             await userToken.updateOne(
//                 {
//                     userId: userId,
//                     deviceToken: reqBody.deviceToken,
//                     status: constants.STATUS.ACTIVE,
//                 },
//                 {
//                     $set: {
//                         status: constants.STATUS.DELETED,
//                     }
//                 },
//             );
//         }

//         userervices.updateOneuser({ _id: userId }, {
//             status: constants.STATUS.DELETED,
//             deletedAt: dateFormat.setCurrentTimestamp()
//         });
//         await Notification.updateMany({
//             $or: [
//                 {
//                     userId: userId
//                 },
//                 {
//                     'notification.userId': {
//                         $in: [userId.toString(), userId]
//                     }
//                 }
//             ]
//         }, { $set: { deletedAt: dateFormat.setCurrentTimestamp() } });


//         return responseHelper.successapi(res, res.__('userAccountDeletedSuccessfully'), constants.META_STATUS.DATA, constants.WEB_STATUS_CODE.OK);
//     } catch (err) {
//         console.log('Error(deleteAccount)', err);
//         return responseHelper.error(res, res.__('somethingWentWrongPleaseTryAgain'), constants.WEB_STATUS_CODE.SERVER_ERROR, err);
//     }
// };