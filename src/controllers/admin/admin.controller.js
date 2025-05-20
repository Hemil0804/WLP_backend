// const User = require('../../models/admin.model');
const UserToken = require('../../models/userToken.model');
const User = require('../../models/user.model');
const responseHelper = require('../../helpers/responseHelper')
const constants = require('../../../config/constants')
const adminValidation = require('../../validations/admin/admin.validation')
const logger = require('../../helpers/loggerService')
const bcrypt = require('bcrypt')
const adminTransformer = require('../../transformers/admin/admin.transformer')
const helper = require('../../helpers/helper');
const dateFormat = require('../../helpers/dateFormat.helper');
const path = require('path');
const moment = require('moment')
const { BASE_URL, ENVIRONMENT } = require('../../../config/key');

//Login User
// exports.login = async (req, res) => {
//     try {
//         let reqBody = req.body;

//         let validationMessage = adminValidation.loginValidation(reqBody);
//         if (validationMessage) return responseHelper.error(res, res.__(validationMessage), constants.WEB_STATUS_CODE.BAD_REQUEST);

//         let existingUser = await User.findOne({ email: reqBody.email, status: constants.STATUS.ACTIVE });
//         if (!existingUser) return responseHelper.successapi(res, res.__('emailOrPasswordWrong'), constants.META_STATUS.NO_DATA, constants.WEB_STATUS_CODE.OK);

//         const validPassword = await bcrypt.compare(reqBody.password, existingUser.password);
//         if (!validPassword) return responseHelper.successapi(res, res.__('emailOrPasswordWrong'), constants.META_STATUS.NO_DATA, constants.WEB_STATUS_CODE.OK);

//         let token = await existingUser.generateAuthToken();

//         if (reqBody.deviceToken) {
//             let adminToken = await UserToken.findOne({ userId: existingUser._id, deviceToken: reqBody.deviceToken });
//             if (!adminToken) {
//                 const amdminData = {
//                     userId: existingUser._id,
//                     deviceToken: reqBody.deviceToken,
//                     deviceType: constants.DEVICE_TYPE.WEB,
//                     appVersion: ''
//                 }

//                 await UserToken.create(amdminData);
//             }
//         }

//         const response = adminTransformer.adminTransformer(existingUser);
//         return responseHelper.successapi(res, res.__('adminLoggedInSuccessfully'), constants.META_STATUS.DATA, constants.WEB_STATUS_CODE.OK, response, { token });
//     } catch (e) {
//         return responseHelper.error(res, res.__('somethingWentWrongPleaseTryAgain'), constants.WEB_STATUS_CODE.SERVER_ERROR, e);
//     }
// };

//Forgot Password
exports.forgotPassword = async (req, res) => {
    try {
        let reqBody = req.body;

        let validationMessage = adminValidation.forgotPasswordValidation(reqBody);
        if (validationMessage) return responseHelper.error(res, res.__(validationMessage), constants.WEB_STATUS_CODE.BAD_REQUEST);

        //existing admin
        let foundUser = await User.findOne({ email: reqBody.email, userRole: constants.USER_ROLE.ADMIN + '', status: constants.STATUS.ACTIVE });
        if (!foundUser) return responseHelper.successapi(res, res.__('emailWrong'), constants.META_STATUS.NO_DATA, constants.WEB_STATUS_CODE.OK);

        //generating otp
        let otp = helper.generateOTP(ENVIRONMENT);
        const expirationTime = dateFormat.addTimeToCurrentTimestamp(2, 'minutes');

        //updating otp
        foundUser.otp = otp;
        foundUser.expirationTime = expirationTime;

        await foundUser.save();
        helper.sendOtpEmail({
            firstName: foundUser.firstName,
            lastName: foundUser.lastName,
            email: foundUser.email,
            otp: otp,
            subject: 'WLP - Reset Password',
            baseUrl: BASE_URL,
            path: path.join(__dirname, '../../views/emails/', 'forgot-password.ejs'),
        });

        return responseHelper.successapi(res, res.__('otpSendSuccessfully'), constants.META_STATUS.DATA, constants.WEB_STATUS_CODE.OK);
    } catch (e) {
        return responseHelper.error(res, res.__('somethingWentWrongPleaseTryAgain'), constants.WEB_STATUS_CODE.SERVER_ERROR, e);

    }
};

