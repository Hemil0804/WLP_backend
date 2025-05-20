const Joi = require('joi');
Joi.objectId = require('joi-objectid')(Joi);
const helper = require('../../helpers/helper');
const constants = require('../../../config/constants');

module.exports = {
    async addSurveyValidation(req) {
        const schema = Joi.object({
            surveyName: Joi.string().required(),
            surveyDate: Joi.string().required(),
            polltaker: Joi.array().items(Joi.objectId()).required(),
            description: Joi.string().required(),
            contact: Joi.array().required(),
            questions: Joi.array().items(Joi.objectId()).required()
        }).unknown(true);
        const { error } = schema.validate(req);
        if (error) {
            return helper.validationMessageKey("validation", error);
        }
        return null;
    },
    async editSurveyValidation(req) {
        const schema = Joi.object({
            surveyId: Joi.objectId().required(),
            surveyName: Joi.string().optional().allow("", null),
            surveyDate: Joi.string().optional().allow("", null),
            polltaker: Joi.array().optional().allow("", null),
            description: Joi.string().optional().allow("", null),
            contact: Joi.array().optional().allow("", null),
            questions: Joi.array().optional().allow("", null),
            surveyStatus: Joi.string().optional().allow("", null).valid("pending", "completed"),
        }).unknown(true);
        const { error } = schema.validate(req);
        if (error) {
            return helper.validationMessageKey("validation", error);
        }
        return null;
    },

    async submitSurveyContactValidation(req) {
        const schema = Joi.object({
            surveyId: Joi.objectId().required(),
            contactId: Joi.objectId().required(),
            questionAnswers: Joi.array().items(
                Joi.object({
                    questionId: Joi.objectId().required(),
                    questionType: Joi.number().required(), // Assuming `question Type` is a number field
                    ansId: Joi.any().when('questionType', {
                        is: 1,  // When question Type is 1
                        then: Joi.objectId().required(), // ansId is required
                        otherwise: Joi.any().allow(null) // ansId is allowed to be null when question Type is 3
                    }),
                    answer: Joi.string().required()
                })
            ).required()
        }).unknown(true);
        const { error } = schema.validate(req);
        if (error) {
            return helper.validationMessageKey("validation", error);
        }
        return null;
    },

    async incompleteSurveyContactValidation(req) {
        const schema = Joi.object({
            surveyId: Joi.objectId().required(),
            contactId: Joi.objectId().required(),
            status: Joi.number().required().valid(1, 2, 3),
            // note: Joi.string().when('status', {
            //     is: 3,
            //     then: Joi.string().required(),
            //     otherwise: Joi.string().optional()
            // })
        }).unknown(true);
        const { error } = schema.validate(req);
        if (error) {
            return helper.validationMessageKey("validation", error);
        }
        return null;
    },

    async viewSurveyContact(req) {
        const schema = Joi.object({
            surveyId: Joi.objectId().required(),
            contactId: Joi.objectId().required(),
        }).unknown(true);

        const { error } = schema.validate(req);
        if (error) {
            return helper.validationMessageKey("validation", error);
        }
    },

    async deleteSurveyValidation(req) {
        const schema = Joi.object({
            surveyId: Joi.objectId().required()
        }).unknown(true);
        const { error } = schema.validate(req);
        if (error) {
            return helper.validationMessageKey("validation", error);
        }
        return null;
    },
}
