let userModel = require("../../models/user.model");
let contactModel = require("../../models/contact.model");
const constant = require('../../../config/constants');
const { searchHelper, facetHelper } = require('../../helpers/helper')
let ObjectId = require('mongodb').ObjectId

exports.contactAssignListService = async (data) => {
    try {
        let pipeline = [];
        // console.log(data.assignedContacts)
        
        pipeline.push(
            {
                $match: {
                    status: constant.STATUS.ACTIVE,
                    "address.latitude": { $ne: null },
                    "address.longitude": { $ne: null },
                    _id: { $in: data.assignedContacts }
                }
            },
        );
        if(data?.city && data.city.length>0){
            pipeline.push(
                {
                    $match: {
                        cityId: {$in:data.city},
                    }
                },
            );
        }

        if(data?.zip && data.zip.length>0){
            pipeline.push(
                {
                    $match: {
                        zipId: {$in:data.zip},
                    }
                },
            );
        }

        if(data?.state && data.state.length>0){
            pipeline.push(
                {
                    $match: {
                        stateId: {$in:data.state},
                    }
                },
            );
        }
        pipeline.push({
            $lookup: {
                from: 'zipContact',
                localField: 'zipId',
                foreignField: 'uuid',
                as: 'zipData'
            }
        }, {
            $lookup: {
                from: 'citiesContact',
                localField: 'cityId',
                foreignField: 'uuid',
                as: 'cityData'
            }
        }, {

            $lookup: {
                from: 'statesContact',
                localField: 'stateId',
                foreignField: 'uuid',
                as: 'stateData'
            }
        },
        );
        // {
        //     $lookup: {
        //         from: "users",
        //         let: { assignedContactsIds: "$assignedContacts" },
        //         pipeline: [
        //             {
        //                 $match: {
        //                     $expr: {
        //                         $in: ["$_id", "$$assignedContactsIds"],
        //                     },
        //                 },
        //             },
        //         ],
        //         as: "assignedContactData",
        //     },
        // },
        let obj = {}
        sortBy = data.sortBy ? data.sortBy : -1
        sortBy = parseInt(sortBy)
        let sortKey = data.sortKey ? data.sortKey : 'createdAt'
        obj[sortKey] = sortBy

        if (data.search) {
            let fieldsArray = ['firstName', 'lastName', 'email', 'mobileNumber', 'address.city', 'address.zip', 'address.state', 'address.country']
            pipeline.push(searchHelper(data.search, fieldsArray))
        }

        pipeline.push({ $sort: obj }, facetHelper(Number(data.skip), Number(data.limit)))
        const result = await contactModel.aggregate(pipeline);
        // console.log("result------", result[0])

        return result;
    } catch (e) {
        console.log(e)
        return false;
    }
}