//Reset Password
exports.resetPassword = async (req, res) => {
    try {
        let reqBody = req.body;

        let emailValidation = adminValidation.resetPasswordValidation(reqBody);
        if (emailValidation) return responseHelper.error(res, res.__(emailValidation), constants.WEB_STATUS_CODE.BAD_REQUEST);

        reqBody.otp = +reqBody.otp;

        let adminDetails = await User.findOne({ email: reqBody.email, userRole: constants.USER_ROLE.ADMIN + '', status: constants.STATUS.ACTIVE });
        if (!adminDetails)
            return responseHelper.successapi(res, res.__('adminNotFound'), constants.META_STATUS.NO_DATA, constants.WEB_STATUS_CODE.OK);

        if (adminDetails.otp !== reqBody.otp)
            return responseHelper.successapi(res, res.__('otpNotValid'), constants.META_STATUS.NO_DATA, constants.WEB_STATUS_CODE.OK);

        if (moment().isAfter(adminDetails.otpExpiresAt, 'x'))
            return responseHelper.successapi(res, res.__('otpHasBeenExpired'), constants.META_STATUS.NO_DATA, constants.WEB_STATUS_CODE.OK);

        let password = await bcrypt.hash(reqBody.password, 10);

        await User.updateOne({ email: reqBody.email }, { $set: { password: password } });
        return responseHelper.successapi(res, res.__('passwordChangedSuccessfully'), constants.META_STATUS.DATA, constants.WEB_STATUS_CODE.OK);

    } catch (e) {
        return responseHelper.error(res, res.__('somethingWentWrongPleaseTryAgain'), constants.WEB_STATUS_CODE.SERVER_ERROR, e);

    }
};

//Change Password
exports.changePassword = async (req, res) => {
    try {
        let reqBody = req.body;

        let passwordValidation = adminValidation.changePasswordValidation(reqBody);
        if (passwordValidation) return responseHelper.error(res, res.__(passwordValidation), constants.WEB_STATUS_CODE.BAD_REQUEST);

        let adminExist = await User.findOne({ _id: req.admin._id, status: constants.STATUS.ACTIVE }).lean();
        if (!adminExist) return responseHelper.successapi(res, res.__('adminNotFound'), constants.META_STATUS.NO_DATA, constants.WEB_STATUS_CODE.OK);

        let isMatch = await bcrypt.compareSync(reqBody.oldPassword, adminExist.password);
        if (!isMatch) return responseHelper.successapi(res, res.__('oldPasswordDoesNotMatch'), constants.META_STATUS.NO_DATA, constants.WEB_STATUS_CODE.OK);

        if (reqBody.oldPassword === reqBody.password) return responseHelper.successapi(res, res.__('oldPasswordAndNewPasswordCanNotBeSame'), constants.META_STATUS.NO_DATA, constants.WEB_STATUS_CODE.OK);
        let newPassword = await bcrypt.hash(reqBody.password, 10);

        await User.updateOne({ _id: req.admin._id }, { password: newPassword });
        return responseHelper.successapi(res, res.__('passwordChangedSuccessfully'), constants.META_STATUS.DATA, constants.WEB_STATUS_CODE.OK);
    } catch (e) {
        return responseHelper.error(res, res.__('somethingWentWrongPleaseTryAgain'), constants.WEB_STATUS_CODE.SERVER_ERROR, err);

    }
};

//View User Profile
exports.viewProfile = async (req, res) => {
    try {
        const viewProfile = await User.findOne({ _id: req.admin._id, status: constants.STATUS.ACTIVE });
        if (!viewProfile) return responseHelper.successapi(res, res.__('adminNotFound'), constants.META_STATUS.NO_DATA, constants.WEB_STATUS_CODE.OK);

        let responseData = await adminTransformer.adminViewProfileTransformer(viewProfile);
        return responseHelper.successapi(res, res.__('adminFoundSuccessfully'), constants.META_STATUS.DATA, constants.WEB_STATUS_CODE.OK, responseData);
    } catch (e) {
        return responseHelper.error(res, res.__('SomethingWentWrongPleaseTryAgain'), constants.WEB_STATUS_CODE.SERVER_ERROR);
    }
};

