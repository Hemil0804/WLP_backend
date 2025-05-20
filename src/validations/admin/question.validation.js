const Joi = require('joi');
const helper = require('../../helpers/helper');
const constants = require('../../../config/constants');
Joi.objectId = require('joi-objectid')(Joi);


const mcqOptionSchema = Joi.object({
    name: Joi.string().required(),
    description: Joi.string().required(),
    // isCorrect: Joi.boolean().required(), // Uncomment if this field is needed
});

const addQuestionSchema = Joi.object({
    questionTitle: Joi.string().trim().min(1).required(),
    mcqOptions: Joi.array().items(mcqOptionSchema).required()  // Corrected key from mcqOption to mcqOptions
}).unknown(true);;

exports.addEditQuestionValidation = (req, res, next) => {
    const { error } = addQuestionSchema.validate(req);
    if (error) {
        return helper.validationMessageKey("validation", error);
    }
    return null;
};

exports.viewQuestionValidation = (req, res, next) => {

    const schema = Joi.object({
        questionId: Joi.objectId().required()
    }).unknown(true);

    const { error } = schema.validate(req);
    if (error) {
        return helper.validationMessageKey("validation", error);
    }
    return null;
};

exports.questionStatusChangeValidation = (req, res, next) => {

    const schema = Joi.object({
        questionId: Joi.objectId().required(),
        status: Joi.number().valid(constants.STATUS.ACTIVE, constants.STATUS.INACTIVE).required()
    }).unknown(true);

    const { error } = schema.validate(req.body);
    if (error) {
        let validationMessage = helper.validationMessageKey('validation', error);
        req.validationMessage = validationMessage;
    }
    next();
};
