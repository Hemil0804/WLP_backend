const Joi = require('joi');
Joi.objectId = require('joi-objectid')(Joi);
const helper = require('../../helpers/helper');


const loginValidation = (req) => {
    const schema = Joi.object({
        email: Joi.string().trim().required().email(),
        password: Joi.string().required()
    }).unknown(true);
    const { error } = schema.validate(req);
    if (error) {
        return helper.validationMessageKey('validation', error);
    }
    return null;
};
const forgotPasswordValidation = (req) => {
    const schema = Joi.object({
        email: Joi.string().trim().required().email(),
    }).unknown(true);
    const { error } = schema.validate(req);
    if (error) {
        return helper.validationMessageKey('validation', error);
    }
    return null;
};
const resetPasswordValidation = (req) => {
    const schema = Joi.object({
        email: Joi.string().trim().required().email(),
        otp: Joi.number().required(),
        password: Joi.string().required()
    }).unknown(true);
    const { error } = schema.validate(req);
    if (error) {
        return helper.validationMessageKey('validation', error);
    }
    return null;
};
const changePasswordValidation = (req) => {
    const schema = Joi.object({
        oldPassword: Joi.string().required(),
        password: Joi.string().required()
    }).unknown(true);
    const { error } = schema.validate(req);
    if (error) {
        return helper.validationMessageKey('validation', error);
    }
    return null;
};

const editProfileValidation = (req) => {
    const schema = Joi.object({
        firstName: Joi.string().trim(),
        lastName: Joi.string().trim(),
        mobileNumber: Joi.string().pattern(/^[0-9]+$/),
    }).unknown(true);
    const { error } = schema.validate(req);
    if (error) {
        return helper.validationMessageKey('validation', error);
    }
    return null;
};

module.exports = { loginValidation, forgotPasswordValidation, resetPasswordValidation, changePasswordValidation, editProfileValidation };