//Edit User Profile
exports.editProfile = async (req, res) => {
    try {
        let reqBody = req.body;

        let editInfoValidation = adminValidation.editProfileValidation(reqBody);
        if (editInfoValidation) return responseHelper.error(res, res.__(editInfoValidation), constants.WEB_STATUS_CODE.BAD_REQUEST);

        let emailRegex = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/g;
        if (reqBody?.email && !emailRegex.test(reqBody?.email)) {
            return responseHelper.error(res, res.__('validationEmailEmail'), constants.WEB_STATUS_CODE.BAD_REQUEST);
        }

        if (reqBody.email != req.user.email) {
            let isEmailAlreadyInUse = await User.countDocuments({ email: reqBody.email, _id: { $ne: req.user._id } });
            if (isEmailAlreadyInUse) {
                return responseHelper.successapi(res, res.__('emailAlreadyInUse'), constants.META_STATUS.NO_DATA,constants.WEB_STATUS_CODE.OK);
            }
        }

        const foundUser = await User.findOne({ _id: req.admin._id, userRole: constants.USER_ROLE.ADMIN + '', status: constants.STATUS.ACTIVE });
        if (!foundUser) return responseHelper.successapi(res, res.__('adminNotFound'), constants.META_STATUS.NO_DATA, constants.WEB_STATUS_CODE.OK);


        foundUser.fullName = reqBody.fullName ? reqBody.fullName : foundUser.fullName;
        foundUser.email = reqBody.email ? reqBody.email : foundUser.email;
        foundUser.address = reqBody.address ? reqBody.address : foundUser.address;
        foundUser.mobileNumber = reqBody.mobileNumber ? reqBody.mobileNumber : foundUser.mobileNumber;

        if (req?.files?.profilePicture) {
            if (typeof reqBody.profilePicture === "string") {
                foundUser.profilePicture = foundUser.profilePicture
            } else {
                if (foundUser.profilePicture != '') await helper.deleteFile({
                    'name': foundUser.profilePicture,
                    folderName: 'admin'
                });

                foundUser.profilePicture = await helper.getFileName(req.files.profilePicture[0]);
            }

        }

        await foundUser.save();

        let adminDetail = adminTransformer.adminTransformer(foundUser);
        return responseHelper.successapi(res, res.__('profileUpdatedSuccessfully'), constants.META_STATUS.DATA, constants.WEB_STATUS_CODE.OK, adminDetail);
    } catch (e) {
        return responseHelper.error(res, res.__('SomethingWentWrongPleaseTryAgain'), constants.WEB_STATUS_CODE.SERVER_ERROR);
    }
};

//Resend Otp
exports.resendOtp = async (req, res) => {
    try {
        let reqBody = req.body;

        let validationMessage = adminValidation.forgotPasswordValidation(reqBody);
        if (validationMessage) return responseHelper.error(res, res.__(validationMessage), constants.WEB_STATUS_CODE.BAD_REQUEST);

        let otp = helper.generateOTP(ENVIRONMENT);
        // const expirationTime = dateFormat.addTimeToCurrentTimestamp(2, 'minutes');

        let userDetails = await User.findOneAndUpdate({
            email: reqBody.email,
            status: constants.STATUS.ACTIVE
        }, { $set: { otp/*, otpExpiresAt: expirationTime*/ } });

        if (!userDetails) return responseHelper.successapi(res, res.__('adminNotFound'), constants.META_STATUS.NO_DATA, constants.WEB_STATUS_CODE.OK);

        helper.sendOtpEmail({
            'firstName': userDetails.fullName,
            'email': userDetails.email,
            'otp': otp,
            'subject': 'WLP - Resend Verification Code',
            'baseUrl': BASE_URL,
            'path': path.join(__dirname, '../../views/emails/', 'resend-otp-verification.ejs'),
        });

        return responseHelper.successapi(res, res.__('otpSendSuccessfully'), constants.META_STATUS.DATA, constants.WEB_STATUS_CODE.OK);
    } catch (e) {
        return responseHelper.error(res, res.__('somethingWentWrongPleaseTryAgain'), constants.WEB_STATUS_CODE.SERVER_ERROR, e);

    }
};

//Logout
exports.logout = async (req, res) => {
    try {
        let reqBody = req.body;
        let adminId = req.admin._id;

        if (reqBody.deviceToken) {
            await UserToken.deleteOne({ userId: adminId, deviceToken: reqBody.deviceToken });
        }
        return responseHelper.successapi(res, res.__('adminLogoutSuccessfully'), constants.META_STATUS.DATA, constants.WEB_STATUS_CODE.OK);
    } catch (e) {
        return responseHelper.error(res, res.__('somethingWentWrongPleaseTryAgain'), constants.WEB_STATUS_CODE.SERVER_ERROR, e);
    }
}   