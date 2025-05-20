const state = require('../../models/city.model');

const responseHelper = require('../../helpers/responseHelper');
const cityTransformer = require('../../transformers/user/city.transformer');
const constants = require('../../../config/constants');
const helper = require('../../helpers/helper');
const { countryStateService } = require('../../services/country.service');

exports.stateList = async (req, res) => {
    try {

        let reqParam = req.body;
        const listState = await countryStateService({
            countryId: reqParam.countryId,
            search: reqParam.search,
            sortBy: reqParam.sortBy,
            sortKey: reqParam.sortKey
        });

        let response = listState && listState.length > 0 ? listState : [];

        let responseMeta = {
            totalCount: listState.length || ''
        }

        const responseData = await cityTransformer.cityListTransformer(response);

        return responseHelper.successapi(res, res.__('countryListFoundSuccessfully'), constants.META_STATUS.DATA, constants.WEB_STATUS_CODE.OK, responseData, responseMeta);

    } catch (e) {
        return responseHelper.error(res, res.__("SomethingWentWrongPleaseTryAgain"), constants.WEB_STATUS_CODE.SERVER_ERROR);
    }
};





