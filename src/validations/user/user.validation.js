const Joi = require('joi');
Joi.objectId = require('joi-objectid')(Joi);
const helper = require('../../helpers/helper');
const constants = require('../../../config/constants');

module.exports = {
    async registerManagerValidation(req) {
        const schema = Joi.object({
            fullName: Joi.string().regex(/^[a-zA-Z\- 'éüç]+$/).max(50).required(),
            mobileNumber: Joi.string().pattern(/^[0-9]+$/),      //Joi.number().integer().min(1000000000).max(9999999999).required(),
            email: Joi.string().required().email(),
            password: Joi.string().min(6).max(15).trim().required(),
            confirmPassword: Joi.string().min(6).max(15).trim().required(),
        }).unknown(true);
        const { error } = schema.validate(req);
        if (error) {
            return helper.validationMessageKey("validation", error);
        }
        return null;
    },

    async addUserPreference(req) {
        const schema = Joi.object({
            userPreferences: Joi.object({
                cityId: Joi.array().items(Joi.string().guid({ version: 'uuidv4' })),
                zipId: Joi.array().items(Joi.string().guid({ version: 'uuidv4' })),
                stateId: Joi.string().guid({ version: 'uuidv4' })
            }).required().unknown(true)
        });
        const { error } = schema.validate(req);
        if (error) {
            return helper.validationMessageKey("validation", error);
        }
        return null;
    }
}



exports.schemaForProfileImages = Joi.object({
    profileImage: Joi.array().items(
        Joi.object({
            fieldname: Joi.string().valid("profileImage").required(),
        }).unknown(true)),
});

exports.registerValidator = (req, res, next) => {
    let validationFile;

    let body = req?.headers?.devicetype == constants.DEVICE_TYPE.WEB ? req.body : req.query;
    const validationBody = this.schemaForRegisterUser.validate(body);    //validate req.body...
    if (req.files && Object.keys(req.files).length !== 0) {
        validationFile = this.schemaForProfileImages.validate(req.files);  // validate req.files...
    }

    if (validationBody.error !== undefined || validationFile?.error !== undefined) {
        let validationErr = validationBody.error || validationFile?.error
        let validationMessage = helper.validationMessageKey('validation', validationErr);
        req.validationMessage = validationMessage;
    }
    next();

};




exports.loginValidation = (req, res, next) => {
    const schema = Joi.object({
        email: Joi.string().required().email().trim(),
        password: Joi.string().required().trim()
    }).unknown(true);

    const { error } = schema.validate(req.body);
    if (error) {
        let validationMessage = helper.validationMessageKey('validation', error);
        req.validationMessage = validationMessage;
    }
    next();
};

exports.verifyUser = (req, res, next) => {
    let schema = Joi.object({
        email: Joi.string().required().email().trim(),
        otp: Joi.string().required()
    }).unknown(true);

    const { error } = schema.validate(req.body);
    if (error) {
        let validationMessage = helper.validationMessageKey('validation', error);
        req.validationMessage = validationMessage;
    }
    next();
};

exports.forgotPasswordValidation = (req, res, next) => {
    const schema = Joi.object({
        email: Joi.string().required().email().trim(),
    }).unknown(true);

    const { error } = schema.validate(req.body);
    if (error) {
        let validationMessage = helper.validationMessageKey('validation', error);
        req.validationMessage = validationMessage;
    }
    next();
};

exports.resetPasswordValidation = (req, res, next) => {
    const schema = Joi.object({
        email: Joi.string().required().email().trim(),
        otp: Joi.required(),
        password: Joi.string().trim()
    }).unknown(true);

    const { error } = schema.validate(req.body);
    if (error) {
        let validationMessage = helper.validationMessageKey('validation', error);
        req.validationMessage = validationMessage;
    }
    next();
}

exports.schemaForEditUser = {
    fullName: Joi.string().trim().min(1),
    // lastName: Joi.string().trim().min(1),
    email: Joi.string().email().trim(),
    password: Joi.string().min(6).max(15).trim(),
    confirmPassword: Joi.string().min(6).max(15).trim(),
    // userType: Joi.string().valid('1','2'),
    mobileNumber: Joi.string().trim()
};

exports.editUserValidation = (req, res, next) => {

    const schema = Joi.object(this.schemaForEditUser).unknown(true);

    const { error } = schema.validate(Object.keys(req?.body)?.length ? req?.body : req?.query);
    if (error) {
        let validationMessage = helper.validationMessageKey('validation', error);
        req.validationMessage = validationMessage;
    }
    next();
};

exports.changePasswordValidation = (req, res, next) => {
    const schema = Joi.object({
        oldPassword: Joi.string().trim().required(),
        password: Joi.string().trim().required(),
        confirmPassword: Joi.string().trim().required()
    }).unknown(true);

    const { error } = schema.validate(req.body);
    if (error) {
        let validationMessage = helper.validationMessageKey('validation', error);
        req.validationMessage = validationMessage;
    }
    next();
};

exports.validateQuestion = (req, res, next) => {
    const schema = Joi.object({
        questionTitle: Joi.string().trim().required(),
        mcqOptions: Joi.array().items(Joi.object({
            name: Joi.string().trim().optional(),
            description: Joi.string().trim().optional(),
            isCorrect: Joi.boolean().default(false)
        })).min(1).required(),
        status: Joi.number().valid(constants.STATUS.ACTIVE).default(constants.STATUS.ACTIVE),
        questionType: Joi.number().valid(...Object.values(constants.QUESTION_TYPE)).required(),
        questionBy: Joi.number().valid(...Object.values(constants.QUESTION_BY)).default(constants.QUESTION_BY.ADMIN)
    }).unknown(true);

    const { error } = schema.validate(req.body);

    if (error) {
        const validationMessage = helper.validationMessageKey("validation", error);
        req.validationMessage = validationMessage;
    }

    next(); // Call next() if validation passes
};

