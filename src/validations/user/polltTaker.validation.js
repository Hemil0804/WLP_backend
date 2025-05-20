const Joi = require('joi');
Joi.objectId = require('joi-objectid')(Joi);
const helper = require('../../helpers/helper');
const constants = require('../../../config/constants');

module.exports = {
    async addPollTakerValidation(req) {
        const schema = Joi.object({
            fullName: Joi.string().regex(/^[a-zA-Z\- 'éüç]+$/).max(50).required(),
            // mobileNumber: Joi.number().integer().min(1000000000).max(9999999999).required(),
            email: Joi.string().required().email(),
            password: Joi.string().min(6).max(15).trim().required(),
            confirmPassword: Joi.string().min(6).max(15).trim().required(),
        }).unknown(true);
        const { error } = schema.validate(req);
        if (error) {
            return helper.validationMessageKey("validation", error);
        }
        return null;
    }
}
