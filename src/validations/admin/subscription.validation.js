const Joi = require('joi');
const helper = require('../../helpers/helper');
Joi.objectId = require('joi-objectid')(Joi)

let planDescriptionSchema = Joi.object({
    value: Joi.string().required()
});

let addSimulationSchema = {
    subscriptionType: Joi.number().valid(2, 3, 4).optional(),
    price: Joi.number().required(),
    title: Joi.string().trim().min(1).required(),
    description: Joi.array().items(Joi.string().trim().min(1)).required(),
    allowedContacts: Joi.number().min(1).required(),
    allowedManagers: Joi.number().min(1).required(),
    allowedPolltakers: Joi.number().min(1).required(),
    allowedSurveys: Joi.number().min(1).required(),
    // timeLine: Joi.string().trim().min(1).required(),
};

let editSimulationSchema = {
    // subscriptionType: Joi.objectId().valid(1, 2, 3, 4).required(),
    price: Joi.number().optional().allow(null, ""),
    title: Joi.string().trim().min(1).optional().allow(null, ""),
    description: Joi.array().items(Joi.string().trim().min(1)).optional()
    // allowedContacts: Joi.number().min(1).optional().allow(null),
    // allowedQuestions: Joi.number().min(1).optional().allow(null),
    // timeLine: Joi.string().trim().min(1).optional().allow(null, "")
}

exports.addSubscriptionValidation = (req, res, next) => {
    let schema

    if (req && req.subscriptionId) {
        schema = Joi.object(editSimulationSchema).unknown(true);
    } else {
        schema = Joi.object(addSimulationSchema).unknown(true);
    }

    const { error } = schema.validate(req);
    if (error) {
        return helper.validationMessageKey("validation", error);
    }
    return null;
};

exports.viewSubscriptionValidation = (req, res, next) => {

    const schema = Joi.object({
        subscriptionId: Joi.objectId().required(),
    }).unknown(true);

    const { error } = schema.validate(req);
    if (error) {
        return helper.validationMessageKey("validation", error);
    }
    return null;
};
