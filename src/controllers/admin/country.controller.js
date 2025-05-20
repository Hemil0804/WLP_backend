const responseHelper = require('../../helpers/responseHelper');
const countryTransformer = require('../../transformers/user/country.transformer');
const constants = require('../../../config/constants');
const helper = require('../../helpers/helper');
const { countryService } = require("../../services/country.service")

exports.listCountry = async (req, res) => {
    try {

        let reqParam = req.body;
        const listCountry = await countryService({

            search: reqParam.search,
            sortBy: reqParam.sortBy,
            sortKey: reqParam.sortKey
        });

        let response = listCountry && listCountry.length > 0 ? listCountry : [];
        // let responseMeta = {
        //     totalCount: listCountry[0].totalRecords[0]?.count ? listCountry[0].totalRecords[0].count : 0
        // }

        const responseData = await countryTransformer.countryListTransformer(response);

        return responseHelper.successapi(res, res.__('countryListFoundSuccessfully'), constants.META_STATUS.DATA, constants.WEB_STATUS_CODE.OK, responseData);

    } catch (e) {

        return responseHelper.error(res, res.__("SomethingWentWrongPleaseTryAgain"), constants.WEB_STATUS_CODE.SERVER_ERROR);
    }
};