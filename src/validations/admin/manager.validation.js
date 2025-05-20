const Joi = require('joi');
const helper = require('../../helpers/helper');
Joi.objectId = require('joi-objectid')(Joi)

const viewManagerValidation = (req, res) => {
    console.log(req)
    const schema = Joi.object({
        managerId: Joi.objectId().required()
    }).unknown(true);

    const { error } = schema.validate(req);
    if (error) {
        return helper.validationMessageKey('validation', error);
    }
};


// const reviewUserValidation = (req, res) => {
//     console.log(req)
//     const schema = Joi.object({
//         userId: Joi.objectId().required(),
//         status: Joi.number().valid(1, 2).required()
//     }).unknown(true);

//     const { error } = schema.validate(req);
//     if (error) {
//         return helper.validationMessageKey('validation', error);
//     }
// };

module.exports = { viewManagerValidation };