let countryModel = require("../models/country.model");
let stateModel = require("../models/state.model");
let cityModel = require("../models/city.model");
const constant = require('../../config/constants');
const { searchHelper, facetHelper } = require('../helpers/helper')
let ObjectId = require('mongodb').ObjectId

exports.countryService = async (data) => {
    try {
        let pipeline = [];
        pipeline.push({
            $match: {
                status: { $ne: constant.STATUS.DELETED }
            }
        })

        let obj = {}
        sortBy = data.sortBy ? data.sortBy : 1
        sortBy = parseInt(sortBy)
        let sortKey = data.sortKey ? data.sortKey : 'name'
        obj[sortKey] = sortBy;
        if (data.search) {
            let fieldsArray = ['name']
            pipeline.push(searchHelper(data.search, fieldsArray))
        }

        pipeline.push({ $sort: obj })

        const result = await countryModel.aggregate(pipeline);


        return result;
    } catch (e) {
        return false;
    }
}

exports.countryStateService = async (data) => {
    try {
        let pipeline = [];
        if (data.countryId) {
            pipeline.push({
                $match: {
                    countryId: new ObjectId(data.countryId),
                    status: { $ne: constant.STATUS.DELETED }
                }
            })
        }
        if (data.stateId) {
            pipeline.push({
                $match: {
                    _id: new ObjectId(data.stateId),
                    status: { $ne: constant.STATUS.DELETED }
                }
            })
        }
        pipeline.push({
            $match: {
                status: { $ne: constant.STATUS.DELETED }
            }
        }, {
            $lookup: {
                from: 'countries',
                let: { country: '$countryId' },
                pipeline: [{
                    $match: {
                        $expr: {
                            $and: [
                                { $eq: ['$_id', '$$country'] },
                                { $ne: ['$status', constant.STATUS.DELETED] }
                            ]
                        }
                    }
                }],
                as: 'countryData'
            }
        }, {
            $unwind: {
                path: '$countryData',
                preserveNullAndEmptyArrays: false
            }
        });

        let obj = {}
        sortBy = data.sortBy ? data.sortBy : 1
        sortBy = parseInt(sortBy)
        let sortKey = data.sortKey ? data.sortKey : 'name'
        obj[sortKey] = sortBy

        if (data.search) {
            let fieldsArray = ['name', 'countryData.name']
            pipeline.push(searchHelper(data.search, fieldsArray))
        }

        pipeline.push({ $sort: obj })

        const result = await stateModel.aggregate(pipeline);
        // console.log("states-----", result)
        return result;
    } catch (e) {
        return false;
    }
}


exports.stateCityService = async (data) => {
    try {
        let pipeline = [];

        if (data.stateId) {
            pipeline.push({
                $match: {
                    stateId: new ObjectId(data.stateId),
                    status: { $ne: constant.STATUS.DELETED_STATUS }
                }
            })
        }
        if (data.cityId) {
            pipeline.push({
                $match: {
                    _id: new ObjectId(data.cityId),
                    status: { $ne: constant.STATUS.DELETED_STATUS }
                }
            })
        }
        pipeline.push({
            $match: {
                status: { $ne: constant.STATUS.DELETED_STATUS }
            }
        }, {

            $lookup: {
                from: 'states',
                localField: 'stateId',
                foreignField: '_id',
                as: 'stateData'
            }
        }, {
            $unwind: '$stateData'
        }

            //{
            //    $lookup: {
            //        from: 'states',
            //        let: { state: '$state' },
            //        pipeline: [{
            //            $match: {
            //                $expr: {
            //                    $and: [
            //                        { $eq: ['$_id', '$$state'] },
            //                        { $ne: ['$status', constant.STATUS.DELETED_STATUS] }
            //                    ]
            //                }
            //            }
            //        }],
            //        as: 'stateData'
            //    }
            //}, {
            //    $unwind: {
            //        path: '$stateData',
            //        preserveNullAndEmptyArrays: false
            //    }
            //}

        );
        //if (data.cityId) {
        //pipeline.push({

        //        $lookup: {
        //            from: 'countries',
        //            localField: 'stateData.country',
        //            foreignField: '_id',
        //            as: 'countryData'
        //        }
        //    }, {
        //        $unwind: '$countryData'
        //    })
        //}

        let obj = {}
        sortBy = data.sortBy ? data.sortBy : 1
        sortBy = parseInt(sortBy)
        let sortKey = data.sortKey ? data.sortKey : 'name'
        obj[sortKey] = sortBy

        if (data.search) {
            let fieldsArray = ['name', 'stateData.name']
            pipeline.push(searchHelper(data.search, fieldsArray))
        }

        pipeline.push({ $sort: obj }, facetHelper(Number(data.skip), Number(data.limit)))

        const result = await cityModel.aggregate(pipeline, { allowDiskUse: true });

        console.log("stateCityService",result)
        return result;
    } catch (e) {

        console.log('e------e-------e-----', e);
        return false;
    }
}