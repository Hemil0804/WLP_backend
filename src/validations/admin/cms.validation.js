const Joi = require('joi');
const helper = require('../helpers/helper');

const createCmsValidation = {
    title: Joi.string().min(3).required(),
    titleIt: Joi.string().min(3).required(),
    description: Joi.string().min(5).required(),
    descriptionIt: Joi.string().min(5).required()
}

const editCmsValidation = {
    cmsId: Joi.string().required().disallow(null).empty(''),
    title: Joi.string().allow("").trim(),
    titleIt: Joi.string().allow('', null).trim(),
    description: Joi.string().min(5).allow('', null).trim(),
    descriptionIt: Joi.string().min(5).allow('', null).trim(),
}
 exports.cmsAddEditValidation = (req, res, next) => {
    let schema;

    if (req.body.cmsId !== undefined) {
        schema = Joi.object(editCmsValidation).unknown(true);
    } else {
        schema = Joi.object(createCmsValidation).unknown(true);
    }

    const { error } = schema.validate(req.body);
    if (error) {
        let validationMessage = helper.validationMessageKey('validation', error);
        req.validationMessage = validationMessage;
    }
    next();
};

exports.cmsViewValidation = (req, res, next) => {
    const schema = Joi.object({
        slug: Joi.string().required(),
    }).unknown(true);

    const { error } = schema.validate(req.body);
    if (error) {
        let validationMessage = helper.validationMessageKey('validation', error);
        req.validationMessage = validationMessage;
    }
    next();
};