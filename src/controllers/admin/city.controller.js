const cityModel = require('../../models/city.model');
const responseHelper = require('../../helpers/responseHelper');
const cityTransformer = require('../../transformers/user/city.transformer');
const constants = require('../../../config/constants');
const helper = require('../../helpers/helper');


exports.cityList = async (req, res) => {
    try {
        let reqParam = req.body;

        let responseData = await cityModel.find({ stateId: reqParam.stateId }).sort({ name: 1 });

        responseData = cityTransformer.cityListTransformer(responseData)

        return responseHelper.successapi(res, res.__("cityListedSuccessfully"), constants.META_STATUS.DATA, constants.WEB_STATUS_CODE.OK, responseData);
    } catch (e) {
        return responseHelper.error(res, res.__("SomethingWentWrongPleaseTryAgain"), constants.WEB_STATUS_CODE.SERVER_ERROR);
    }
};
